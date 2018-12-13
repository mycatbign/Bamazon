-- bamazon schema

drop database bamazon_db;

create database bamazon_db;

use bamazon_db;

create table products(
    item_id integer not null auto_increment primary key,
    product_name varchar(50) not null,
    department_name varchar(50) not null,
    price decimal(10,2) not null,
    stock_quantity integer not null
);	

insert into products(product_name, department_name, price, stock_quantity)
values 
('Bicycle','Sporting Goods', 199.99, 25), 
('Skateboard','Sporting Goods', 39.49, 63), 
('Surfboard','Sporting Goods', 479.00, 25), 
('iPhone','Electronics', 799.99, 150), 
('Tablet','Electronics', 299.59, 65), 
('Laptop','Electronics', 599.79, 54), 
('Jacket','Clothing', 99.99, 65), 
('Overcoat','Clothing', 49.49, 25), 
('Raincoat','Clothing', 19.29, 84), 
('Boots','Clothing', 69.25, 34), 
('Cookies','Groceries', 1.99, 112), 
('Gatorade','Groceries', 2.79, 92), 
('Pepsi','Groceries', 3.99, 83);

create table departments(
    department_id integer not null auto_increment primary key,
    department_name varchar(100) not null,
    over_head_costs varchar(50) not null,
    price decimal(10,2) not null,
    stock_quantity integer not null
);	
