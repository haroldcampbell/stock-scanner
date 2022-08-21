from pymongo.collection import Collection
import pandas as pd
from pandas.io.parsers import TextFileReader
from pricefetch import Stock
from lib.shared import DATA_DIR

STOCKS_DIR = ("%sstocks/" % (DATA_DIR))


def fetch_market_data(symbol: str, period_in_days: int):
    output_path = ("%s%s" % (STOCKS_DIR, symbol))
    print("\tsaving output to: ", output_path)

    data = {
        "Stock": [],
        "Date": [],
        "Week": [],
        "Open": [],
        "High": [],
        "Low": [],
        "Close": [],
        "Adj Close": [],
        "Volume": [],
    }

    print("\t...getting symbol data: ", symbol)

    sym = _stock_short_name(symbol)
    s = Stock(sym).historical(period_in_days)

    data["Date"] += [*s["Date"]]
    data["Open"] += [*s["Open"]]
    data["High"] += [*s["High"]]
    data["Low"] += [*s["Low"]]
    data["Close"] += [*s["Close"]]
    data["Adj Close"] += [*s["Adj Close"]]
    data["Volume"] += [*s["Volume"]]

    sym_arr = [symbol] * len(s["Date"])
    data["Stock"] += sym_arr

    wk_arr = []
    for d in s["Date"]:
        week = pd.to_datetime(d, errors='coerce').week
        wk_arr.append(week)

    data["Week"] += wk_arr

    df = pd.DataFrame(data)
    df.to_csv(f"{output_path}.csv", index=False)
    df.to_json(f"{output_path}.json", orient="records")

    return data


def save_market_data_db(stock_col: Collection, symbol: str, period_in_days: int):
    print("\tGetting symbol data: ", symbol)

    records = _get_stock_data(symbol, period_in_days)
    new_records = []

    for item in records:
        filter = {"Stock": item["Stock"], "Date": item["Date"]}
        num = stock_col.count_documents(filter)
        if num == 1:
            continue
        else:
            new_records.append(item)

    num_records = _save_records_to_db(stock_col, new_records)

    return num_records


def update_market_data_db(stock_col: Collection, symbol: str, period_in_days: int):
    print("\tGetting symbol data: ", symbol)

    records = _get_stock_data(symbol, period_in_days)
    num_records = 0
    for item in records:
        filter = {"Stock": item["Stock"], "Date": item["Date"]}
        stock_col.update_one(filter, {"$set": item}, upsert=True)
        num_records += 1

    return num_records


def _save_records_to_db(stock_col: Collection, new_records):
    num_records = len(new_records)

    if num_records > 0:
        result = stock_col.insert_many(new_records)
        print("\t...records saved:", len(result.inserted_ids))
    else:
        print("\t...no new records saved")

    return num_records


def _get_stock_data(symbol, period_in_days):
    data = {
        "Stock": [],
        "Date": [],
        "Week": [],
        "Month": [],
        "Open": [],
        "High": [],
        "Low": [],
        "Close": [],
        "Adj Close": [],
        "Volume": [],
    }

    sym = _stock_short_name(symbol)
    s = Stock(sym).historical(period_in_days)

    data["Date"] += [*s["Date"]]
    data["Open"] += [*s["Open"]]
    data["High"] += [*s["High"]]
    data["Low"] += [*s["Low"]]
    data["Close"] += [*s["Close"]]
    data["Adj Close"] += [*s["Adj Close"]]
    data["Volume"] += [*s["Volume"]]

    sym_arr = [symbol] * len(s["Date"])
    data["Stock"] += sym_arr

    wk_arr = []
    month_arr = []
    for d in s["Date"]:
        week = pd.to_datetime(d, errors='coerce').week
        month_name = pd.to_datetime(d, errors='coerce').month_name()
        wk_arr.append(week)
        month_arr.append(month_name)

    data["Week"] += wk_arr
    data["Month"] += month_arr

    df = pd.DataFrame(data)

    return df.to_dict('records')


def _stock_short_name(symbol: str) -> str:
    name_parts = symbol.split(":")

    if len(name_parts) > 1:
        return name_parts[1]

    return symbol
