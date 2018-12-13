// bamazonManager - Manager View (Next Level)

// connect to the bamazon mysql database through a separate file to protect database access code
var mysql = require('mysql');
var connection = require('./bamazon_db_connect.js');

// connect to inquirer and start interacting with teh customer
var inquirer = require('inquirer');

// now lets go see what the customer would like to buy to the customer
managerFunctions();

// ==========================================================================================================
// managerFuunctions() will loop through manager options until they chose to quit
// ==========================================================================================================
function managerFunctions() {
    console.log("\n");
    inquirer
        .prompt({
            name: "action",
            type: "rawlist",
            message: "What would you like to do?",
            choices: [
                "View Products for Sale",
                "View Low Inventory",
                "Add to Inventory",
                "Add New Product",
                "Quit"
            ]
        })
        .then(function (answer) {
            switch (answer.action) {
                // the user wishes to see all products for sale
                case "View Products for Sale":
                    viewProducts();
                    break;
                // the user wishes to see low inventory items
                case "View Low Inventory":
                    lowInventory();
                    break;
                // the user wishes to add items to inventory
                case "Add to Inventory":
                    addInventory();
                    break;
                // the user wishes to add products to inventory
                case "Add New Product":
                    addProduct();
                    break;
                // the user has decided to exit
                case "Quit":
                    managerQuits();
                    break;
            }
        });
} // end managerFunctions()

// ==========================================================================================================
// managerQuits() executes when the user decides they do not want to continue
// ==========================================================================================================
function managerQuits() {
    console.log("\nDisconnecting from database. Please come again.");
    connection.end();
} // end managerQuits()

// ==========================================================================================================
// viewProducts() list every available item: the item IDs, names, prices, and quantities. 
// ==========================================================================================================
function viewProducts() {
    // query database and return back the list of products available for the customer to purchase 
    connection.query("SELECT * FROM bamazon_db.products", function (err, res) {
        if (err) throw err;

        // display all of the items available for sale - include ids, names, and prices of products for sale
        console.log("\n==============================< COMPLETE PRODUCT LISTING >==============================");
        console.log("-------------------< Includes all products with quantity of 0 or more >-------------------");

        for (var i = 0; i < res.length; i++) {
            console.log("Product-ID: " + res[i].item_id + " --- " + res[i].product_name + " --- Price --- " + res[i].price + " --- Qty --- " + res[i].stock_quantity);
        } // end for loop
        console.log("============================< END COMPLETE PRODUCT LISTING >==============================\n");
        managerFunctions();
    }); // end display query
} // end viewProducts()

// ==========================================================================================================
// lowInventory() lists all items with an inventory count lower than five.
// ==========================================================================================================
function lowInventory() {
    // query database and return back the list of low inventory items 
    connection.query("SELECT * FROM bamazon_db.products WHERE stock_quantity < 5", function (err, res) {
        if (err) throw err;

        // display all of the items available for sale - include ids, names, and prices of products for sale
        console.log("\n==============================< LOW INVENTORY LISTING >==============================");
        console.log("-------------------< Includes all products with quantity lass than 5 >-----------------");
        for (var i = 0; i < res.length; i++) {
            console.log("Product-ID: " + res[i].item_id + " --- " + res[i].product_name + " --- Price --- " + res[i].price + " --- Qty --- " + res[i].stock_quantity);
        } // end for loop
        console.log("============================< END LOW INVENTORY LISTING >==============================\n");
        managerFunctions();
    }); // end display query
} // end lowInventory()

