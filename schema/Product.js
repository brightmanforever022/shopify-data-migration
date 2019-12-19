import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: String,
    body_html: String,
    metafields: Array,
    product_type: String,
    vendor: String,
    tags: Array,
    published: Boolean,
    options: Array,
    images: Array,
    shopifyProductId: String,
    csvProductId: String,
    shopifyCollectionId: String,
});

var ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;