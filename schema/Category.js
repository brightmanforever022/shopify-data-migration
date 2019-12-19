import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    categoryId: String,
    title: String
});

var CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;