// ==========================================================================================================
// addInventory() prompts manager to "add more" of any item currently in the store.
// ==========================================================================================================
function addInventory() {
    var updateID = -1;
    var updateQty = -1;
    var tempQuery = "";

    // we need to query the manager for the item ID and the quantity they wish to add
    inquirer
        .prompt([

            // prompt for the item id of the product the manager wishes to update
            // ID must be an integer
            {
                name: "selectedID",
                type: "input",
                message: "Enter the ID of the product you would like to update (or Ctrl+C to end):",
                validate: function (value) {
                    if (value > 0) {
                        // we have confirmed the item ID entered by the customer is a positive integer
                        return true;
                    } else {
                        console.log("\nSorry - you entered an invalid Product ID. Please try again.");
                        console.log("\nYou can enter Ctrl+C if you would like to end this update.");
                        return false;
                    }
                } // end validation
            }, // end item id prompt

            // prompt for the quantity of the item they wish to add
            // Qty must be an integer
            {
                name: "desiredQty",
                type: "input",
                message: "Enter the number of these products you would like to add (or Ctrl+C to end):",
                validate: function (value) {
                    if (value > 0) {
                        // we have confirmed the quantity entered is a positive integer
                        return true;
                    } else {
                        console.log("\nSorry - you entered an invalid Quantity. Please try again.");
                        console.log("\nYou can enter Ctrl+C if you would like to end this update.");
                        return false;
                    }
                } // end validation
            } // end desiredQty prompt
        ]) // end .prompt from inquirer
        .then(function (answer) {
            // validate the order by making sure the item exists and the quantity exists
            updateID = answer.selectedID;
            updateQty = answer.desiredQty;

            // now find the record to update and get the current stock quantity
            tempQuery = 'SELECT * FROM bamazon_db.products WHERE item_id = ' + updateID;
            connection.query(tempQuery, function (err, data) {
                if (err) throw err;
                // capture the current stock amount
                var itemData = data[0];
                var currQty = itemData.stock_quantity;
                var currProductName = itemData.product_name;
                var newQty = parseInt(currQty) + parseInt(updateQty);                
                // now perform update to database to reflect the update.
                tempQuery = 'UPDATE bamazon_db.products SET stock_quantity = ' + newQty + ' WHERE item_id = ' + updateID;
                connection.query(tempQuery, function (err, res) {
                    if (err) throw err;
                    // inform the manager of the update
                    console.log("\nYou updated: " + currProductName + " Quantity from " + currQty + " to " + newQty + ".");
                    console.log("\nPress any key to continue.");
                    managerFunctions();
                }); // end update query
            }); // end query for current record 
        }); // end .then from inquirer prompt
} // end addInventory()

// ==========================================================================================================
// addProduct() allows the manager to add a completely new product to the store.
// ==========================================================================================================
function addProduct() {
    var tempProductName = "";
    var tempQty = -1;
    var tempPrice = -1;
    var tempDept = "";
    var tempQuery = "";

    // we need to query the manager for the information needed to add a  new product which includes:
    //   product name 
    //   price
    //   quantity on hand
    //   department - which should be a pick list
    //   note that the item_id will be added automatically 
    inquirer
        .prompt([

            // prompt for the product name
            {
                name: "addProductName",
                type: "input",
                message: "Enter the product name (or Ctrl+C to end):",
                validate: function (value) {
                    if (value.length > 0) {
                        // we have confirmed the product name was entered
                        return true;
                    } else {
                        console.log("\nSorry - you entered an invalid Product Name. Please try again.");
                        console.log("\nYou can enter Ctrl+C if you would like to end this update.");
                        return false;
                    }
                } // end validation
            }, // end product name prompt

            // prompt for the price of the product
            {
                name: "addPrice",
                type: "input",
                message: "Enter the price of the product (or Ctrl+C to end):",
                validate: function (value) {
                    if (value > 0) {
                        // we have confirmed the price entered is a positive integer
                        return true;
                    } else {
                        console.log("\nSorry - you entered an invalid Price. Please try again.");
                        console.log("\nYou can enter Ctrl+C if you would like to end this update.");
                        return false;
                    }
                } // end validation
            }, // end price prompt

            // prompt for the quantity on hand
            {
                name: "addQty",
                type: "input",
                message: "Enter the current quantity on hand of the product (or Ctrl+C to end):",
                validate: function (value) {
                    if (value > 0) {
                        // we have confirmed the quantity entered is a positive integer
                        return true;
                    } else {
                        console.log("\nSorry - you entered an invalid Quantity. Please try again.");
                        console.log("\nYou can enter Ctrl+C if you would like to end this update.");
                        return false;
                    }
                } // end validation
            }, // end quantity prompt

            // prompt for the department
            {
                name: "addDept",
                type: "list",
                message: "Select the department the prodiuct is in (or Ctrl+C to end):",
                choices: [
                    "Sporting Goods",
                    "Clothing",
                    "Electronics",
                    "Groceries"
                ]
            } // end department prompt
        ]) // end .prompt from inquirer
        .then(function (answer) {
            // convert all of the inputs to the data we need to add a record to the database
            tempProductName = answer.addProductName;
            tempQty = answer.addQty;
            tempPrice = answer.addPrice;
            tempDept = answer.addDept;

            // next build the INSERT SQL statement
            tempQuery = "INSERT INTO bamazon_db.products (product_name, department_name, price, stock_quantity)"
                + " values('" + tempProductName + "','" + tempDept + "'," + tempPrice + "," + tempQty + ")";
            // now add thenew product reccord to the table
            connection.query(tempQuery, function (err, data) {
                if (err) throw err;
                // inform the manager of the update
                console.log("\nYou added: " + tempProductName + " Quantity: " + tempQty + " Price: " + tempPrice + " Dept: " + tempDept + ".");
                console.log("\nPress any key to continue.");
                managerFunctions();
            }); // end query for current record 
        }); // end .then from inquirer prompt
} // end addProduct()
