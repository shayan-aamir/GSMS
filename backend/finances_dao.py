from sql_connection import get_sql_connection
from datetime import datetime


def get_all_finances(connection):
    cursor = connection.cursor()
    # First check if Customer_id column exists
    try:
        # Try to get with Customer_id join
        query = """
            SELECT f.payment_id, f.total_price, f.payment_type, f.date, 
                   COALESCE(f.Customer_id, NULL) as Customer_id,
                   COALESCE(c.Customer_name, NULL) as Customer_name
            FROM finances f
            LEFT JOIN customer c ON f.Customer_id = c.Customer_id
            ORDER BY f.payment_id DESC
        """
        cursor.execute(query)
        response = []
        for row in cursor:
            if len(row) == 6:
                (payment_id, total_price, payment_type, date, customer_id, customer_name) = row
                response.append({
                    "payment_id": payment_id,
                    "total_price": total_price,
                    "payment_type": payment_type,
                    "date": date,
                    "Customer_id": customer_id,
                    "Customer_name": customer_name
                })
            else:
                (payment_id, total_price, payment_type, date) = row
                response.append({
                    "payment_id": payment_id,
                    "total_price": total_price,
                    "payment_type": payment_type,
                    "date": date,
                    "Customer_id": None,
                    "Customer_name": None
                })
        cursor.close()
        return response
    except Exception as e:
        # Fallback if Customer_id column doesn't exist in finances table
        cursor.close()
        cursor = connection.cursor()
        query = "SELECT payment_id, total_price, payment_type, date FROM finances ORDER BY payment_id DESC"
        cursor.execute(query)
        response = []
        for (payment_id, total_price, payment_type, date) in cursor:
            response.append({
                "payment_id": payment_id,
                "total_price": total_price,
                "payment_type": payment_type,
                "date": date,
                "Customer_id": None,
                "Customer_name": None
            })
        cursor.close()
        return response


def insert_new_finance(connection, finance):
    cursor = connection.cursor()
    # Check if Customer_id column exists
    try:
        # Try to get column names
        cursor.execute("SHOW COLUMNS FROM finances LIKE 'Customer_id'")
        has_customer_id = cursor.fetchone() is not None
        
        if has_customer_id:
            query = (
                "INSERT INTO finances (total_price, payment_type, date, Customer_id) VALUES (%s, %s, %s, %s)"
            )
            customer_id = finance.get('Customer_id') if finance.get('Customer_id') else None
            data = (finance['total_price'], finance['payment_type'], finance.get('date', datetime.now().strftime('%Y-%m-%d')), customer_id)
        else:
            query = (
                "INSERT INTO finances (total_price, payment_type, date) VALUES (%s, %s, %s)"
            )
            data = (finance['total_price'], finance['payment_type'], finance.get('date', datetime.now().strftime('%Y-%m-%d')))
    except:
        # Fallback without Customer_id
        query = (
            "INSERT INTO finances (total_price, payment_type, date) VALUES (%s, %s, %s)"
        )
        data = (finance['total_price'], finance['payment_type'], finance.get('date', datetime.now().strftime('%Y-%m-%d')))
    
    cursor.execute(query, data)
    connection.commit()
    payment_id = cursor.lastrowid
    cursor.close()
    return payment_id


def delete_finance(connection, payment_id):
    cursor = connection.cursor()
    query = "DELETE FROM finances WHERE payment_id = %s"
    cursor.execute(query, (payment_id,))
    connection.commit()
    cursor.close()
    return payment_id


def update_finance(connection, finance):
    cursor = connection.cursor()
    try:
        # Check if Customer_id column exists
        cursor.execute("SHOW COLUMNS FROM finances LIKE 'Customer_id'")
        has_customer_id = cursor.fetchone() is not None
        
        if has_customer_id:
            query = (
                "UPDATE finances SET total_price = %s, payment_type = %s, date = %s, Customer_id = %s WHERE payment_id = %s"
            )
            customer_id = finance.get('Customer_id') if finance.get('Customer_id') else None
            data = (finance['total_price'], finance['payment_type'], finance['date'], customer_id, finance['payment_id'])
        else:
            query = (
                "UPDATE finances SET total_price = %s, payment_type = %s, date = %s WHERE payment_id = %s"
            )
            data = (finance['total_price'], finance['payment_type'], finance['date'], finance['payment_id'])
    except:
        # Fallback without Customer_id
        query = (
            "UPDATE finances SET total_price = %s, payment_type = %s, date = %s WHERE payment_id = %s"
        )
        data = (finance['total_price'], finance['payment_type'], finance['date'], finance['payment_id'])
    
    cursor.execute(query, data)
    connection.commit()
    cursor.close()
    return finance['payment_id']


if __name__ == "__main__":
    connection = get_sql_connection()
    print(get_all_finances(connection))

