import pandas as pd
import json
import re

from lib import market
from lib import analysis

WATCHLIST_PATH = "./www/data/watchlist.json"


def import_watchlist_from_json(stock_col, analysis_col, watchlist_col, watchlist_path=WATCHLIST_PATH):
    with open(watchlist_path, 'r') as f:
        watchlist_data = json.load(f)
        for stock_item in watchlist_data:
            try:
                symbol = stock_item['symbol']
                if has_symbol(watchlist_col, symbol):
                    print("\tIgnoring duplicate symbol: ", symbol)
                    continue

                _fetch_single_symbol_data(stock_col, analysis_col, symbol)
                add_symbol(watchlist_col, symbol)

            except IndexError:
                print('[import_watchlist_from_json] symbol not found: ', symbol)
                remove_symbol(watchlist_col, symbol)


def export_watchlist_from_json(watchlist_col, watchlist_path=WATCHLIST_PATH):
    symbols = get_watchlist(watchlist_col)

    with open(watchlist_path, 'w') as f:
        json.dump(symbols, f)


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
        print("\tIgnoring duplicate symbol")
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


def _fetch_single_symbol_data(stock_col, analysis_col, symbol):
    num_records = market.save_market_data_db(stock_col, symbol, 180)
    analysis.generate_analysis_db(stock_col, analysis_col, symbol, 19)

    return num_records
