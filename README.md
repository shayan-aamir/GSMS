# GSMS - Grocery Store Management System

A full-stack web application for managing grocery store operations including products, customers, orders, and finances. Built with Python Flask backend and a modern HTML/CSS/JavaScript frontend.

## Features

- 🔐 **User Authentication** - Secure login system with role-based access control (Admin/User)
- 📦 **Product Management** - Add, update, delete, and view products with unit of measure (UOM) support
- 👥 **Customer Management** - Manage customer information including name, email, and phone number
- 🛒 **Order Management** - Create, view, update, and delete orders with detailed order tracking
- 💰 **Finance Management** - Track payments and financial transactions linked to customers
- 📊 **Dashboard** - Overview of all orders with detailed order information

## Tech Stack

### Backend
- **Python 3.x**
- **Flask** - Web framework
- **MySQL Connector** - Database connectivity
- **Werkzeug** - WSGI utilities

### Frontend
- **HTML5/CSS3**
- **JavaScript (ES6+)**
- **Bootstrap** - UI framework
- **jQuery** - DOM manipulation and AJAX

### Database
- **MySQL** - Relational database management system

## Project Structure

```
GSMS/
├── api/
│   └── index.py               # Vercel serverless function entrypoint
├── backend/
│   ├── server.py              # Flask application and API routes
│   ├── sql_connection.py      # Database connection configuration
│   ├── products_dao.py        # Product data access operations
│   ├── customer_dao.py        # Customer data access operations
│   ├── orders_dao.py          # Order data access operations
│   ├── finances_dao.py        # Finance data access operations
│   ├── users_dao.py           # User authentication operations
│   └── uom_dao.py             # Unit of Measure operations
├── ui/
│   ├── index.html             # Dashboard page
│   ├── login.html             # Login page
│   ├── order.html             # Order management page
│   ├── manage-product.html    # Product management page
│   ├── manage-customer.html   # Customer management page
│   ├── manage-finance.html    # Finance management page
│   ├── css/                   # Stylesheets
│   ├── js/
│   │   ├── custom/            # Custom JavaScript modules
│   │   └── packages/          # Third-party libraries
│   └── images/                # Image assets
├── database_schema.sql         # Database schema and initial data
├── requirements.txt           # Python dependencies
├── vercel.json                # Vercel deployment configuration
├── .vercelignore              # Files to ignore during Vercel deployment
└── README.md                  # Project documentation
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.7+** - [Download Python](https://www.python.org/downloads/)
- **MySQL Server** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **pip** - Python package manager (usually comes with Python)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GSMS
```

### 2. Set Up Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Database

1. Start your MySQL server
2. Create a new database and user (or use existing credentials)
3. Update database credentials in `backend/sql_connection.py`:

```python
def get_sql_connection():
    return mysql.connector.connect(
        user='your_username',
        password='your_password',
        database='grocery_store',
        host='127.0.0.1',
        port=3306,
        autocommit=True
    )
```

4. Import the database schema:

```bash
mysql -u your_username -p < database_schema.sql
```

### 5. Set Environment Variables (Optional)

For production, set a secure secret key:

```bash
# On Windows (PowerShell):
$env:SECRET_KEY="your-secret-key-here"

# On macOS/Linux:
export SECRET_KEY="your-secret-key-here"
```

## Running the Application

1. Navigate to the backend directory:

```bash
cd backend
```

2. Start the Flask server:

```bash
python server.py
```

3. Open your web browser and navigate to:

```
http://localhost:5000
```

4. You will be redirected to the login page. Use the registration endpoint or create a user directly in the database to log in.

## Deployment on Vercel

This application can be deployed on Vercel as a serverless function. The project includes the necessary configuration files.

### Prerequisites for Vercel Deployment

