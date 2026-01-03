from flask import Flask,request,jsonify, send_from_directory, session
import mysql.connector
import products_dao 
import uom_dao
import orders_dao
import users_dao
import customer_dao
import finances_dao
import json
import os
from sql_connection import get_sql_connection
from contextlib import contextmanager
from functools import wraps
app=Flask(__name__)
# secret key is required for Flask session support; in production use an environment variable
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Helper function to add CORS headers
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@contextmanager
def db_connection():
    """Yield a live MySQL connection and make sure it gets closed."""
    conn = get_sql_connection()
    try:
        conn.ping(reconnect=True, attempts=3, delay=2)
        yield conn
    finally:
        try:
            conn.close()
        except mysql.connector.Error:
            pass


def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = session.get('user')
        if not user:
            resp = jsonify({'error': 'authentication required'})
            resp.headers.add('Access-Control-Allow-Origin', '*')
            return resp, 401
        return f(*args, **kwargs)
    return wrapper

def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = session.get('user')
        user_role = session.get('role')
        if not user or user_role != 'admin':
            resp = jsonify({'error': 'admin access required'})
            resp.headers.add('Access-Control-Allow-Origin', '*')
            return resp, 403
        return f(*args, **kwargs)
    return wrapper

@app.route('/')
def index():
    # Handle both local development and Vercel deployment paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ui_path = os.path.join(base_dir, '..', 'ui')
    if not os.path.exists(ui_path):
        # Try alternative path for Vercel (when running from api/index.py)
        ui_path = os.path.join(base_dir, '..', '..', 'ui')
    if not os.path.exists(ui_path):
        # Try absolute path from project root
        ui_path = os.path.join(os.getcwd(), 'ui')
    return send_from_directory(ui_path, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    # Handle both local development and Vercel deployment paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ui_path = os.path.join(base_dir, '..', 'ui')
    if not os.path.exists(ui_path):
        # Try alternative path for Vercel (when running from api/index.py)
        ui_path = os.path.join(base_dir, '..', '..', 'ui')
    if not os.path.exists(ui_path):
        # Try absolute path from project root
        ui_path = os.path.join(os.getcwd(), 'ui')
    return send_from_directory(ui_path, filename)

@app.route('/getUOM', methods=['GET'])
def get_uom():
    with db_connection() as conn:
        response = uom_dao.get_uoms(conn)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/getProducts', methods=['GET'])
def get_products():
    with db_connection() as conn:
        response = products_dao.get_all_products(conn)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/getProductsByPrice', methods=['GET'])
def get_products_by_price():
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    if min_price is None or max_price is None:
        response = jsonify({'error': 'min_price and max_price query parameters are required.'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 400
    try:
        with db_connection() as conn:
            response_payload = products_dao.get_products_by_price_range(conn, min_price, max_price)
    except ValueError as exc:
        response = jsonify({'error': str(exc)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 400
    response = jsonify(response_payload)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/insertProduct', methods=['POST'])
@require_admin
def insert_product():
    request_payload = json.loads(request.form['data'])
    with db_connection() as conn:
        products_id = products_dao.insert_new_product(conn, request_payload)
    response = jsonify({
        'products_id': products_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/getAllOrders', methods=['GET'])
def get_all_orders():
    with db_connection() as conn:
        response = orders_dao.get_all_orders(conn)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/insertOrder', methods=['POST'])
@require_admin
def insert_order():
    request_payload = json.loads(request.form['data'])
    with db_connection() as conn:
        order_result = orders_dao.insert_order(conn, request_payload)
    response = jsonify(order_result)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/updateOrder', methods=['POST'])
@require_admin
def update_order():
    request_payload = json.loads(request.form['data'])
    with db_connection() as conn:
        order_result = orders_dao.update_order(conn, request_payload)
    response = jsonify(order_result)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/deleteOrder', methods=['POST'])
@require_admin
def delete_order():
    order_id = request.form.get('order_id')
    if not order_id:
        response = jsonify({'error': 'order_id is required'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 400
    with db_connection() as conn:
        orders_dao.delete_order(conn, order_id)
    response = jsonify({'order_id': int(order_id)})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/deleteProduct', methods=['POST'])
@require_admin
def delete_product():
    with db_connection() as conn:
        try:
            return_id = products_dao.delete_product(conn, request.form['products_id'])
        except ValueError as exc:
            response = jsonify({'error': str(exc)})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 409
        except mysql.connector.Error as exc:
            response = jsonify({'error': 'Unable to delete product.', 'details': str(exc)})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 500
    response = jsonify({
        'products_id': return_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/register', methods=['POST'])
def register():
    # Accept JSON body or form-encoded JSON in 'data' to be compatible with existing frontend
    request_payload = request.get_json() or json.loads(request.form.get('data', '{}'))
    username = request_payload.get('username')
    password = request_payload.get('password')
    role = request_payload.get('role', 'admin')  # Default to 'admin' as per user requirement
    if not username or not password:
        resp = jsonify({'error': 'username and password required'})
        resp.headers.add('Access-Control-Allow-Origin', '*')
        return resp, 400
    
    # Validate role
    if role not in ['admin', 'user']:
        resp = jsonify({'error': 'role must be either "admin" or "user"'})
        resp.headers.add('Access-Control-Allow-Origin', '*')
        return resp, 400

    with db_connection() as conn:
        user_id = users_dao.create_user(conn, username, password, role)
    if user_id is None:
        resp = jsonify({'error': 'username already exists'})
        resp.headers.add('Access-Control-Allow-Origin', '*')
        return resp, 409

    resp = jsonify({'user_id': user_id, 'role': role})
    resp.headers.add('Access-Control-Allow-Origin', '*')
    return resp


@app.route('/login', methods=['POST'])
def login():
    request_payload = request.get_json() or json.loads(request.form.get('data', '{}'))
    username = request_payload.get('username')
    password = request_payload.get('password')
    if not username or not password:
        resp = jsonify({'error': 'username and password required'})
        resp.headers.add('Access-Control-Allow-Origin', '*')
        return resp, 400

    with db_connection() as conn:
        user = users_dao.verify_user(conn, username, password)
    if user:
        # create session with user info including role
        session['user'] = user['username']
        session['user_id'] = user['user_id']
        session['role'] = user['role']
        resp = jsonify({
            'message': 'login successful',
            'username': user['username'],
            'role': user['role']
        })
        resp.headers.add('Access-Control-Allow-Origin', '*')
        return resp
    else:
        resp = jsonify({'error': 'invalid credentials'})
        resp.headers.add('Access-Control-Allow-Origin', '*')
        return resp, 401


@app.route('/current_user', methods=['GET'])
def current_user():
    user = session.get('user')
    role = session.get('role')
    resp = jsonify({'user': user, 'role': role})
    resp.headers.add('Access-Control-Allow-Origin', '*')
    return resp


@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    resp = jsonify({'message': 'logged out'})
    resp.headers.add('Access-Control-Allow-Origin', '*')
    return resp

# Customer API endpoints
@app.route('/getCustomers', methods=['GET'])
def get_customers():
    with db_connection() as conn:
        response = customer_dao.get_all_customers(conn)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/insertCustomer', methods=['POST'])
@require_admin
def insert_customer():
    request_payload = json.loads(request.form['data'])
    with db_connection() as conn:
        customer_id = customer_dao.insert_new_customer(conn, request_payload)
    response = jsonify({
        'Customer_id': customer_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/updateCustomer', methods=['POST'])
@require_admin
def update_customer():
    request_payload = json.loads(request.form['data'])
    with db_connection() as conn:
        customer_id = customer_dao.update_customer(conn, request_payload)
    response = jsonify({
        'Customer_id': customer_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/deleteCustomer', methods=['POST'])
@require_admin
def delete_customer():
    with db_connection() as conn:
        return_id = customer_dao.delete_customer(conn, request.form['Customer_id'])
    response = jsonify({
        'Customer_id': return_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# Finance API endpoints
@app.route('/getFinances', methods=['GET'])
def get_finances():
    with db_connection() as conn:
        response = finances_dao.get_all_finances(conn)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/insertFinance', methods=['POST'])
@require_admin
def insert_finance():
    request_payload = json.loads(request.form['data'])
    with db_connection() as conn:
        payment_id = finances_dao.insert_new_finance(conn, request_payload)
    response = jsonify({
        'payment_id': payment_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/updateFinance', methods=['POST'])
@require_admin
def update_finance():
    request_payload = json.loads(request.form['data'])
    with db_connection() as conn:
        payment_id = finances_dao.update_finance(conn, request_payload)
    response = jsonify({
        'payment_id': payment_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/deleteFinance', methods=['POST'])
@require_admin
def delete_finance():
    with db_connection() as conn:
        return_id = finances_dao.delete_finance(conn, request.form['payment_id'])
    response = jsonify({
        'payment_id': return_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/getOrderDetails/<int:order_id>', methods=['GET'])
def get_order_details(order_id):
    with db_connection() as conn:
        order = orders_dao.get_order_by_id(conn, order_id)
    if not order:
        response = jsonify({'error': 'order not found'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 404
    response = jsonify(order)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == "__main__":
    print("Starting Python Flask Server For Grocery Store Management System")
    app.run(port=5000)