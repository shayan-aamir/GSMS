import datetime
import mysql.connector
import os


def get_sql_connection():
  """Return a fresh MySQL connection."""
  print("Opening mysql connection")
  return mysql.connector.connect(
      user=os.environ.get('DB_USER', 'root'),
      password=os.environ.get('DB_PASSWORD', '06235503'),
      database=os.environ.get('DB_NAME', 'grocery_store'),
      host=os.environ.get('DB_HOST', '127.0.0.1'),
      port=int(os.environ.get('DB_PORT', '3306')),
      autocommit=True
  )