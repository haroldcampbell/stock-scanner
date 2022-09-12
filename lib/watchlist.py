import pandas as pd
import json
import re

WATCHLIST_PATH = "./www/data/watchlist.json"


def import_watchlist_from_json(watchlist_col):
    with open(WATCHLIST_PATH, 'r') as f:
        print("[init_watchlist] Loading watchlist data")
        watchlist_data = json.load(f)
        for item in watchlist_data:
            watchlist_col.insert_one(item)


def get_watchlist(watchlist_col):
    results = watchlist_col.find()
    results_df = pd.DataFrame(results)
    results_df = pd.DataFrame(results_df['symbol'])

    return results_df.to_dict("records")


def add_symbol(watchlist_col, symbol):
    if len(symbol) == 0:
        return 0

    filter = {
        'symbol': re.compile('^' + re.escape(symbol) + '$', re.IGNORECASE),
    }
    num = watchlist_col.count_documents(filter)

    if num > 0:  # Exit if the symbol already exists
        print("ignoring duplicate symbol")
        return 0

    item = {
        'symbol': symbol,
    }

    result = watchlist_col.insert_one(item)

    return result


def has_symbol(watchlist_col, symbol):
    filter = {
        'symbol': re.compile('^' + re.escape(symbol) + '$', re.IGNORECASE),
    }
    num = watchlist_col.count_documents(filter)

    if num == 0:
        return False

    return True


def remove_symbol(watchlist_col, symbol):
    filter = {
        'symbol': re.compile('^' + re.escape(symbol) + '$', re.IGNORECASE),
    }

    watchlist_col.delete_many(filter)
