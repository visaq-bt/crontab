#!/usr/bin/python3
import sys

sys.path.append(
    "/Library/Frameworks/Python.framework/Versions/3.10/lib/python3.10/site-packages"
)

from json import dump
from datetime import datetime
import requests
from bs4 import BeautifulSoup


url = "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/global-visa-wait-times.html"
raw_website = requests.get(url)
website = BeautifulSoup(raw_website.content, "html.parser")

date = datetime.today().strftime("%Y-%m-%d")
# last_updated = website.find("p", text=re.compile("Last updated: ")).contents[0]

data = {}
for raw_row in website.findAll("tr")[1:]:
    row = raw_row.findAll("td")
    key = row[0].contents[0]
    value = []

    for e in row[1:]:
        content = e.contents[0].split()
        try:
            if content[0] == "same":
                value.append(0)
            else:
                value.append(int(content[0]))
        except:
            value.append(-1)

    data[key] = value

# with open(f"gvwt/data/{date} {last_updated}.json", "w") as out_f:
with open(f"data/{date}.json", "w") as out_f:
    dump(data, out_f)
