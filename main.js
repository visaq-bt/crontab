#!/usr/bin/env node

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const fs = require("fs");

const Record = mongoose.model(
  "Record",
  new mongoose.Schema({ origin: String, year: Number, values: Object })
);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO);

    const date = get_date();
    const new_records = JSON.parse(
      fs.readFileSync(`data/${date.string}.json`, "utf8")
    );

    for (origin in new_records) {
      const result = await Record.updateOne(
        { origin, year: date.year },
        { [`values.${date.month}-${date.day}`]: new_records[origin] }
      );

      if (!result.matchedCount)
        await Record.create({
          origin,
          year: date.year,
          values: { [`${date.month}-${date.day}`]: new_records[origin] },
        });
    }
  } catch (error) {
    mongoose.connection.close();
    process.exit(100);
  }

  mongoose.connection.close();
})();

const get_date = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const string = `${year}-${month.toString().padStart(2, "0")}-${day}`;

  return { year, month, day, string };
};
