DROP DATABASE IF EXISTS grocery_store;
CREATE DATABASE grocery_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE grocery_store;

CREATE TABLE uom (
    uom_id INT AUTO_INCREMENT PRIMARY KEY,
    uom_name VARCHAR(45) NOT NULL UNIQUE
);

CREATE TABLE customer (
    Customer_id INT AUTO_INCREMENT PRIMARY KEY,
    Customer_name VARCHAR(100) NOT NULL,
    Email VARCHAR(100),
    PhoneNum VARCHAR(20),
    UNIQUE KEY uq_customer_email (Email)
);

CREATE TABLE products (
    products_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    uom_id INT NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (uom_id) REFERENCES uom(uom_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_details (
    order_id INT NOT NULL,
    products_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (order_id, products_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (products_id) REFERENCES products(products_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE finances (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    total_price DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(45) NOT NULL,
    date DATE NOT NULL,
    Customer_id INT NULL,
    FOREIGN KEY (Customer_id) REFERENCES customer(Customer_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);



insert into uom (uom_id , uom_name) values (1 , 'kg');
insert into uom (uom_id , uom_name) values (2 , 'each');

select * from products;


ALTER TABLE products ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
UPDATE products SET is_active = 1 WHERE is_active IS NULL;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);