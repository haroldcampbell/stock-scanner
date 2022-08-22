import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as tic
from typing import NamedTuple

from pymongo.collection import Collection
import pymongo


from lib.shared import DATA_DIR

# STOCKS_DIR = ("%sstocks/" % (DATA_DIR))
# ANALYSIS_DIR = ("%sanalysis/" % (DATA_DIR))


def process_watchlist_trends(analysis_col: Collection, watchlist):
    new_list = []

    for stock in watchlist:
        item = _calc_symbol_recommendation(analysis_col, stock['symbol'])
        new_list.append(item)

    return new_list


def _calc_symbol_recommendation(analysis_col: Collection, symbol: str):
    filter = {"Price.Stock": symbol}
    results = analysis_col.find(filter)
    analysis_df = pd.DataFrame(results)
    price_df = pd.DataFrame(analysis_df['Price'].tolist()[0])
    price_df = price_df.sort_values(by='Week', ascending=False)

    stats = _to_stats(symbol, price_df)
    change_df = _calc_change(stats)

    # print(change_df)

    mean_val_week_2 = change_df["MeanHigh_MeanLow"][:2].mean()
    mean_val_month_1 = change_df["MeanHigh_MeanLow"][:4].mean()
    mean_val_month_2 = change_df["MeanHigh_MeanLow"][:8].mean()
    mean_val_month_3 = change_df["MeanHigh_MeanLow"][:12].mean()

    item = {
        'symbol': symbol,
        'Week_2': mean_val_week_2,
        'Month_1': mean_val_month_1,
        'Month_2': mean_val_month_2,
        'Month_3': mean_val_month_3,
    }

    return item
# def process_analysis(symbol: str):
#     stock_data_path = ("%s%s.csv" % (STOCKS_DIR, symbol))

#     analysis_data_path = ("%s%s" % (ANALYSIS_DIR, symbol))
#     summary_data_path = ("%s%s-summary" % (ANALYSIS_DIR, symbol))
#     change_data_path = ("%s%s-change" % (ANALYSIS_DIR, symbol))
#     week_filter = 19

#     generate_analysis(symbol, stock_data_path, week_filter,
#                       analysis_data_path, summary_data_path, change_data_path)


def generate_analysis_db(stock_col: Collection, analysis_col: Collection, symbol: str, wk_filter):
    filter = {"Stock": symbol}
    results = stock_col.find(filter).sort("Date", pymongo.ASCENDING)
    stock_df = pd.DataFrame(results)

    analysis_df = _generate_analysis(stock_df, wk_filter, symbol)
    condensed_analysis_df = _condensed_analysis(analysis_df, wk_filter, symbol)
    stats = _to_stats(symbol, analysis_df)
    change_df = _calc_change(stats)

    data_dict = {}
    data_dict['Stock'] = symbol
    data_dict['Price'] = analysis_df.to_dict("records")
    data_dict['Summary'] = condensed_analysis_df.to_dict("records")
    data_dict['Change'] = change_df.to_dict("records")

    _save_analysis_db(analysis_col, data_dict, symbol)


def fetch_symbol_db(analysis_col: Collection, symbol: str):
    filter = {"Stock": symbol}
    results = analysis_col.find(filter)
    analysis_df = pd.DataFrame(results)

    return analysis_df.to_dict("records")


def _save_analysis_db(analysis_col: Collection, data_dict: dict, symbol):
    analysis_col.delete_many({"Stock": symbol})
    analysis_col.insert_one(data_dict)

    print("\t...save analysis records for:", symbol)


def generate_analysis(symbol, stock_data_path, wk_filter, analysis_output_path, summary_output_path, change_output_path):
    stock_df = pd.DataFrame(pd.read_csv(stock_data_path))

    analysis_df = _generate_analysis(stock_df, wk_filter, symbol)
    analysis_df.to_csv(f"{analysis_output_path}.csv", index=False)
    analysis_df.to_json(f"{analysis_output_path}.json", orient="records")
    print(f"[generate_analysis] Analysis saved to... '{analysis_output_path}'")

    condensed_analysis_df = _condensed_analysis(analysis_df, wk_filter, symbol)
    condensed_analysis_df.to_csv(f"{summary_output_path}.csv", index=False)
    condensed_analysis_df.to_json(
        f"{summary_output_path}.json", orient="records")
    print(
        f"[generate_analysis] Condesned analysis saved to... '{summary_output_path}'")

    stats = _to_stats(symbol, analysis_df)
    change_df = _calc_change(wk_filter, stats)
    change_df.to_csv(f"{change_output_path}.csv", index=False)
    change_df.to_json(f"{change_output_path}.json", orient="records")
    print(
        f"[generate_analysis] Change analysis saved to... '{change_output_path}'")


