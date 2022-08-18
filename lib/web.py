from http.server import SimpleHTTPRequestHandler, HTTPServer, HTTPStatus
import time
import os
import io
import json
from lib import market
from lib import analysis
from lib.shared import HISTORICAL_PERIOD_IN_DAYS
from lib import db
from bson import json_util


hostName = "localhost"
serverPort = 8091
WWW_PATH = "./www/"
WATCHLIST_PATH = "./www/data/watchlist.json"


def start_server(stock_fetcher_fn):
    # MyServer.stock_fetcher_fn = stock_fetcher_fn

    webServer = HTTPServer((hostName, serverPort), MyServer)

    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")


def init_watchlist():
    watchlist_data = []
    with open(WATCHLIST_PATH, 'r') as f:
        print("[init_watchlist] Loading watchlist data")
        watchlist_data = json.load(f)

    return watchlist_data


class MyServer(SimpleHTTPRequestHandler):
    dbname = db.get_mongo_db()
    stock_col = db.get_stocks_col(dbname)
    analysis_col = db.get_analysis_col(dbname)
    watchlist_data = init_watchlist()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WWW_PATH, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)

        if path.endswith('.json') and path.startswith('./www/data/analysis'):
            self.do_symbol_data(path)
        else:
            super().do_GET()

    def do_POST(self):
        self.data_string = self.rfile.read(int(self.headers['Content-Length']))
        print("in post method data_string:", self.data_string, self.path)

        num_records = 0
        if self.path.lower() == "/refresh-all-data":
            print("refreshing all data")
            num_records = self.do_reload_watch_list_data()

        elif self.path.lower() == "/refresh-week-data":
            print("refreshing week data")
            num_records = self.do_reload_week_data()

        elif self.path.lower() == "/update-analysis":
            print("refreshing analaysis")
            self.do_update_analysis()

        data_dict = {"newRecords": num_records}
        raw_data = json.dumps(data_dict)

        self._send_data(raw_data)

    def do_symbol_data(self, path):
        print("requesting is stock data. path:", path)
        symbol = self.path_to_symbol(path)
        self.fetch_stock_data(symbol)

    def do_reload_watch_list_data(self):
        num_records = 0
        for item in self.watchlist_data:
            num_records += market.save_market_data_db(
                self.stock_col, item['symbol'], 180)

            analysis.generate_analysis_db(self.stock_col,
                                          self.analysis_col,
                                          item['symbol'],
                                          19)
        return num_records

    def do_reload_week_data(self):
        num_records = 0
        for item in self.watchlist_data:
            num_records += market.save_market_data_db(
                self.stock_col, item['symbol'], 7)

            analysis.generate_analysis_db(self.stock_col,
                                          self.analysis_col,
                                          item['symbol'],
                                          19)
        return num_records

    def do_update_analysis(self):
        for item in self.watchlist_data:
            analysis.generate_analysis_db(self.stock_col,
                                          self.analysis_col,
                                          item['symbol'],
                                          19)

    def path_to_symbol(self, path):
        path_parts = path.split('/')
        print(path_parts, path_parts[-1])
        json_name = path_parts[-1]

        return json_name.split(".")[0]

    def fetch_stock_data(self, symbol):
        data_dict = analysis.fetch_symbol_db(self.analysis_col, symbol)

        if len(data_dict) > 0:
            raw_data = json_util.dumps(data_dict[0])
        else:
            raw_data = json_util.dumps({})

        self._send_data(raw_data)

    def _send_data(self, raw_data):
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-type", "application/json")
        self.send_header("Content-Length", str(len(raw_data)))
        self.end_headers()

        f = io.BytesIO()
        f.write(raw_data.encode())
        f.seek(0)
        try:
            self.copyfile(f, self.wfile)
        finally:
            f.close()
