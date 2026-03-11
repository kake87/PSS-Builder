import requests
from bs4 import BeautifulSoup


url = 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd20123g2-li-u-y/?subName=DS-2CD20123G2-LIUY'
headers = {
    "User-Agent": "Mozilla/5.0"
}

resp = requests.get(url, headers=headers)

print("Status:", resp.status_code)

html = resp.text

soup = BeautifulSoup(html, "html.parser")

# название продукта
title = soup.find("h1")
if title:
    print("Product:", title.text.strip())

# модель
model = soup.find(string=lambda s: s and "DS-" in s)
if model:
    print("Possible model:", model.strip())

# попробуем найти таблицы спецификаций
tables = soup.find_all("table")

print("Tables found:", len(tables))

specs = []

for table in tables:
    rows = table.find_all("tr")
    for row in rows:
        cols = row.find_all(["td", "th"])
        if len(cols) == 2:
            name = cols[0].text.strip()
            value = cols[1].text.strip()
            specs.append((name, value))

print("\nFirst specs:")
for s in specs[:10]:
    print(s)