## Private ####################################################################

def _condensed_analysis(analysis_df, week_filter, symbol):
    condensed_dict_data = {
        "Stock": [],
        "Week": [],
        "Max_High": [],
        "Min_Low": [],
        "Mean_Intra_Day": [],
        "Upper_Limit": [],
        "Lower_Limit": [],
        "Limit_Spread": [],  # Percentage difference between Upper and Lower limit
    }

    filtered_df = analysis_df[analysis_df["Week"] > week_filter]

    max_high = filtered_df["Max_High"].max().item()
    min_low = filtered_df["Min_Low"].min().item()
    intra_day = filtered_df["Mean_Intra_Day"].mean().item()
    upper_limit = filtered_df["Upper_Limit"].iloc[0]
    lower_limit = filtered_df["Lower_Limit"].iloc[0]
    spread = filtered_df["Limit_Spread"].iloc[0]

    condensed_dict_data["Stock"].append(symbol)
    condensed_dict_data["Week"].append(week_filter)
    condensed_dict_data["Max_High"].append(max_high)
    condensed_dict_data["Min_Low"].append(min_low)
    condensed_dict_data["Mean_Intra_Day"].append(intra_day)
    condensed_dict_data["Upper_Limit"].append(upper_limit)
    condensed_dict_data["Lower_Limit"].append(lower_limit)
    condensed_dict_data["Limit_Spread"].append(spread)

    condensed_analysis_df = pd.DataFrame(condensed_dict_data)

    return condensed_analysis_df


