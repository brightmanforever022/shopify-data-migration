import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
    title: String,
    body_html: String,
    metafields: Array,
    csvCategoryId: String,
    csvCategoryTitle: String,
    csvSubCategoryId: String,
    shopifyCollectionId: String,
});

var CollectionModel = mongoose.model("Collection", collectionSchema);

module.exports = CollectionModel;