from datetime import date
import getopt
import sys
from enum import Enum
import pandas as pd
import json
from lib import market
from lib import analysis
from lib import web
from lib import db
from lib import watchlist

from dateutil import parser

# Number of days of historical data that we should fetch
HISTORICAL_PERIOD_IN_DAYS = 90


class CliArg(Enum):
    HELP = 0
    FETCHSTOCK = 1
    WEBSERVER = 2
    IMPORTWATCHLIST = 3
    EXPORTWATCHLIST = 4


def _runner_help():
    print(
        "\nUsage: python3 main.py [-h (--help)] [-s (--stock=) -p (--period=)] [-w (--web)] [-i (--import=)] [-e (--export=)]")
    print(" -s (--stock=) fetch a symbol")
    print(" -p (--period=) specify period in trading days. Default is 90 days")
    print(" -w (--web) starts the web server")
    print(" -i (--import=) import web server watchlist (json)")
    print(" -e (--export) export web server watchlist (json).\n")


def _runner_fetch_stock(symbol: str, default_period: int):
    print("CliArg.FetchStock")
    if len(symbol) == 0:
        print("Error: stock symbol missing.")
        return

    # will be save as csv and json
    print("\tdefault_period: ", default_period)

    market.fetch_market_data(
        symbol,
        default_period)

    analysis.process_analysis(symbol)


def _runner_start_web_server():
    print("CliArg.WebServer")
    web.start_server(stock_fetcher_fn=fetchStock)


def _runner_import_server_watchlist(wlistpath):
    print("CliArg.IMPORTWATCHLIST wlistpath:", wlistpath)
    dbname = db.get_mongo_db()
    stock_col = db.get_stocks_col(dbname)
    analysis_col = db.get_analysis_col(dbname)
    watchlist_col = db.get_watchlist_col(dbname)

    watchlist.import_watchlist_from_json(
        stock_col, analysis_col, watchlist_col, wlistpath)


def _runner_export_server_watchlist(wlistpath):
    print("CliArg.EXPORTWATCHLIST")
    dbname = db.get_mongo_db()
    watchlist_col = db.get_watchlist_col(dbname)
    watchlist.export_watchlist_from_json(watchlist_col, wlistpath)


def process_args():
    # Remove 1st argument from the
    # list of command line arguments
    argumentList = sys.argv[1:]

    # Options
    options = "hws:p:i:e:"

    # Long options
    long_options = ["help", "web", "stock=",  "period=", "import=", "export="]

    cli_mode = CliArg.HELP

    symbol = ""
    default_period = HISTORICAL_PERIOD_IN_DAYS

    try:
        # Parsing argument
        arguments, values = getopt.getopt(argumentList, options, long_options)

        # checking each argument
        for currentArgument, currentValue in arguments:
            if currentArgument in ("-h", "--help"):
                cli_mode = CliArg.HELP

            elif currentArgument in ("-w", "--web"):
                cli_mode = CliArg.WEBSERVER

            elif currentArgument in ("-s", "--stock"):
                symbol = currentValue
                cli_mode = CliArg.FETCHSTOCK

            elif currentArgument in ("-p", "--period"):
                default_period = int(currentValue)
                cli_mode = CliArg.FETCHSTOCK

            elif currentArgument in ("-i", "--import"):
                wlistpath = currentValue
                cli_mode = CliArg.IMPORTWATCHLIST

            elif currentArgument in ("-e", "--export"):
                wlistpath = currentValue
                cli_mode = CliArg.EXPORTWATCHLIST

    except getopt.error as err:
        # output error, and return with an error code
        print(str(err))

    arg_runners = {
        CliArg.HELP: (lambda: _runner_help()),
        CliArg.WEBSERVER: (lambda: _runner_start_web_server()),
        CliArg.FETCHSTOCK: (lambda: _runner_fetch_stock(symbol, default_period)),
        CliArg.IMPORTWATCHLIST: (lambda: _runner_import_server_watchlist(wlistpath)),
        CliArg.EXPORTWATCHLIST: (
            lambda: _runner_export_server_watchlist(currentValue))
    }

    runner = arg_runners[cli_mode]

    if runner != None:
        runner()


def Main():
    process_args()
    # # process_analysis("app")


if __name__ == "__main__":
    Main()