def _generate_analysis(stock_df, week_filter, symbol: str):
    dict_data = {
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

    for _, item in stock_df.iterrows():
        dict_data["Week"].append(item["Week"])
        dict_data["Stock"].append(item["Stock"])
        dict_data["Date"].append(item["Date"])
        dict_data["Open"].append(item["Open"])
        dict_data["High"].append(item["High"])
        dict_data["Low"].append(item["Low"])
        dict_data["Close"].append(item["Close"])
        dict_data["Adj Close"].append(item["Adj Close"])
        dict_data["Volume"].append(item["Volume"])

    data_df = _append_atr(dict_data)

    week_data_df = data_df.get(
        ["Date", "Week", "Open", "Close", "High", "Low", "ATR", "Volume"]
    )

    analysis_data = {
        "Stock": [],

        "Week": [],
        "Week_Start": [],
        "Week_End": [],

        "Mean_Open": [],
        "Mean_Close": [],
        "Mean_High": [],
        "Mean_Low": [],
        "Mean_Intra_Day": [],
        "Mean_Volume": [],
        "Mean_ATR": [],

        "Min_Open": [],
        "Min_Close": [],
        "Min_High": [],
        "Min_Low": [],
        "Min_Intra_Day": [],

        "Max_Open": [],
        "Max_Close": [],
        "Max_High": [],
        "Max_Low": [],
        "Max_Intra_Day": [],

        "Upper_Limit": [],
        "Lower_Limit": [],
        "Limit_Spread": [],  # Percentage difference between Upper and Lower limit
    }

    week_group = week_data_df.groupby("Week")
    for wk in week_group.groups.keys():
        analysis_data["Stock"].append(symbol)
        analysis_data["Week"].append(wk)
        wk_group = week_group.get_group(wk)

        _calc_date_range(analysis_data, wk_group)
        _calc_mean(analysis_data, wk_group)
        _calc_min(analysis_data, wk_group)
        _calc_max(analysis_data, wk_group)

    _calc_limits(analysis_data, week_filter)

    analysis_data_df = pd.DataFrame(analysis_data)

    return analysis_data_df


def _calc_date_range(analysis_data, week_group):
    dates = week_group["Date"].tolist()
    analysis_data["Week_Start"].append(dates[0])
    analysis_data["Week_End"].append(dates[-1])


def _append_atr(dict_data):
    data = pd.DataFrame(dict_data)

    high_low = data['High'] - data['Low']
    high_cp = np.abs(data['High'] - data['Close'].shift())
    low_cp = np.abs(data['Low'] - data['Close'].shift())

    df = pd.concat([high_low, high_cp, low_cp], axis=1)
    true_range = np.max(df, axis=1)
    average_true_range = true_range.rolling(14).mean()

    atr_df = pd.DataFrame()
    atr_df["ATR"] = average_true_range

    return pd.concat([data, atr_df], axis=1)


def _calc_mean(analysis_data, week_group):
    stats = week_group.get(
        ["Open", "Close", "High", "Low", "ATR", "Volume"]
    ).mean().get(
        ["Open", "Close", "High", "Low", "ATR", "Volume"])

    analysis_data["Mean_Open"].append(stats["Open"])
    analysis_data["Mean_Close"].append(stats["Close"])
    analysis_data["Mean_High"].append(stats["High"])
    analysis_data["Mean_Low"].append(stats["Low"])
    analysis_data["Mean_Intra_Day"].append(
        (stats["Low"]+stats["High"])/2.0)
    analysis_data["Mean_Volume"].append(stats["Volume"])
    analysis_data["Mean_ATR"].append(stats["ATR"])


def _calc_min(analysis_data, week_group):
    stats = week_group.min().get(
        ["Open", "Close", "High", "Low"])

    analysis_data["Min_Open"].append(stats["Open"])
    analysis_data["Min_Close"].append(stats["Close"])
    analysis_data["Min_High"].append(stats["High"])
    analysis_data["Min_Low"].append(stats["Low"])
    analysis_data["Min_Intra_Day"].append(
        (stats["Low"]+stats["High"])/2.0)


def _calc_max(analysis_data, week_group):
    stats = week_group.max().get(
        ["Open", "Close", "High", "Low"])

    analysis_data["Max_Open"].append(stats["Open"])
    analysis_data["Max_Close"].append(stats["Close"])
    analysis_data["Max_High"].append(stats["High"])
    analysis_data["Max_Low"].append(stats["Low"])
    analysis_data["Max_Intra_Day"].append(
        (stats["Low"]+stats["High"])/2.0)


def _calc_limits(analysis_data, week_filter):
    upper_df = pd.DataFrame(
        {"Week": analysis_data["Week"], "Max_High": analysis_data["Max_High"]})

    lower_df = pd.DataFrame(
        {"Week": analysis_data["Week"], "Min_Low": analysis_data["Min_Low"]})

    upper_limit = upper_df[upper_df["Week"] >
                           week_filter].get(["Max_High"]).mean()

    lower_limit = lower_df[lower_df["Week"] >
                           week_filter].get(["Min_Low"]).mean()

    limit_spread = 0
    if lower_limit.item() > 0:
        limit_spread = (upper_limit.item() -
                        lower_limit.item())/lower_limit.item()

    for wk in analysis_data["Week"]:
        analysis_data["Upper_Limit"].append(round(upper_limit.item(), 4))
        analysis_data["Lower_Limit"].append(round(lower_limit.item(), 4))
        analysis_data["Limit_Spread"].append(round(limit_spread, 4))


def _to_stats(symbol: str, stock_df: pd.DataFrame):
    return _Stats(
        symbol=symbol,
        wk_seq=stock_df["Week"].tolist(),
        mean_high=stock_df["Mean_High"].tolist(),
        mean_low=stock_df["Mean_Low"].tolist(),
        mean_inter_day=stock_df["Mean_Intra_Day"].tolist(),
        mean_volume=stock_df["Mean_Volume"].tolist(),
        upper_limit=stock_df["Upper_Limit"].tolist(),
        lower_limit=stock_df["Lower_Limit"].tolist(),
        max_high=stock_df["Max_High"].tolist(),
        min_low=stock_df["Min_Low"].tolist(),
    )


class _Stats(NamedTuple):
    symbol: str
    wk_seq: any
    mean_high: any
    mean_low: any
    mean_volume: any
    mean_inter_day: any
    upper_limit: any
    lower_limit: any
    max_high: any
    min_low: any


def _calc_change(ps: _Stats):
    percentages = []
    mean_percentages = []

    for index in range(len(ps.min_low)):
        percentages.append(_percentage_change(
            ps.max_high[index], ps.min_low[index]))

        mean_percentages.append(_percentage_change(
            ps.mean_high[index], ps.mean_low[index]))

    analysis_data = {
        "Week": [],
        "MaxHigh_MinLow": [],
        "MeanHigh_MeanLow": [],
    }

    analysis_data["Week"] = ps.wk_seq
    analysis_data["MaxHigh_MinLow"] = percentages
    analysis_data["MeanHigh_MeanLow"] = mean_percentages

    analysis_data_df = pd.DataFrame(analysis_data)

    return analysis_data_df


def _percentage_change(a, b):
    return round((a-b)/b, 2)
