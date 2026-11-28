"""Fetch the market levels for the Endurance chapter's ticker -> markets.json.

The reception TV shows a slow tape of broad market levels while Endurance Capital is on screen
(content/film.yaml, scene `endurance`, `ticker`). This script is the only thing that fetches them.
It runs every 10 minutes on market days in GitHub Actions (deploy/github/markets.yml, copied into
garg94sahil/southcourt by tools/publish_pages.py), which force-pushes the file to branch `live-data`.
The TV reads it from raw.githubusercontent.com.

Standard library only, so it runs on a bare Actions runner as well as here.

What it shows (Sahil, 2026-11-26): broad Indian indices, the rupee and gold. Never single stocks,
Endurance's holdings or any performance figure: Endurance is a SEBI AIF.

Source: Yahoo Finance's chart endpoint (unofficial, about 15 minutes delayed for BSE). The % change
is against the last daily close before the latest price's trading day, read from the daily bars.
If Yahoo starts refusing the Actions runners, swap `quote()` for another source; the file format stays.

Usage:
  python tools/fetch_markets.py                                  # -> .tmp/markets.json
  python tools/fetch_markets.py --out content/markets_sample.json   # the sample used by stills and previews
Exit 1 (and the old file is left alone) if no equity index came back.
"""

import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
# Daily bars for a month: the previous close is read from them (see quote()), never from Yahoo's
# chartPreviousClose. On 2026-11-26, after the 24 Nov market holiday, chartPreviousClose jumped back
# to Monday's close in the afternoon and the tape showed NIFTY +2.17% for a +0.3% day.
CHART = "https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=1mo&interval=1d"

# id -> what the tape shows. `kind` index = an equity index: the tape's "as of" time follows these.
INSTRUMENTS = [
    {"id": "nifty50",   "name": "NIFTY 50",         "symbol": "^NSEI",             "kind": "index",     "decimals": 2},
    {"id": "sensex",    "name": "SENSEX",           "symbol": "^BSESN",            "kind": "index",     "decimals": 2},
    {"id": "niftybank", "name": "NIFTY BANK",       "symbol": "^NSEBANK",          "kind": "index",     "decimals": 2},
    {"id": "midcap150", "name": "NIFTY MIDCAP 150", "symbol": "NIFTYMIDCAP150.NS", "kind": "index",     "decimals": 2},
    {"id": "usdinr",    "name": "USD/INR",          "symbol": "INR=X",             "kind": "fx",        "decimals": 2},
    {"id": "gold",      "name": "GOLD (US$/OZ)",    "symbol": "GC=F",              "kind": "commodity", "decimals": 1},  # COMEX front month
]

MAX_MOVE = 15.0          # % in a day; anything bigger is a data error, not a market
MAX_AGE = dt.timedelta(days=7)


def quote(sym, tries=3):
    url = CHART.format(sym=urllib.parse.quote(sym))
    last = None
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=20) as r:
                res = json.load(r)["chart"]["result"][0]
            meta = res["meta"]
            price, t, off = float(meta["regularMarketPrice"]), int(meta["regularMarketTime"]), int(meta.get("gmtoffset") or 0)
            # The previous close: the last daily close dated before the trading day of the latest
            # price, both in the exchange's own time zone (so holidays and weekends are skipped)
            day = lambda ts: dt.datetime.fromtimestamp(ts + off, dt.timezone.utc).date()
            today = day(t)
            prev = [c for ts, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c is not None and day(ts) < today]
            if not prev:
                raise ValueError("no daily close before " + today.isoformat())
            return price, float(prev[-1]), t
        except Exception as e:  # HTTP 429/5xx, timeouts, odd JSON
            last = e
            time.sleep(2 * (k + 1))
    raise RuntimeError(f"{sym}: {last}")


def fetch():
    now = dt.datetime.now(dt.timezone.utc)
    items, problems = [], []
    for ins in INSTRUMENTS:
        try:
            value, prev, t = quote(ins["symbol"])
        except Exception as e:
            problems.append(str(e))
            continue
        when = dt.datetime.fromtimestamp(t, dt.timezone.utc)
        move = (value - prev) / prev * 100 if prev > 0 else None
        if value <= 0 or move is None or abs(move) > MAX_MOVE or now - when > MAX_AGE:
            problems.append(f"{ins['symbol']}: implausible (value {value}, prev {prev}, time {when:%Y-%m-%d %H:%M}Z)")
            continue
        items.append({
            "id": ins["id"], "name": ins["name"], "kind": ins["kind"],
            "value": round(value, ins["decimals"]), "decimals": ins["decimals"],
            "change_pct": round(move, 2),
            "t": t, "time": when.astimezone(IST).isoformat(timespec="seconds"),
        })
    return {
        "v": 1,
        "fetched": now.astimezone(IST).isoformat(timespec="seconds"),
        "source": "Yahoo Finance (delayed)",
        "items": items,
    }, problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent.parent / ".tmp" / "markets.json"))
    args = ap.parse_args()
    data, problems = fetch()
    for p in problems:
        print("  skipped " + p)
    if not any(i["kind"] == "index" for i in data["items"]):
        sys.exit("No equity index came back: markets.json left as it was")
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(out.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    os.replace(tmp, out)
    for i in data["items"]:
        print(f"  {i['name']:<17} {i['value']:>12,.{i['decimals']}f}  {i['change_pct']:+6.2f}%  {i['time']}")
    print(f"wrote {out} ({len(data['items'])}/{len(INSTRUMENTS)} instruments)")


if __name__ == "__main__":
    main()
