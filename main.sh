#!/bin/sh
export PATH="$PATH:/usr/local/bin"
cd crontab/gvwt

check ran already
last_date=$(tail -n 1 logs.txt | awk '{print $1}')
if [ "$last_date" = "$(date +"%Y-%m-%d")" ]; then
    exit 0
fi

today=$(date +"%Y-%m-%d %T")

# run python
python3 main.py
if [ $? != 0 ]; then
    echo "${today} 1" >>logs.txt
    exit 1
fi

# run js
node main.js
if [ $? != 0 ]; then
    echo "${today} 2" >>logs.txt
    exit 1
fi

# successful
echo "${today} 0" >>logs.txt

# */30 * * * * ./crontab/gvwt/main.sh
