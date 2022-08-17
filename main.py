from datetime import date
import getopt
import sys
from lib import market
from lib import analysis
from lib import web
from enum import Enum
import pandas as pd
from lib import db

from dateutil import parser

# Number of days of historical data that we should fetch
HISTORICAL_PERIOD_IN_DAYS = 90


class CliArg(Enum):
    HELP = 0
    FETCHSTOCK = 1
    WEBSERVER = 2


def fetchStock(symbol: str, default_period: int):
    if len(symbol) == 0:
        print("Error: stock symbol missing.")
        return

    # will be save as csv and json
    print("\tdefault_period: ", default_period)

    market.fetch_market_data(
        symbol,
        default_period)

    analysis.process_analysis(symbol)


def start_web_server():
    web.start_server(stock_fetcher_fn=fetchStock)


def process_args():
    # Remove 1st argument from the
    # list of command line arguments
    argumentList = sys.argv[1:]

    # Options
    options = "hwsp:"

    # Long options
    long_options = ["help", "web", "stock=",  "period="]

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

    except getopt.error as err:
        # output error, and return with an error code
        print(str(err))

    match cli_mode:
        case CliArg.HELP:
            print(
                "\nUsage: python3 main.py [-h (--help)] [-s (--stock=) -p (--period=)] [-w (--web)]")
            print(" -s (--stock=) fetch a symbol")
            print(" -p (--period=) specify period in trading days. Default is 90 days")
            print(" -w (--web) starts the web server.\n")

        case CliArg.FETCHSTOCK:
            print("CliArg.FetchStock")
            fetchStock(symbol, default_period)

        case CliArg.WEBSERVER:
            print("CliArg.WebServer")
            start_web_server()


def Main():
    process_args()
    # # process_analysis("app")


if __name__ == "__main__":
    Main()
