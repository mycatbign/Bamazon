// bamazonCustomer - Customer View (Minimum Requirement)

// connect to the bamazon mysql database through a separate file to protect database access code
var mysql = require('mysql');
var connection = require('./bamazon_db_connect.js');

// connect to inquirer and start interacting with teh customer
var inquirer = require('inquirer');

// now lets go see what the customer would like to buy to the customer
customerPurchase();

// ==========================================================================================================
// customerPurchase() will loop until the user decides they do not want to perform any more purchases
// ==========================================================================================================
function customerPurchase() {
    console.log("\n");
    inquirer
        .prompt({
            name: "action",
            type: "rawlist",
            message: "What would you like to do?",
            choices: [
                "Purchase an item",
                "Quit"
            ]
        })
        .then(function (answer) {
            switch (answer.action) {
                // the user has decided to make a purchase
                case "Purchase an item":
                    displayProducts();
                    break;
                // the user has decided to exit and make no more purchases
                case "Quit":
                    customerQuits();
                    break;
            }
        });
} // end customerPurchase()

// ==========================================================================================================
// displayProducts() will display the products for the customer.
// ==========================================================================================================
function displayProducts() {
    // array holds list of items that the customer may purchase
    var productIDs = [];
    // query database and return back the list of products available for the customer to purchase 
    connection.query("SELECT * FROM bamazon_db.products", function (err, res) {
        if (err) throw err;

        // display all of the items available for sale - include ids, names, and prices of products for sale
        console.log("\n==============================< COMPLETE PRODUCT LISTING >==============================");
        console.log("-------------------< Includes all products with quantity of 0 or more >-------------------");
        for (var i = 0; i < res.length; i++) {
            console.log("Product-ID: " + res[i].item_id + " --- " + res[i].product_name + " --- Price --- " + res[i].price + " --- Qty --- " + res[i].stock_quantity);
            // save product ids in array so we can be sure customer selects valid product to purchase
            productIDs.push(res[i].item_id);
        } // end for loop
        console.log("============================< END COMPLETE PRODUCT LISTING >==============================\n");
        getCustomerInputs();
    }); // end display query
}

// ==========================================================================================================
// getCustomerInputs() executes every time the user says they want to make a purchase.
// ==========================================================================================================
function getCustomerInputs() {
    var orderID = -1;
    var orderQty = -1;

    inquirer
        .prompt([

            // prompt for the item id of the product the customer wishes to purchase
            // ID must be an integer
            {
                name: "selectedID",
                type: "input",
                message: "\nEnter the ID of the product you would like to purchase (or Ctrl+C to end):",
                validate: function (value) {
                    if (value > 0) {
                        // we have confirmed the item ID entered by the customer is a positive integer
                        return true;
                    } else {
                        console.log("\nSorry - you entered an invalid Product ID. Please try again.");
                        console.log("\nYou can enter Ctrl+C if you would like to end this purchase.");
                        return false;
                    }
                } // end validation
            }, // end item id prompt

            // prompt for the quantity of the item they wish to purchase
            // Qty must be an integer
            {
                name: "desiredQty",
                type: "input",
                message: "\nEnter the number of these products you would like to purchase (or Ctrl+C to end):",
                validate: function (value) {
                    if (value > 0) {
                        // we have confirmed the quantity entered is a positive integer
                        return true;
                    } else {
                        console.log("\nSorry - you entered an invalid Quantity. Please try again.");
                        console.log("\nYou can enter Ctrl+C if you would like to end this purchase.");
                        return false;
                    }
                } // end validation
            } // end desiredQty prompt
        ]) // end .prompt from inquirer
        .then(function (answer) {
            // validate the order by making sure the item exists and the quantity exists
            orderID = answer.selectedID;
            orderQty = answer.desiredQty;
            validateOrder(orderID, orderQty)
//            customerPurchase();
        }); // end .then from inquirer prompt
} // end getCustomerInputs()

// ==========================================================================================================
// validateOrder() confirms the ID is valid and that there is a valid quantity to support the purchase.
// ==========================================================================================================
function validateOrder(orderID, orderQty) {
    var newQty = -1;
    var totalAmt = -1;
    // Query db to confirm that the given item ID exists in the desired quantity
    var tempQuery = 'SELECT * FROM bamazon_db.products WHERE item_id = ' + orderID;
    connection.query(tempQuery, function (err, data) {
        if (err) throw err;

        var itemData = data[0];
        // check and see if what records the customer input has returned
        if (itemData.length === 0) {
            // if no records are returned an invalid item ID has been entered
            console.log("\nYou entered an invalid Product ID.");
            console.log("\nWe are unable to process your order.");
            console.log("\nPlease press <Enter> and try again.");
            return;

        } else if (itemData.length > 1) {
            // if more than one record was returned we can not process the request 
            console.log("\nMore than one product matches this ID.");
            console.log("\nWe are unable to process this order at this time.");
            console.log("\nPlease press <Enter> and try again.");
            return;

        } else if (orderQty > itemData.stock_quantity) {
            // if there are not enough items in stock to fulfill the order then we can not process the order
            console.log("\nYour request is for more units than we have in stock");
            console.log("\nWe are unable to process this order at this time.");
            console.log("\nPlease press <Enter> and try again.");
            return;

        } else {
            // we have on ly one matching record and enough stock to fulfill the order
            // perform calculations so we can update the database and the customer
            // newQty is the quantity we will use to update the database
            newQty = itemData.stock_quantity - orderQty;
            // totalAmt is the total cost to the customer that we will present back
            totalAmt = orderQty * itemData.price;
            // process the order
            processOrder(orderID, orderQty, newQty, totalAmt, itemData.product_name, itemData.price);
        } // end if-else statement
    }); // end query
} // end validateOrder()

// ==========================================================================================================
// processOrder() will fulfill the order for the customer - this fn assumes that we have already confirmed 
// there are enough items in inventory to accomodate the purchase
// fn recieves the specific item_id that the customer would like to purchase ad the qty they would like 
// ==========================================================================================================
function processOrder(orderID, orderQty, newQty, totalAmt, productName, orderPrice) {
    // variables
    // orderID is the item ID we will update
    // orderQty is the number of units ordered by the customer
    // newQty is the quantity we are going to update the record in the database with
    // totalAmt is the total cost for the customer for this purchase
    // productName is the description of the product
    // orderPrice is the amount paid for each unit

    // perform update to database to reflect the remaining quantity.
    connection.query("UPDATE bamazon_db.products SET stock_quantity = " + newQty + " WHERE item_id=" + orderID, function (err, res) {
        if (err) throw err;
        // inform the customer of the total cost of their purchase
        console.log("\nYou purchased: " + orderQty + " " + productName + " @ $" + orderPrice + " each. Your total cost: $" + totalAmt);
        console.log("\nThank you for shopping with us!");
        customerPurchase();
}); // end query
} // end processOrder()

// ==========================================================================================================
// customerQuits() executes when the user decides they do not want to make any more purchases.
// we simply thank the user then end the database connection.
// ==========================================================================================================
function customerQuits() {
    console.log("\nThank you for shopping with us. Please come again.");
    connection.end();
} // end customerQuits()

// ==========================================================================================================
// inArray() used to verify that the product id entered by the customer is in the array of valid item ids
// takes input of the value entered by the customer and the array of product item_ids
// the targetID is expected to be an integer and currArray is an array of integers
// ==========================================================================================================
function inArray(targetID, currArray) {
    var count = currArray.length;
    for (var i = 0; i < count; i++) {
        if (currArray[i] == targetID) {
            return true;
        } // end if 
    } // end for
    return false;
} // end inArray

