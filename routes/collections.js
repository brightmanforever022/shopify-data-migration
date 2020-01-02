import express from "express"
import CollectionError from "../schema/CollectionError"
import { MongoClient } from 'mongodb'
require('dotenv').config()

const mongoUrl = 'mongodb://localhost:27017'
const dbName = 'display4sale'

const router = express.Router()
const Shopify = require('shopify-api-node')
const shopify = new Shopify({
	shopName: process.env.shop_name,
	apiKey: process.env.shop_api_key,
	password: process.env.shop_api_password,
	timeout: 50000,
	autoLimit: {
		calls: 2,
		interval: 1000,
		bucketSize: 35
	}
})

router.get("/prepare2", async (req, res, next) => {
	const csvFilePath3 = './csv/SubCategories.csv'
	const subCatList = await csv().fromFile(csvFilePath3)
	var db = mongoose.connection
	
	subCatList.map(subCat => {
		if (subCat.MenuActive != 0 && parseInt(subCat.SubCatID) > 0) {
			db.collection('catsubcats').aggregate([
				{ $match: {
					'subCategoryId': subCat.SubCatID
				}},
				{ $lookup: {
						from: 'categories',
						localField: 'categoryId',
						foreignField: 'categoryId',
						as: 'categoryDetail'
					}
				}
			]).toArray((err, res) => {
				if (err) {
					next(err)
				} else {
					var csvCollection = new CsvCollection()
					csvCollection.title = subCat.Title
					csvCollection.csvSubCategoryId = subCat.SubCatID

					if (res.length != 0) {
						csvCollection.csvCategoryId = res[0].categoryDetail[0].categoryId
						csvCollection.csvCategoryTitle = res[0].categoryDetail[0].title
					}
					csvCollection.save()
				}
			})
		}
	})

	console.log("End of preparetion in base data")
	res.render('home')
})

router.get("/", async (req, res, next) => {
	const client = await MongoClient.connect(mongoUrl)
	const mydb = client.db(dbName)
	const collection = mydb.collection('subcategories')
	
	// Post subcategories to shopify and store collection data into db. If error, it stores into error list of db
	const collects = await collection.find({SiteID: 1, MenuURL: ''})
	collects.forEach(collect => {
		var smart_collection = {
			title: collect.Title,
			rules: [{
				column: 'tag',
				relation: 'equals',
				condition: collect.Title
			}]
		}
		shopify.smartCollection.create(smart_collection).then(result => {
			collection.updateOne(
				{_id: collect._id},
				{$set: {shopifyCollectionId: result.id}}
			)
		}).catch(shopifyError => {
			console.log('creating error: ', shopifyError)
			var collectionError = new CollectionError()
			collectionError.title = collect.Title
			collectionError.dbSubCategoryId = collect.SubCatID
			collectionError.save(err => {
				if (err) {
					return next(err)
				} else {
					console.log('Could not create collection with this: ', collect.SubCatID)
				}
			})
		})
	})
	
	res.render('home')
})

module.exports = router