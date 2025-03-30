require("dotenv").config();
require("./middlewares/auth");

const multer = require("multer");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const upload = multer();


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());

const userController = require("./controllers/usersController");
const authController = require("./controllers/authController");
const productController = require("./controllers/productController");
const orderController = require("./controllers/orderController");
const port = 5000;

app.use("/auth", authController);
app.use("/users", userController);
app.use("/products", productController);
app.use("/orders", orderController);



app.get("/", (req, res) => {
    res.send({
        message: "server is running",
        version: 1.2,
        env:{
            mongodb_url: process.env.mongodb_url,
            db_name: process.env.mongodb_db_name,
            secret: process.env.jwt_secret
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at localhost:${port}`);
});