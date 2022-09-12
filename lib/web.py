from http.server import SimpleHTTPRequestHandler, HTTPServer, HTTPStatus
import time
import os
import io
import json
from lib import market
from lib import analysis
from lib import watchlist

from lib.shared import HISTORICAL_PERIOD_IN_DAYS
from lib import db
from bson import json_util


hostName = "localhost"
serverPort = 8091
WWW_PATH = "./www/"


def start_server(stock_fetcher_fn):
    webServer = HTTPServer((hostName, serverPort), MyServer)

    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")


class MyServer(SimpleHTTPRequestHandler):
    dbname = db.get_mongo_db()
    stock_col = db.get_stocks_col(dbname)
    analysis_col = db.get_analysis_col(dbname)
    watchlist_col = db.get_watchlist_col(dbname)

    # watchlist_data = watchlist.get_watchlist(watchlist_col)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WWW_PATH, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        watchlist_data = watchlist.get_watchlist(self.watchlist_col)

        if self.path == '/data/watchlist.json':
            self.do_GET_watchlist(watchlist_data)

        elif path.endswith('.json') and path.startswith('./www/data/analysis'):
            self.do_GET_symbol_data(path)
        else:
            super().do_GET()

    def do_POST(self):
        self.data_string = self.rfile.read(int(self.headers['Content-Length']))
        print("in post method data_string:", self.data_string, self.path)

        num_records = 0
        watchlist_data = watchlist.get_watchlist(self.watchlist_col)

        if self.path.lower() == "/refresh-all-data":
            print("refreshing all data")
            num_records = self.do_POST_reload_watchlist_data(watchlist_data)

        elif self.path.lower() == "/refresh-week-data":
            print("refreshing week data")
            num_records = self.do_POST_reload_week_data(watchlist_data)

        elif self.path.lower() == "/update-analysis":
            print("refreshing analaysis")
            num_records = self.do_POST_update_analysis(watchlist_data)

        elif self.path.lower() == "/add-watchlist-symbol":
            print("add watchlist symbol: ", self.data_string)
            num_records = self.do_POST_add_watchlist_symbol(self.data_string)

        elif self.path.lower() == "/remove-watchlist-symbol":
            print("remove watchlist symbol: ", self.data_string)
            symbol = self.data_string.decode("utf-8")
            num_records = self.do_POST_remove_watchlist_symbol(symbol)

        data_dict = {"newRecords": num_records}
        raw_data = json.dumps(data_dict)

        self._send_data(raw_data)

    def do_GET_watchlist(self, watchlist_data):
        print("do_watchlist")

        trends = analysis.process_watchlist_trends(
            self.analysis_col, watchlist_data)

        raw_data = json_util.dumps(trends)
        self._send_data(raw_data)

    def do_GET_symbol_data(self, path):
        print("requesting is stock data. path:", path)

        symbol = self._path_to_symbol(path)
        self._fetch_stock_data(symbol)

    def do_POST_reload_watchlist_data(self, watchlist_data):
        num_records = 0
        for item in watchlist_data:
            num_records += self._fetch_single_symbol_data(item['symbol'])

        return num_records

    def do_POST_reload_week_data(self, watchlist_data):
        num_records = 0
        for item in watchlist_data:
            num_records += market.update_market_data_db(
                self.stock_col, item['symbol'], 7)

            analysis.generate_analysis_db(self.stock_col,
                                          self.analysis_col,
                                          item['symbol'],
                                          19)
        return num_records

    def do_POST_update_analysis(self, watchlist_data):
        for item in watchlist_data:
            analysis.generate_analysis_db(self.stock_col,
                                          self.analysis_col,
                                          item['symbol'],
                                          19)

    def do_POST_add_watchlist_symbol(self, data_string):
        try:
            symbol = data_string.decode("utf-8").upper()
            num_records = self._fetch_single_symbol_data(symbol)
            watchlist.add_symbol(self.watchlist_col, symbol)

            return num_records

        except IndexError:
            print('[do_add_watchlist_symbol] symbol not found: ', symbol)
            watchlist.remove_symbol(self.watchlist_col, symbol)
            return -1

    def do_POST_remove_watchlist_symbol(self, symbol):
        if watchlist.has_symbol(self.watchlist_col, symbol):
            watchlist.remove_symbol(self.watchlist_col, symbol)
            return 1

        else:
            return 0

    def _path_to_symbol(self, path):
        path_parts = path.split('/')
        print(path_parts, path_parts[-1])
        json_name = path_parts[-1]

        return json_name.split(".")[0]

    def _fetch_stock_data(self, symbol):
        data_dict = analysis.fetch_symbol_db(self.analysis_col, symbol)

        if len(data_dict) > 0:
            raw_data = json_util.dumps(data_dict[0])
        else:
            raw_data = json_util.dumps({})

        self._send_data(raw_data)

    def _fetch_single_symbol_data(self, symbol):
        num_records = market.save_market_data_db(
            self.stock_col, symbol, 180)

        analysis.generate_analysis_db(
            self.stock_col, self.analysis_col, symbol, 19)

        return num_records

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
