from werkzeug.security import generate_password_hash, check_password_hash


def create_user(connection, username, password, role='admin'):

    cursor = connection.cursor()

    # check if username already exists
    query = "SELECT COUNT(*) FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    row = cursor.fetchone()
    if row and row[0] > 0:
        return None

    password_hash = generate_password_hash(password)
    insert_query = "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)"
    cursor.execute(insert_query, (username, password_hash, role))
    connection.commit()
    return cursor.lastrowid


def find_user_by_username(connection, username):
    cursor = connection.cursor()
    query = "SELECT user_id, username, password_hash, role FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    row = cursor.fetchone()
    if not row:
        return None
    return {"user_id": row[0], "username": row[1], "password_hash": row[2], "role": row[3]}


def verify_user(connection, username, password):
    """Return user dict if username/password match an existing user, None otherwise."""
    user = find_user_by_username(connection, username)
    if not user:
        return None
    if check_password_hash(user['password_hash'], password):
        # Return user info without password_hash
        return {"user_id": user['user_id'], "username": user['username'], "role": user['role']}
    return None


def get_user_by_id(connection, user_id):
    cursor = connection.cursor()
    query = "SELECT user_id, username FROM users WHERE user_id = %s"
    cursor.execute(query, (user_id,))
    row = cursor.fetchone()
    if not row:
        return None
    return {"user_id": row[0], "username": row[1]}
