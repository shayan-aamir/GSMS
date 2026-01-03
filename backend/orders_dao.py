from sql_connection import get_sql_connection
from datetime import datetime

def insert_order(connection,order):
    cursor=connection.cursor()
    order_query=(
        "INSERT INTO orders (customer_name,total,datetime) " "VALUES (%s,%s,%s)"
    )
    order_data = (order['customer_name'],order['grand_total'],datetime.now())
    cursor.execute(order_query,order_data)
    order_id=cursor.lastrowid


    order_details_data=[]
    order_details_query=(
        "INSERT INTO order_details (order_id, products_id, quantity, total_price) VALUES (%s, %s, %s, %s)"
    )
    for order_detail_record in order['order_details']:
        order_details_data.append([
            order_id,
            int(order_detail_record['products_id']),
            float(order_detail_record['quantity']),
            float(order_detail_record['total_price'])
        ])

    cursor.executemany(order_details_query,order_details_data)

    connection.commit()

    # Fetch and return order details with product information
    order_details = get_order_details(connection, order_id)
    
    return get_order_by_id(connection, order_id)

def get_order_details(connection, order_id):
    cursor = connection.cursor()

    query = "SELECT order_details.order_id, order_details.products_id, order_details.quantity, order_details.total_price, "\
            "products.name, products.price_per_unit FROM order_details LEFT JOIN products on " \
            "order_details.products_id = products.products_id where order_details.order_id = %s"


    data = (order_id, )

    cursor.execute(query, data)

    records = []
    for (order_id, products_id, quantity, total_price, name, price_per_unit) in cursor:
        records.append({
            'order_id': order_id,
            'products_id': products_id,
            'quantity': quantity,
            'total_price': total_price,
            'product_name': name,
            'price_per_unit': price_per_unit
        })

    cursor.close()

    return records


def get_all_orders(connection):
    cursor = connection.cursor()
    query = ("SELECT * FROM orders")
    cursor.execute(query)
    response = []
    for (order_id, customer_name, total, dt) in cursor:
        response.append({
            'order_id': order_id,
            'customer_name': customer_name,
            'total': total,
            'datetime': dt,
        })

    cursor.close()

    # append order details in each order
    for record in response:
        record['order_details'] = get_order_details(connection, record['order_id'])

    return response

def get_order_by_id(connection, order_id):
    cursor = connection.cursor()
    cursor.execute(
        "SELECT order_id, customer_name, total, datetime FROM orders WHERE order_id = %s",
        (order_id,)
    )
    result = cursor.fetchone()
    cursor.close()

    if not result:
        return None

    order_id, customer_name, total, dt = result
    order_details = get_order_details(connection, order_id)
    return {
        'order_id': order_id,
        'customer_name': customer_name,
        'total': total,
        'datetime': dt,
        'order_details': order_details
    }

def update_order(connection, order):
    if 'order_id' not in order:
        raise ValueError('order_id is required to update an order')

    order_id = int(order['order_id'])
    cursor = connection.cursor()

    update_query = (
        "UPDATE orders SET customer_name = %s, total = %s, datetime = %s "
        "WHERE order_id = %s"
    )
    cursor.execute(
        update_query,
        (
            order.get('customer_name'),
            float(order.get('grand_total', 0)),
            datetime.now(),
            order_id
        )
    )

    cursor.execute("DELETE FROM order_details WHERE order_id = %s", (order_id,))

    order_details_data = []
    order_details_query = (
        "INSERT INTO order_details (order_id, products_id, quantity, total_price) "
        "VALUES (%s, %s, %s, %s)"
    )
    for order_detail_record in order.get('order_details', []):
        order_details_data.append([
            order_id,
            int(order_detail_record['products_id']),
            float(order_detail_record['quantity']),
            float(order_detail_record['total_price'])
        ])

    if order_details_data:
        cursor.executemany(order_details_query, order_details_data)

    connection.commit()
    cursor.close()

    return get_order_by_id(connection, order_id)

def delete_order(connection, order_id):
    order_id = int(order_id)
    cursor = connection.cursor()
    cursor.execute("DELETE FROM order_details WHERE order_id = %s", (order_id,))
    cursor.execute("DELETE FROM orders WHERE order_id = %s", (order_id,))
    connection.commit()
    cursor.close()
    return order_id

if __name__ == "__main__":
    try:
        connection = get_sql_connection()
        print("Database connection successful.")
        result = insert_order(connection,{
            "customer_name":"Jing",
            "grand_total":100,
            "order_details":[{
                "products_id":1,
                "quantity":10,
                "total_price":100
            },
            {
                "products_id":2,
                "quantity":20,
                "total_price":200
            }
            ]
        })
        print(f"Order ID: {result['order_id']}")
        print(f"Order Details: {result['order_details']}")
        print(get_all_orders(connection))
    except Exception as e:
        print(f"An error occurred: {e}")
