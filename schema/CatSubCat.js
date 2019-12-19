import mongoose from "mongoose";

const catSubCatSchema = new mongoose.Schema({
	categoryId: String,
    subCategoryId: String
});

var CatSubCatModel = mongoose.model("CatSubCat", catSubCatSchema);

module.exports = CatSubCatModel;