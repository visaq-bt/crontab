#!/bin/sh
export PATH="$PATH:/usr/local/bin"
cd crontab/gvwt

# check ran already
today=$(date +"%Y-%m-%d")
last_date=$(tail -n 1 logs.txt | awk '{print $1}')
if [ "$last_date" = "$today" ]; then
    exit 0
fi

today_time=$(date +"%Y-%m-%d %T")

# run python
python3 main.py $today
if [ $? != 0 ]; then
    echo "${today_time} 1" >>logs.txt
    exit 1
fi

# run js
node main.js $today
if [ $? != 0 ]; then
    echo "${today_time} 2" >>logs.txt
    exit 1
fi

# successful
echo "${today_time} 0" >>logs.txt

# */45 * * * * ./crontab/gvwt/main.sh
