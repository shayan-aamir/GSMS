import mysql.connector
from mysql.connector import errorcode
from sql_connection import get_sql_connection


def get_all_products(connection):
    cursor=connection.cursor()
    query = (
        "SELECT products.products_id, products.name, products.uom_id, products.price_per_unit, products.is_active, uom.uom_name "
        "FROM products INNER JOIN uom ON products.uom_id = uom.uom_id "
        "WHERE products.is_active = 1"
    )
    cursor.execute(query)
    response=[]
    for (products_id,name,uom_id,price_per_unit,is_active,uom_name) in cursor:
        response.append({
            "products_id":products_id,
            "name":name,
            "uom_id":uom_id,
            "price_per_unit":price_per_unit,
            "uom_name":uom_name,
            "is_active":is_active
        })

    return response

def insert_new_product(connection,product):
    cursor=connection.cursor()
    query=(
        "INSERT INTO products (name,uom_id,price_per_unit) VALUES (%s,%s,%s)"
    )
    data=(product['name'],product['uom_id'],product['price_per_unit'])
    cursor.execute(query,data)
    connection.commit()

    return cursor.lastrowid

def delete_product(connection, product_id):
    cursor = connection.cursor()
    try:
        query = "UPDATE products SET is_active = 0 WHERE products_id = %s"
        cursor.execute(query, (product_id,))
        connection.commit()
        return cursor.rowcount
    except mysql.connector.IntegrityError as err:
        connection.rollback()
        if err.errno == errorcode.ER_ROW_IS_REFERENCED_2:
            raise ValueError("Cannot delete this product because it exists in one or more orders.") from err
        raise
    finally:
        cursor.close()

def get_products_by_price_range(connection, min_price, max_price):
    if min_price is None or max_price is None:
        raise ValueError("Both min_price and max_price are required.")
    if min_price > max_price:
        raise ValueError("min_price cannot be greater than max_price.")

    cursor = connection.cursor()
    query = (
        "SELECT products.products_id, products.name, products.uom_id, products.price_per_unit, "
        "products.is_active, uom.uom_name "
        "FROM products INNER JOIN uom ON products.uom_id = uom.uom_id "
        "WHERE products.is_active = 1 AND products.price_per_unit BETWEEN %s AND %s"
    )
    cursor.execute(query, (min_price, max_price))

    response = []
    for (products_id, name, uom_id, price_per_unit, is_active, uom_name) in cursor:
        response.append({
            "products_id": products_id,
            "name": name,
            "uom_id": uom_id,
            "price_per_unit": price_per_unit,
            "uom_name": uom_name,
            "is_active": is_active
        })

    cursor.close()
    return response

if __name__ == "__main__":
    connection=get_sql_connection()
    print(insert_new_product(connection,{
        "name":"potato",
        "uom_id":1,
        "price_per_unit":10
    }))
    print(delete_product(connection,10))
    print(delete_product(connection,11))
    print(delete_product(connection,13))
    print(delete_product(connection,14))
    print(get_all_products(connection))