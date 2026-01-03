from sql_connection import get_sql_connection


def get_all_customers(connection):
    cursor = connection.cursor()
    query = "SELECT Customer_id, Customer_name, Email, PhoneNum FROM customer"
    cursor.execute(query)
    response = []
    for (Customer_id, Customer_name, Email, PhoneNum) in cursor:
        response.append({
            "Customer_id": Customer_id,
            "Customer_name": Customer_name,
            "Email": Email,
            "PhoneNum": PhoneNum
        })
    cursor.close()
    return response


def insert_new_customer(connection, customer):
    cursor = connection.cursor()
    query = (
        "INSERT INTO customer (Customer_name, Email, PhoneNum) VALUES (%s, %s, %s)"
    )
    data = (customer['Customer_name'], customer['Email'], customer['PhoneNum'])
    cursor.execute(query, data)
    connection.commit()
    customer_id = cursor.lastrowid
    cursor.close()
    return customer_id


def delete_customer(connection, customer_id):
    cursor = connection.cursor()
    query = "DELETE FROM customer WHERE Customer_id = %s"
    cursor.execute(query, (customer_id,))
    connection.commit()
    cursor.close()
    return customer_id


def update_customer(connection, customer):
    cursor = connection.cursor()
    query = (
        "UPDATE customer SET Customer_name = %s, Email = %s, PhoneNum = %s WHERE Customer_id = %s"
    )
    data = (customer['Customer_name'], customer['Email'], customer['PhoneNum'], customer['Customer_id'])
    cursor.execute(query, data)
    connection.commit()
    cursor.close()
    return customer['Customer_id']


if __name__ == "__main__":
    connection = get_sql_connection()
    print(get_all_customers(connection))
    print(insert_new_customer(connection, {
        "Customer_name": "John Doe",
        "Email": "john@example.com",
        "PhoneNum": "1234567890"
    }))

