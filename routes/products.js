import express from "express"
import ProductError from "../schema/ProductError"
import mongoose from "mongoose"
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
async function asyncForEach1(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
async function asyncForEach2(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
async function asyncForEach3(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
async function asyncForEach4(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
router.get("/", (req, res, next) => {
	res.status(200).json({
		message:"Serving Products on the Endpoint."
	})
})

router.get("/list", (req, res, next) => {
	Product.find({})
		.exec()
		.then(docs => {
			console.log('product list: ', docs)
		})
		.catch(err => {
			console.log(err)
		})
})

router.get('/prepare1', async (req, res, next) => {
	const csvFilePath1 = './csv/Products - Copy.csv'
	const readStream=require('fs').createReadStream(csvFilePath1)
	readStream
	.pipe(parse({ columns: ['ProductID', 'SiteID', 'ModelName', 'HTMLIntro', 'SubDesc', 'ListPrice', 'OurPrice', 
														'DemoPrice', 'Image1', 'Image2', 'PDF1', 'PDF2', 'SpecSheet', 'Stocked', 'Created', 
														'Active', 'Weight', 'Length', 'Width', 'Freight', 'ShipPrice', 'FreeGround', 'DropShipID', 
														'Related_Products', 'Image3', 'Image4', 'SwatchHeader', 'SwatchHeader3', 'SwatchHeader4'], 
								delimiter: "\t", skip_empty_lines: true, relax_column_count: true, quote: "'", skip_lines_with_error: true }))
	.on('data', (csvrow) => {
		// console.log(csvrow)
		var productData = new CsvProduct()
		productData.title = csvrow.ModelName
		productData.csvProductId = csvrow.ProductID
		productData.csvSiteId = parseInt(csvrow.SiteID)
		productData.price = parseFloat(csvrow.DemoPrice)
		productData.image1 = csvrow.Image1 ? csvrow.Image1 : ''
		productData.image2 = csvrow.Image2 ? csvrow.Image2 : ''
		productData.image3 = csvrow.Image3 ? csvrow.Image3 : ''
		productData.image4 = csvrow.Image4 ? csvrow.Image4 : ''
		productData.pdf1 = csvrow.PDF1 ? csvrow.PDF1 : ''
		productData.pdf2 = csvrow.PDF2 ? csvrow.PDF2 : ''
		var relatedProducts = csvrow.Related_Products
		if (relatedProducts && relatedProducts.length > 0) {
				productData.related_products = relatedProducts.split(',')
		} else {
				productData.related_products = []
		}
		productData.active = parseInt(csvrow.Active)
		productData.save()
	})
	
	console.log('end')
	res.render('home')
})

router.get("/createproducts", async (req, res, next) => {
	const client = await MongoClient.connect(mongoUrl)
	const mydb = client.db(dbName)
	const productCollection = mydb.collection('products')
	const subcatCollection = mydb.collection('productsubcat')
	const chartRowCollection = mydb.collection('chartrows')
	const chartColumnCollection = mydb.collection('chartcolumns')
	const chartValueCollection = mydb.collection('chartvalues')
	
	const dbProductList = await productCollection.find({SiteID: 1})
	// const dbProductList = await productCollection.find({SiteID: 1, ProductID: {$in: ['SFWB-1114', 'LOREADHDP-1S-7248', 'CBLBW-2016', 'CBMBA-1812', 'OFCORKW361-3672']}})
	const siteList = ['displays4sale', 'swingpanels', 'floorstands', 'swingframes4sale', 'snapframes4sale', 'posterdisplays4sale', 
											'outdoordisplaycases', 'shadowboxes', 'lightboxes4sale', 'letterboards4sale', 'bulletinboards4sale']
	dbProductList.forEach(async (dbProduct) => {
		// Get the title of Subcategories related with this product in this site [add subcategory names into product tag]  ## please check productsubcat collection
		var subCategories = await subcatCollection.find({ProductID: dbProduct.ProductID}).toArray()
		var siteTitleList = [ ...new Set(subCategories.map(subCat => 'store**' + siteList[subCat.SiteID - 1]))]
		// remove 'store**displays4sale' from array
		var thisSiteIndex = siteTitleList.indexOf('store**displays4sale')
		if (thisSiteIndex !== -1) siteTitleList.splice(thisSiteIndex, 1)

		// the list of siteID related with this product [add sitenames into product tag]
		var subCategoryTitleList = []
		var subCats = await subcatCollection.aggregate([
			{ $match: {
				'ProductID': dbProduct.ProductID,
				'SiteID': 1
			}},
			{ $lookup: {
					from: 'subcategories',
					localField: 'SubCatID',
					foreignField: 'SubCatID',
					as: 'subcategoryDetail'
				}
			}
		]).toArray()

		var subCategoryTitleList = subCats.map(subCat => subCat.subcategoryDetail[0].Title)
		var productTags = ''
		productTags = subCategoryTitleList.concat(siteTitleList).join(', ')

		// Getting the string of size chart
		var sizechartString = ''
		var chartRowList = await chartRowCollection.find({SiteID: 1, ProductID: dbProduct.ProductID}).toArray()
		var chartColumnList = await chartColumnCollection.find({SiteID: 1, ProductID: dbProduct.ProductID}).toArray()

		await asyncForEach1(chartColumnList, async (chartColumn) => {
			sizechartString += chartColumn.ColumnName + ','
		})
		sizechartString = sizechartString.slice(0, -1)
		sizechartString += '\n'
		await asyncForEach2(chartRowList, async (chartRow) => {
			var chartValues = await chartValueCollection.find({ChartRowID: chartRow.ChartRowID}).sort({ChartColumnID: 1}).toArray()
			var columnString = await chartValues.map(chartValue => {
					return chartValue.ChartValue
			})
			sizechartString += columnString.join(',')
			sizechartString += '\n'
		})

		sizechartString = sizechartString.slice(0, -1)

		// Getting the string of discount
		var quantityString = ''
		var dbQuantities = await quantityCollection.find({SiteID: 1, ProductID: dbProduct.ProductID}).sort({QuantityID: 1}).toArray()

		await asyncForEach3(dbQuantities, async (quantity) => {
			quantityString += 'QTY ' + quantity.QuantityFrom + '-' + quantity.QuantityTo + ','
			quantityString += quantity.PercentOff ? quantity.PercentOff + '%' : 'N/A'
			quantityString += '\n'
		})

		// Generate product data to submit into shopify store
		var product = {
			title: dbProduct.ModelName,
			body_html: dbProduct.FullDesc,
			published: dbProduct.Active,
			template_suffix: 'group',
			tags: productTags,
			images: [],
			metafields: [
				{
					key: 'warranty_returns',
					value: dbProduct.WarrantyPopup,
					value_type: 'string',
					namespace: 'overview'
				},
				{
					key: 'size_chart',
					value: sizechartString,
					value_type: 'string',
					namespace: 'sizechart'
				},
				{
					key: 'ship_desc',
					value: dbProduct.ShippingOptionContent,
					value_type: 'string',
					namespace: 'overview'
				},
				{
					key: 'subject',
					value: dbProduct.Section3Title ? dbProduct.Section3Title : '',
					value_type: 'string',
					namespace: 'specifications'
				},
				{
					key: 'contents',
					value: dbProduct.Section3Content ? dbProduct.Section3Content : '',
					value_type: 'string',
					namespace: 'specifications'
				},
				{
					key: 'option_title',
					value: dbProduct.Section2Title ? dbProduct.Section2Title : '',
					value_type: 'string',
					namespace: 'other_options'
				},
				{
					key: 'option_contents',
					value: dbProduct.Section2Content ? dbProduct.Section2Content : '',
					value_type: 'string',
					namespace: 'other_options'
				},
				{
					key: 'qty_discounts',
					value: quantityString,
					value_type: 'string',
					namespace: 'block'
				},
				{
					key: 'link1',
					value: 'https://www.displays4sale.com//ProdSheet/Default.aspx?p=' + dbProduct.URLField + '&s=1&ts=1118201938524150',
					value_type: 'string',
					namespace: 'download'
				},
				{
					key: 'name1',
					value: 'Product Sheet',
					value_type: 'string',
					namespace: 'download'
				},
				{
					key: 'type1',
					value: 'PDF',
					value_type: 'string',
					namespace: 'download'
				},
				{
					key: 'link2',
					value: 'https://www.displays4sale.com/i/is/' + dbProduct.PDF2,
					value_type: 'string',
					namespace: 'download'
				},
				{
					key: 'name2',
					value: 'Instruction Sheet',
					value_type: 'string',
					namespace: 'download'
				},
				{
					key: 'type2',
					value: 'PDF',
					value_type: 'string',
					namespace: 'download'
				}
			]
		}
		if (dbProduct.Image1 != '') {
			product.images.push({
				src: 'https://displays4sale.com/i/p1/' + dbProduct.Image1
			})
		}
		if (dbProduct.Image2 != '') {
			product.images.push({
				src: 'https://displays4sale.com/i/p2/' + dbProduct.Image2
			})
		}
		if (dbProduct.Image3 != '') {
			product.images.push({
				src: 'https://displays4sale.com/i/p3/' + dbProduct.Image3
			})
		}
		if (dbProduct.Image4 != '') {
			product.images.push({
				src: 'https://displays4sale.com/i/p4/' + dbProduct.Image4
			})
		}

		shopify.product.create(product).then(result => {
			productCollection.updateOne(
				{_id: dbProduct._id},
				{$set: {
							shopifyProductId: result.id,
							shopifyFirstVariantId: result.variants[0].id,
							shopifyFirstOptionId: result.options[0].id,
							updatedOnline: 0
					}
				}
			)
		}).catch(shopifyError => {
			var productError = new ProductError()
			productError.title = dbProduct.ModelName
			productError.dbProductId = dbProduct.ProductID
			productError.save(err => {
				if (err) {
					return next(err)
				} else {
					console.log('Could not create product with this: ', dbProduct.ProductID)
				}
			})
		})
	})
	res.render('home')
})

router.get('/createtesttable', async (req, res, next) => {
	const client = await MongoClient.connect(mongoUrl)
	const mydb = client.db(dbName)
	const productCollection = mydb.collection('products')
	const producttestCollection = mydb.collection('products-test')
	
	for (let index = 1; index < 21; index++) {
		productCollection.find({SiteID: 1})
		.skip(500 * index)
		.limit(1)
		.forEach(product => {
			producttestCollection.insertOne(product)
		})
	}
})
router.get('/updateproducts', async(req, res, next) => {
	const client = await MongoClient.connect(mongoUrl)
	const mydb = client.db(dbName)
	const productCollection = mydb.collection('products')
	const dbProductList = await productCollection.find({SiteID: 1})
	/*const dbProductList = await productCollection.find({SiteID: 1, ProductID: {$in: [
					'SBMW-SHELF12-4060', 'sstrxlmt-deep-4060', 'PEWLWF-2436', 'ssmcmat2-1824', 'TLESMAT3-1220', 'SCBBIRCH-1117',
					'DCWLCORK-3648', 'SCIBBL234-9630', 'scmirch-8511p', 'SFWBXL-2484', 'sfwm362-2030',
					'SBMW-SHELF4-1620', 'ssmcss-8511', 'DCOL2', 'LSCBBRH234-6040', 'sbwlshelf12', 'TBA-4848', 'SCIBBRH234-7230'
			]
	}})*/
	dbProductList.forEach(async (dbProduct) => {
		// Generate product data to be updated
		var product = {
			id: dbProduct.shopifyProductId,
			metafields: [
				{
					key: 'link1',
					value: value,
					value_type: 'string',
					namespace: 'download'
				}
			]
		}
		
		shopify.product.update(dbProduct.shopifyProductId, product).then(result => {
			productCollection.updateOne(
				{_id: dbProduct._id},
				{$set: {updatedOnline: 5}}
			).then(result => {
				console.log('updated: ', dbProduct.ProductID)
			})
		}).catch(shopifyError => {
			var productError = new ProductError()
			productError.title = dbProduct.ModelName
			productError.dbProductId = dbProduct.ProductID
			productError.save(err => {
				if (err) {
					return next(err)
				} else {
					console.log('Could not update product metafields with this: ', dbProduct.ProductID)
				}
			})
		})
	})

	res.render('home')
})

router.get('/getFirstProperty', async (req, res, next) => {
	const client = await MongoClient.connect(mongoUrl)
	const mydb = client.db(dbName)
	const productCollection = mydb.collection('products')
	const productAttribCatCollection = mydb.collection('productattribcat')
	const attribCatCollection = mydb.collection('attribcat')
	const productList = await productCollection.find({ SiteID: 1}, { ProductID: 1}).toArray()

	var propertyList = []

	await asyncForEach1(productList, async (productItem) => {
		await productAttribCatCollection.findOne({$query: {SiteID: 1, ProductID: productItem.ProductID}, $orderby: {_id: 1}}).then(attribCatResult => {
			attribCatCollection.findOne({AttribCatID: attribCatResult.AttribCatID}).then(result => {
				if (!propertyList.includes(result.AttrCategory)) {
					propertyList.push(result.AttrCategory)
					// console.log(result.AttrCategory)
				}
			})
		})
	})
	console.log(propertyList.join(','))
	console.log('------------------end----------------------')
	process.exit()
})

router.get('/test', async (req, res, next) => {
	const client = await MongoClient.connect(mongoUrl)
	const mydb = client.db(dbName)
	const productCollection = mydb.collection('products')
	const productAttribCatCollection = mydb.collection('productattribcat')
	// const attribCatCollection = mydb.collection('attribcat')
	
	var productCatList = await productAttribCatCollection.find({SiteID: 1, AttribCatID: '17'}).toArray()
	var productIDList = await productCatList.map(proCat => {
		return proCat.ProductID
	})

	const productList = await productCollection.find({ SiteID: 1, ProductID: {$in: productIDList}}, {ProductID: 1}).toArray()
	console.log('===================== start  ====================')
	await asyncForEach1(productList, async (pro) => {
		var proCats = await productAttribCatCollection.find({SiteID: 1, ProductID: pro.ProductID}).toArray()
		var catIDList = proCats.map(cat => {
			return cat.AttribCatID
		})
		if (catIDList[0] == 17) {
			console.log(pro.ProductID + ': ' + proCats.length + ' : ' + catIDList.join(','))
		}
	})
	
	console.log('===================== end  ====================')
	process.exit()
})

router.get('/createVariant', async (req, res, next) => {
	const client = await MongoClient.connect(mongoUrl)
	const mydb = client.db(dbName)
	const productCollection = mydb.collection('products')
	const productAttribCatCollection = mydb.collection('productattribcat')
	const productAttribCollection = mydb.collection('productattributes')
	const attribCatCollection = mydb.collection('attribcat')
	const attributesCollection = mydb.collection('attributes')
	const propertyNameString = "Display Type, Viewable Area, Overall Size, Insert Size, Poster Board Size, Interior Size, Menu Case Layout, Cork Board Frame Size, Letterboard Size, Corkboard Size, Panel Size, Helvetica Letter Sets, Graphic Insert, Dry Erase Board Size, Banner Stand, SignHolders, Display Width, Sidewalk Sign, Light Post Sign, Sign Panel , Sign Stand, Easy Tack Board Size, Cork Bar Length, Post Options , Poster Width, Clamps, Graphic Holders, Graphic Width, Fabric Graphic Size, Chalk Board Size, Reader Letter Sets, Message Panel Size, Wet Erase Board Size, Roman Letter Sets, Floor Stand, Style, Easel, Clamp Sign Stand, Counter Top Display, Marker Type, Sign Face, Letter Tracks, Additional Headers, Letter Set, Backing Board, Overall Sleeve Size, Overall Panel Size, Poster (Insert) Size, Finish, Portable Pole Sign, Marker Board Size, Header Panel, Brochure Holder, Newspaper Name, Newspaper Size, Wall Bracket, Moulding Display, Poster Size, Base Width, Tabletop Sign Stand, Pole/Base, Elliptical Stand, Banner Size, Magnetic Mount, Catalog Holders, Plastic Lenses"
	const mainPropertyNameList = propertyNameString.split(', ')
	var mainPropertyList = []
	var mainPropertyIDList = []

	await asyncForEach1(mainPropertyNameList, async (propertyName) => {
		var attribCat = await attribCatCollection.findOne({SiteID: 1, AttrCategory: propertyName})
		mainPropertyList['a' + attribCat.AttribCatID] = propertyName
		mainPropertyIDList.push(attribCat.AttribCatID)
	})
	const productList = await productCollection.find({SiteID: 1, ProductID: {$in: [
		'accbb', 'W362'
	]}})
	productList.forEach(async (product) => {
		var mainPropertyItem = await productAttribCatCollection.find({SiteID: 1, ProductID: product.ProductID, AttribCatID: {$in: mainPropertyIDList}}).toArray()
		var enabledAttributeItemList = await productAttribCollection.find({SiteID: 1, ProductID: product.ProductID}).toArray()
		var enabledAttributeList = enabledAttributeItemList.map(productAttributeItem => { return productAttributeItem.AttributeID})
		if (mainPropertyItem.length > 0) {
			var attributeItemList = []
			if (mainPropertyItem.length == 2) {
				attributeItemList = await attributesCollection.find({AttribCatID: {$in: [mainPropertyItem[0].AttribCatID, mainPropertyItem[1].AttribCatID]}, AttributeID: {$in: enabledAttributeList}}).toArray()
			} else {
				attributeItemList = await attributesCollection.find({AttribCatID: mainPropertyItem[0].AttribCatID, AttributeID: {$in: enabledAttributeList}}).toArray()
			}
	
			var variants = []
			var optionValueList = []
			await asyncForEach3(attributeItemList, async (attributeItem) => {
				variants.push({
					option1: attributeItem.Attribute,
					price: attributeItem.Price
				})
				optionValueList.push(attributeItem.Attribute)
			})
			var variantData = {
				variants: variants,
				options: [
					{
						name: mainPropertyList['a' + mainPropertyItem[0].AttribCatID],
						values: optionValueList
					}
				]
			}
			shopify.product.update(product.shopifyProductId, variantData)
			.then(result => {
				productCollection.updateOne(
					{_id: product._id},
					{$set: {updatedOnline: 6}}
				).then(result => {
					console.log('created variants: ', product.ProductID)
				})
			})
			.catch(shopifyError => {
				console.log(product.ProductID)
				console.log(attributeItemList.length)
				// console.log(variantData)
				// process.exit()
				// var productError = new ProductError()
				// productError.title = product.ModelName
				// productError.dbProductId = product.ProductID
				// productError.reason = shopifyError
				// productError.save(err => {
				//     if (err) {
				//         return next(err)
				//     } else {
				//         console.log('Could not create variants with this ID: ', product.ProductID)
				//     }
				// })
			})
		} else {
			var productError = new ProductError()
			productError.title = product.ModelName
			productError.dbProductId = product.ProductID
			productError.reason = 'no attributes'
			productError.save()
		}
	})
	res.render('home')
})

router.get('/uploadAttributes', async (req, res, next) => {
	const client = await MongoClient.connect(mongoUrl)
	const mydb = client.db(dbName)
	const productCollection = mydb.collection('products')
	const productAttribCatCollection = mydb.collection('productattribcat')
	const productAttribCollection = mydb.collection('productattributes')
	const attribCatCollection = mydb.collection('attribcat')
	const attributesCollection = mydb.collection('attributes')
	const propertyNameString = "Display Type, Viewable Area, Overall Size, Insert Size, Poster Board Size, Interior Size, Menu Case Layout, Cork Board Frame Size, Letterboard Size, Corkboard Size, Panel Size, Helvetica Letter Sets, Graphic Insert, Dry Erase Board Size, Banner Stand, SignHolders, Display Width, Sidewalk Sign, Light Post Sign, Sign Panel , Sign Stand, Easy Tack Board Size, Cork Bar Length, Post Options , Poster Width, Clamps, Graphic Holders, Graphic Width, Fabric Graphic Size, Chalk Board Size, Reader Letter Sets, Message Panel Size, Wet Erase Board Size, Roman Letter Sets, Floor Stand, Style, Easel, Clamp Sign Stand, Counter Top Display, Marker Type, Sign Face, Letter Tracks, Additional Headers, Letter Set, Backing Board, Overall Sleeve Size, Overall Panel Size, Poster (Insert) Size, Finish, Portable Pole Sign, Marker Board Size, Header Panel, Brochure Holder, Newspaper Name, Newspaper Size, Wall Bracket, Moulding Display, Poster Size, Base Width, Tabletop Sign Stand, Pole/Base, Elliptical Stand, Banner Size, Magnetic Mount, Catalog Holders, Plastic Lenses"
	const mainPropertyNameList = propertyNameString.split(', ')
	var mainPropertyList = []
	var mainPropertyIDList = []

	await asyncForEach1(mainPropertyNameList, async (propertyName) => {
		var attribCat = await attribCatCollection.findOne({SiteID: 1, AttrCategory: propertyName})
		mainPropertyList['a' + attribCat.AttribCatID] = propertyName
		mainPropertyIDList.push(attribCat.AttribCatID)
	})
	const productList = await productCollection.find({SiteID: 1})    
})

module.exports = router