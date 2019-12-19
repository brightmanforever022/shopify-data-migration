import mongoose from "mongoose";

const productErrorSchema = new mongoose.Schema({
	title: String,
	dbProductId: String,
	reason: String
});

var ProductErrorModel = mongoose.model("ProductError", productErrorSchema);

module.exports = ProductErrorModel;