1. A Vercel account ([Sign up here](https://vercel.com))
2. A MySQL database (consider using services like [PlanetScale](https://planetscale.com), [Railway](https://railway.app), or [AWS RDS](https://aws.amazon.com/rds/))
3. Vercel CLI (optional, for local testing): `npm i -g vercel`

### Deployment Steps

1. **Push your code to GitHub** (if not already done)

2. **Import your project to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure Environment Variables** in Vercel:
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     ```
     DB_USER=your_database_username
     DB_PASSWORD=your_database_password
     DB_NAME=grocery_store
     DB_HOST=your_database_host
     DB_PORT=3306
     SECRET_KEY=your_secure_random_secret_key
     ```

4. **Deploy**:
   - Vercel will automatically detect the Flask app from `api/index.py`
   - The deployment will use the `vercel.json` configuration
   - After deployment, your app will be available at `https://your-project.vercel.app`

### Important Notes for Vercel

- **Database Connection**: Ensure your MySQL database allows connections from Vercel's IP addresses. You may need to whitelist all IPs or use a database service that supports serverless connections.
- **Cold Starts**: Serverless functions may experience cold starts. Consider using Vercel Pro for better performance.
- **File Paths**: The static file serving has been updated to work with Vercel's serverless environment.
- **Session Storage**: Flask sessions use server-side storage by default. For production, consider using Redis or database-backed sessions.

### Local Testing with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /current_user` - Get current logged-in user information

### Products
- `GET /getProducts` - Get all products
- `GET /getProductsByPrice?min_price=X&max_price=Y` - Get products by price range
- `POST /insertProduct` - Create a new product (Admin only)
- `POST /deleteProduct` - Delete a product (Admin only)

### Customers
- `GET /getCustomers` - Get all customers
- `POST /insertCustomer` - Create a new customer (Admin only)
- `POST /updateCustomer` - Update customer information (Admin only)
- `POST /deleteCustomer` - Delete a customer (Admin only)

### Orders
- `GET /getAllOrders` - Get all orders
- `GET /getOrderDetails/<order_id>` - Get order details by ID
- `POST /insertOrder` - Create a new order (Admin only)
- `POST /updateOrder` - Update an order (Admin only)
- `POST /deleteOrder` - Delete an order (Admin only)

### Finances
- `GET /getFinances` - Get all financial records
- `POST /insertFinance` - Create a new finance record (Admin only)
- `POST /updateFinance` - Update a finance record (Admin only)
- `POST /deleteFinance` - Delete a finance record (Admin only)

### Utilities
- `GET /getUOM` - Get all units of measure

## Default Data

The database schema includes initial data for units of measure:
- `kg` (kilograms)
- `each` (individual items)

## User Roles

- **Admin**: Full access to all features including create, update, and delete operations
- **User**: Read-only access to view products, customers, orders, and finances

## Security Notes

⚠️ **Important**: Before deploying to production:

1. Change the default secret key in `server.py` to a secure random value
2. Update database credentials in `sql_connection.py` and use environment variables
3. Implement HTTPS for secure data transmission
4. Add input validation and sanitization
5. Implement rate limiting for API endpoints
6. Use prepared statements (already implemented via MySQL Connector)
7. Review and update CORS settings for production

## Development

### Adding New Features

1. Create a new DAO file in `backend/` for data access operations
2. Add corresponding routes in `backend/server.py`
3. Create frontend pages/modules in `ui/` as needed
4. Update the database schema if new tables are required

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent indentation

## Troubleshooting

### Database Connection Issues
- Verify MySQL server is running
- Check database credentials in `sql_connection.py`
- Ensure the database `grocery_store` exists

### Port Already in Use
- Change the port in `server.py`: `app.run(port=5000)` to a different port
- Or stop the process using port 5000

### Module Not Found Errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is part of a Bachelor's degree coursework. Please check with the project owner for licensing information.

## Authors

- Developed as part of Database Systems (DBS) coursework - Semester 5

## Acknowledgments

- Flask community for excellent documentation
- Bootstrap team for the UI framework
- MySQL for robust database management

---

**Note**: This is an educational project. For production use, additional security measures and optimizations are recommended.

