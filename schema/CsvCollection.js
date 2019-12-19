import mongoose from "mongoose";

const csvCollectionSchema = new mongoose.Schema({
	title: {
		type: String,
		unique: true,
		dropDups: true
	},
	body_html: String,
	csvCategoryId: String,
	csvCategoryTitle: String,
	csvSubCategoryId: String
});

var CsvCollectionModel = mongoose.model("CsvCollection", csvCollectionSchema);

module.exports = CsvCollectionModel;