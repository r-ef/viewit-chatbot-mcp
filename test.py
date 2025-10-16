import requests

url = "https://api.viewit.ae/getBot/"
params = {
    "input": "what ",
    "emirate": "ae",
}

try:
    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    try:
        print(resp.json())
    except ValueError:
        print(resp.text)
except requests.RequestException as e:
    print(f"Request failed: {e}")