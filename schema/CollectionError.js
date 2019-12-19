import mongoose from "mongoose";

const collectionErrorSchema = new mongoose.Schema({
    title: String,
    dbSubCategoryId: String
});

var CollectionErrorModel = mongoose.model("CollectionError", collectionErrorSchema);

module.exports = CollectionErrorModel;