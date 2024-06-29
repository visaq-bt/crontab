#!/usr/bin/env node

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const fs = require("fs");

const Record = mongoose.model(
  "Record",
  new mongoose.Schema({
    origin: String,
    year: Number,
    a: [Number],
    b: [Number],
    c: [Number],
    d: [Number],
    volatility: Number,
  })
);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO);

    const date_str = process.argv[2];
    const date = new Date(date_str);

    const new_records = JSON.parse(
      fs.readFileSync(`data/${date_str}.json`, "utf8")
    );
    for (origin in new_records) {
      const new_record = new_records[origin];

      try {
        const record = await Record.findOne({
          origin,
          year: date.getFullYear(),
        });
        if (record) {
          const volatility = get_volatility(record, new_record);
          await Record.updateOne(
            { _id: record._id },
            {
              $push: {
                a: new_record[0],
                b: new_record[1],
                c: new_record[2],
                d: new_record[3],
              },
              $inc: { volatility },
            }
          );
        } else {
          const buffer = create_buffer(date);
          await Record.create({
            origin,
            year: date.getFullYear(),
            a: [...buffer, new_record[0]],
            b: [...buffer, new_record[1]],
            c: [...buffer, new_record[2]],
            d: [...buffer, new_record[3]],
            volatility: 0,
          });
        }
      } catch (error) {}
    }

    // health check
    const num_days = get_num_days();
    const records = await Record.find().select({
      origin: 1,
      a: 1,
      b: 1,
      c: 1,
      d: 1,
    });

    for (const record of records) {
      let set = {};
      for (const x of "abcd") {
        const diff = num_days - record[x].length;
        if (diff <= 0) continue;
        set[x] = [...record[x], ...new Array(diff).fill(-1)];
      }
      if (Object.keys(set).length === 0) continue;
      const result = await Record.updateOne({ _id: record._id }, { $set: set });
    }
  } catch (error) {
    mongoose.connection.close();
    process.exit(100);
  }

  mongoose.connection.close();
})();

const create_buffer = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const buffer_len = Math.ceil((date - start) / 86400000) - 1;

  let buffer = [];
  for (var i = 0; i < buffer_len; i++) {
    buffer.push(-1);
  }

  return buffer;
};

const get_volatility = (record, new_record) => {
  const abcd = "abcd";

  let sum = 0;
  for (let i = 0; i < abcd.length; i++) {
    const n1 = record[abcd[i]][record[abcd[i]].length - 1];
    const n2 = new_record[i];
    if (n1 * n2 < 0) sum += 1000;
    sum += Math.abs(n1 - n2);
  }

  return sum;
};

const get_num_days = function () {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  return Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
};
