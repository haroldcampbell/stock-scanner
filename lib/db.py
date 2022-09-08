from pymongo import MongoClient
from pymongo.database import Database
import pymongo


def get_mongo_db():
    # Provide the mongodb atlas url to connect python to mongodb using pymongo
    CONNECTION_STRING = "127.0.0.1:27017"

    # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
    from pymongo import MongoClient
    client = MongoClient(CONNECTION_STRING)

    # Create the database for our example (we will use the same database throughout the tutorial
    return client['stock_db']


def get_stocks_col(dbname: Database):
    return dbname["stocks"]


def get_analysis_col(dbname: Database):
    return dbname["analysis"]


def get_watchlist_col(dbname: Database):
    return dbname["watchlist"]
