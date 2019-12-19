import express from "express";
import bodyparser from "body-parser";
import cors from "cors";

import db from "./config/database";
import hb from "./config/handlebars"
import users from "./routes/users"
import collections from "./routes/collections"
import products from "./routes/products"
import dbupload from "./routes/db"

import frommstomongo from "./routes/frommstomongo"

require('dotenv').config()
const app = express();

//set template engine
app.engine("hbs", hb);
app.set("view engine","hbs");

//make way for some custom css, js and images
app.use('/custom/css', express.static(__dirname + '/views/static/css'));
app.use('/custom/js', express.static(__dirname + '/views/static/js'));
app.use('/custom/imgs', express.static(__dirname + '/views/static/imgs'));

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));

app.use("/users", users);
app.use("/collections", collections);
app.use("/products", products);
app.use("/frommstomongo", frommstomongo)
app.use("/dbupload", dbupload)

//Home route
app.get('/', (req, res) => {
    res.render('home');
});

module.exports = app;