import mongoose from "mongoose";

const csvproductSchema = new mongoose.Schema({
    csvProductId: {
        type: String,
        unique: true,
        dropDups: true
    },
    title: String,
    body_html: String,
    price: Number,
    image1: String,
    image2: String,
    image3: String,
    image4: String,
    pdf1: String,
    pdf2: String,
    related_products: Array,
    csvSiteId: Number,
    active: Boolean,
});

var CsvProductModel = mongoose.model("CsvProduct", csvproductSchema);

module.exports = CsvProductModel;