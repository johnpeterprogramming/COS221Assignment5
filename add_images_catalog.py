import requests
import mysql.connector
from time import sleep


db = mysql.connector.connect(
    host="",
    port="",
    user="",
    password="",
    database=""
)

cursor = db.cursor()


cursor.execute("SELECT CatalogID, Title FROM catalog")
entries = cursor.fetchall()


api_key = "169dca51"
api_url = "http://www.omdbapi.com/"


def get_poster_url(title):
    response = requests.get(api_url, params={"t": title, "apikey": api_key})
    data = response.json()
    if "Poster" in data and data["Poster"] != "N/A":
        return data["Poster"]
    return None


for entry in entries:
    catalog_id, title = entry
    poster_url = get_poster_url(title)
    if poster_url:
        try:
            cursor.execute("UPDATE catalog SET PosterURL = %s WHERE CatalogID = %s", (poster_url, catalog_id))
            db.commit()
            print(f"Updated {title} with URL {poster_url}")
        except Exception as e:
            print(f"Error updating {title}: {e}")

    sleep(1)

cursor.close()
db.close()
