import express from "express"
import ProductError from "../schema/ProductError"
import { MongoClient } from 'mongodb'
const { Client } = require('pg')
require('dotenv').config()
const pgClient = new Client({
  connectionString: process.env.postgresUrl
})
try {
  pgClient.connect()
} catch (error) {
  console.log(error)
}

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

router.get("/templates", async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const productCollection = mydb.collection('products')
  const templateErrorCollection = mydb.collection('error-template')
  await productCollection.createIndex({ ProductID: 1, SiteID: 1 })

  const productIdList = [
		'tlbs', 
		'sfc', 
		'SBMW-SHELF8-2024', 
		'scm-1117p', 'lscl', 'CBOECL-5050', 
		'TTR855', 'abmc', 'TKM514', 
		'SBMWIDE4-LED', 'LOREADHDH-2S-7248', 
		'sfwlbhl', 'fdg', 'sswf'
  ]
  
  const products = await productCollection.find(
    { 
      ProductID: { $in: productIdList } , 
      SiteID: 1 
    }, 
    { 
      Image1: 1, 
      ModelName: 1, 
      shopifyProductId: 1 
    }
  )
  
  products.forEach(product => {
    // shopify.product.get(product.shopifyProductId).then(productResult => {
    try {
      var d = new Date()
      
      var thumbnail = 'https://displays4sale.com/i/p1/' + product.Image1
      var templateQueryText = 'INSERT INTO templates(label, shopify_product_id, thumbnail, created_at, updated_at, shop_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *'
      var templateValues = [product.ModelName, product.shopifyProductId, thumbnail, d, d, 1]

      pgClient
        .query(templateQueryText, templateValues)
        .then(res => {
          var templateId = res.rows[0].id

          productCollection.updateOne(
            {_id: product._id},
            {$set: {
                template_id: templateId,
                updatedOnline: 1
              }
            }
          )
        })
        .catch(error => {
          console.log('postgres error: ', error)
        })
      } catch (pgErr) {
        templateErrorCollection.insertOne({
          'title': product.ModelName,
          'dbProductId': product.ProductID,
          'reason': 'could not upload template info into online db'
        }).then(() => {
          console.log('error generated in: ', product.ProductID)
        }).catch(() => {
          console.log('error, but, could not insert this into db')
        })
      }
  })
  
  res.render('home')
})


router.get("/attributes", async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const productCollection = mydb.collection('products')
  const productAttribCatCollection = mydb.collection('productattribcat')
  const productAttribCollection = mydb.collection('productattributes')
  const attribCatCollection = mydb.collection('attribcat')
  const attributesCollection = mydb.collection('attributes')

  const mainPropertyNameString = "Display Type, Viewable Area, Overall Size, Insert Size, Poster Board Size, Interior Size, Menu Case Layout, Cork Board Frame Size, Letterboard Size, Corkboard Size, Panel Size, Helvetica Letter Sets, Graphic Insert, Dry Erase Board Size, Banner Stand, SignHolders, Display Width, Sidewalk Sign, Light Post Sign, Sign Panel , Sign Stand, Easy Tack Board Size, Cork Bar Length, Post Options , Poster Width, Clamps, Graphic Holders, Graphic Width, Fabric Graphic Size, Chalk Board Size, Reader Letter Sets, Message Panel Size, Wet Erase Board Size, Roman Letter Sets, Floor Stand, Style, Easel, Clamp Sign Stand, Counter Top Display, Marker Type, Sign Face, Letter Tracks, Additional Headers, Letter Set, Backing Board, Overall Sleeve Size, Overall Panel Size, Poster (Insert) Size, Finish, Portable Pole Sign, Marker Board Size, Header Panel, Brochure Holder, Newspaper Name, Newspaper Size, Wall Bracket, Moulding Display, Poster Size, Base Width, Tabletop Sign Stand, Pole/Base, Elliptical Stand, Banner Size, Magnetic Mount, Catalog Holders, Plastic Lenses"
  const mainPropertyNameList = mainPropertyNameString.split(', ')
  
  var mainAttribCats = await attribCatCollection.find({SiteID: 1, AttrCategory: {$in: mainPropertyNameList}}).toArray()
  var mainPropertyIDList = mainAttribCats.map(mainAttribCat => {
    return mainAttribCat.AttribCatID
  })

  var attribCats = await attribCatCollection.find({SiteID: 1}).toArray()
  var attribCatList = []
  attribCats.forEach(attribCat => {
    attribCatList['qqqwww' + attribCat.AttribCatID] = attribCat.AttrCategory
  })
  var productCount = 1
  var productList = await productCollection.find({SiteID: 1}, {_id: 1, ProductID: 1, template_id: 1, updatedOnline: 1}).toArray()
  await asyncForEach(productList, async (product) => {
    console.log('processed: ', productCount, product.ProductID)
    productCount++
    var productAttribCats = await productAttribCatCollection.find({SiteID: 1, ProductID: product.ProductID, AttribCatID: {$in: mainPropertyIDList}}, {AttribCatID: 1}).toArray()
    var mainPropertyId = 1
    for(var i=0; i<productAttribCats.length; i++) {
      if (mainPropertyIDList.includes(productAttribCats[i].AttribCatID)) {
        mainPropertyId = productAttribCats[i].AttribCatID
        break
      }
    }
    
    productAttribCats = await productAttribCatCollection.find({SiteID: 1, ProductID: product.ProductID, AttribCatID: {$ne: mainPropertyId}}, {AttribCatID: 1}).toArray()
    productCollection.updateOne(
      {_id: product._id},
      {$set: {
                updatedOnline: 10
              }
      }
    )
    var displayOrder = 0
    await asyncForEach1(productAttribCats, async (productAttribCat) => {
      var enabledAttributeItemList = await productAttribCollection.find({SiteID: 1, ProductID: product.ProductID}, {AttributeID: 1}).toArray()
      var enabledAttributeList = enabledAttributeItemList.map(productAttributeItem => { return productAttributeItem.AttributeID})
      var attributeItemList = await attributesCollection.find({AttribCatID: productAttribCat.AttribCatID, AttributeID: {$in: enabledAttributeList}}, {
        Attribute: 1, Price: 1, Weight: 1, Length: 1,
        Width: 1, Girth: 1, PriceType: 1
      }).toArray()
      var attribCatName = attribCatList['qqqwww' + productAttribCat.AttribCatID]
      if (attribCatName) {
        displayOrder++
        var d = new Date()
        var groupQueryText = 'INSERT INTO groups(label, display_order, created_at, updated_at, template_id) VALUES($1, $2, $3, $4, $5) RETURNING id'
        var groupValues = [attribCatName, displayOrder, d, d, parseInt(product.template_id)]
        
        await pgClient
          .query(groupQueryText, groupValues)
          .then(async (groupRes) => {
            var groupId = groupRes.rows[0].id
            await asyncForEach2(attributeItemList, async (attributeItem) => {
              var attributeFindQueryText = 'SELECT id FROM attributes WHERE label=$1::text AND price=$2 AND price_type=$3'
              var attributeFindValues = [attributeItem.Attribute, attributeItem.Price, attributeItem.PriceType]
              await pgClient
                .query(attributeFindQueryText, attributeFindValues)
                .then(async (attributeFindRes) => {
                  if (attributeFindRes.rowCount == 0) {
                    var attributeUploadQueryText = "INSERT INTO attributes(label, price, price_type, group_id, weight, width, length, girth) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id"
                    var attributeUploadValues = [attributeItem.Attribute, attributeItem.Price, attributeItem.PriceType, groupId, attributeItem.Weight, attributeItem.Width, attributeItem.Length, attributeItem.Girth]
                    await pgClient
                      .query(attributeUploadQueryText, attributeUploadValues)
                      .then(async (attributeUploadRes) => {
                        var attributeId = attributeUploadRes.rows[0].id
                        var attributeRelationQueryText = "INSERT INTO group_attributes(group_id, attribute_id) VALUES($1, $2) RETURNING id"
                        var attributeRelationValues = [groupId, attributeId]
                        await pgClient
                          .query(attributeRelationQueryText, attributeRelationValues)
                          .then(attributeRelationRes => {
                            console.log('re: ', attributeRelationRes.rows[0].id)
                          })
                      })
                  } else {
                    var attributeId = attributeFindRes.rows[0].id
                    var attributeRelationQueryText = "INSERT INTO group_attributes(group_id, attribute_id) VALUES($1, $2) RETURNING *"
                    var attributeRelationValues = [groupId, attributeId]
                    await pgClient
                      .query(attributeRelationQueryText, attributeRelationValues)
                      .then(attributeRelationRes => {
                        console.log('relation: ', attributeRelationRes.rows[0].id)
                      })
                  }
                })
                .catch(attributeErr => {
                  console.log(attributeErr)
                  process.exit()
                })
            })
          })
        }
      })    
  })
  
  res.render('home')
})
router.get('/attributeUpload', async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const productCollection = mydb.collection('products')
  const productAttribCatCollection = mydb.collection('productattribcat')
  const productAttribCollection = mydb.collection('productattributes')
  const attribCatCollection = mydb.collection('attribcat')
  const attributesCollection = mydb.collection('attributes')

// for local start
  const localattributesCollection = mydb.collection('localattributes')
  const localgroupsCollection = mydb.collection('localgroups')
  const localgroupattributesCollection = mydb.collection('localgroupattributes')
// for local end

  var attribCats = await attribCatCollection.find({SiteID: 1}).toArray()
  var attribCatList = []
  attribCats.forEach(attribCat => {
    attribCatList['qqqwww' + attribCat.AttribCatID] = attribCat.AttrCategory
  })
  var counter = 0
  var groupId = 1
  var attributeId = 1
  var groupAttributeId = 1
  
  var productList = await productCollection.find({SiteID: 1}, {projection: {_id: 1, ProductID: 1, template_id: 1, productAttributeCategories: 1, updatedOnline: 1}}).toArray()
  await asyncForEach(productList, async (product) => {
    counter ++
    console.log(counter)
    productCollection.updateOne(
      {_id: product._id},
      {$set: {
                updatedOnline: 11
              }
      }
    )
    var productAttribCats = product.productAttributeCategories
    var enabledAttributeItemList = await productAttribCollection.find({SiteID: 1, ProductID: product.ProductID}, {AttributeID: 1}).toArray()
    var enabledAttributeList = enabledAttributeItemList.map(productAttributeItem => { return productAttributeItem.AttributeID})
    var displayOrder = 0
    await asyncForEach1(productAttribCats, async (productAttribCat) => {
      var attributeItemList = await attributesCollection.find({AttribCatID: productAttribCat.AttribCatID, AttributeID: {$in: enabledAttributeList}}, {projection: {
        Attribute: 1, Price: 1, Weight: 1, Length: 1,
        Width: 1, Girth: 1, PriceType: 1, AttributeCode: 1
      }}).toArray()
      var attribCatName = attribCatList['qqqwww' + productAttribCat.AttribCatID]
      if (attribCatName) {
        displayOrder++
        var d = new Date()
        var groupRes = await localgroupsCollection.insertOne({
          local_id: groupId,
          label: attribCatName,
          display_order: displayOrder,
          created_at: d,
          updated_at: d,
          template_id: parseInt(product.template_id)
        })
        groupId++
        await asyncForEach2(attributeItemList, async (attributeItem) => {
          var attributeList = await localattributesCollection.find({
            label: attributeItem.Attribute,
            price: attributeItem.Price,
            price_type: attributeItem.PriceType
          }).toArray()
          if (attributeList.length == 0) {
            await localattributesCollection.insertOne({
              local_id: attributeId,
              label: attributeItem.Attribute,
              price_type: attributeItem.PriceType,
              price: attributeItem.Price,
              weight: attributeItem.Weight,
              width: attributeItem.Width,
              length: attributeItem.Length,
              girth: attributeItem.Girth,
              attribute_code: attributeItem.AttributeCode
            })
            await localgroupattributesCollection.insertOne({
              local_id: groupAttributeId,
              group_id: groupRes.ops[0].local_id,
              attribute_id: attributeId,
              template_id: parseInt(product.template_id)
            })
            attributeId++
            groupAttributeId++
          } else {
            await localgroupattributesCollection.insertOne({
              local_id: groupAttributeId,
              group_id: groupRes.ops[0].local_id,
              attribute_id: parseInt(attributeList[0].local_id),
              template_id: parseInt(product.template_id)
            })
            groupAttributeId++
          }
        })
      }
    })
  })
})
router.get("/localattributes", async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const productCollection = mydb.collection('products')
  const productAttribCatCollection = mydb.collection('productattribcat')
  const productAttribCollection = mydb.collection('productattributes')
  const attribCatCollection = mydb.collection('attribcat')
  const attributesCollection = mydb.collection('attributes')

// for local start
  const localattributesCollection = mydb.collection('localattributes')
  const localgroupsCollection = mydb.collection('localgroups')
  const localgroupattributesCollection = mydb.collection('localgroupattributes')
// for local end

  const mainPropertyNameString = "Display Type, Viewable Area, Overall Size, Insert Size, Poster Board Size, Interior Size, Menu Case Layout, Cork Board Frame Size, Letterboard Size, Corkboard Size, Panel Size, Helvetica Letter Sets, Graphic Insert, Dry Erase Board Size, Banner Stand, SignHolders, Display Width, Sidewalk Sign, Light Post Sign, Sign Panel , Sign Stand, Easy Tack Board Size, Cork Bar Length, Post Options , Poster Width, Clamps, Graphic Holders, Graphic Width, Fabric Graphic Size, Chalk Board Size, Reader Letter Sets, Message Panel Size, Wet Erase Board Size, Roman Letter Sets, Floor Stand, Style, Easel, Clamp Sign Stand, Counter Top Display, Marker Type, Sign Face, Letter Tracks, Additional Headers, Letter Set, Backing Board, Overall Sleeve Size, Overall Panel Size, Poster (Insert) Size, Finish, Portable Pole Sign, Marker Board Size, Header Panel, Brochure Holder, Newspaper Name, Newspaper Size, Wall Bracket, Moulding Display, Poster Size, Base Width, Tabletop Sign Stand, Pole/Base, Elliptical Stand, Banner Size, Magnetic Mount, Catalog Holders, Plastic Lenses"
  const mainPropertyNameList = mainPropertyNameString.split(', ')
  
  var mainAttribCats = await attribCatCollection.find({SiteID: 1, AttrCategory: {$in: mainPropertyNameList}}).toArray()
  var mainPropertyIDList = mainAttribCats.map(mainAttribCat => {
    return mainAttribCat.AttribCatID
  })

  var attribCats = await attribCatCollection.find({SiteID: 1}).toArray()
  var attribCatList = []
  attribCats.forEach(attribCat => {
    attribCatList['qqqwww' + attribCat.AttribCatID] = attribCat.AttrCategory
  })
  var productCount = 1
  var groupId = 1
  var attributeId = 1
  var groupAttributeId = 1
  var productList = await productCollection.find({SiteID: 1}, {projection: {_id: 1, ProductID: 1, template_id: 1, updatedOnline: 1}}).toArray()
  await asyncForEach(productList, async (product) => {
    console.log('processed: ', productCount, product.ProductID)
    productCount++
    var productAttribCats = await productAttribCatCollection.find({SiteID: 1, ProductID: product.ProductID, AttribCatID: {$in: mainPropertyIDList}}, {projection: {AttribCatID: 1}}).toArray()
    var mainPropertyId = 1
    for(var i=0; i<productAttribCats.length; i++) {
      if (mainPropertyIDList.includes(productAttribCats[i].AttribCatID)) {
        mainPropertyId = productAttribCats[i].AttribCatID
        break
      }
    }
    
    productAttribCats = await productAttribCatCollection.find({SiteID: 1, ProductID: product.ProductID, AttribCatID: {$ne: mainPropertyId}}, {projection: {AttribCatID: 1}}).toArray()
    productCollection.updateOne(
      {_id: product._id},
      {$set: {
                updatedOnline: 10,
                productAttributeCategories: productAttribCats
              }
      }
    )
    /*var displayOrder = 0
    await asyncForEach1(productAttribCats, async (productAttribCat) => {
      var enabledAttributeItemList = await productAttribCollection.find({SiteID: 1, ProductID: product.ProductID}, {AttributeID: 1}).toArray()
      var enabledAttributeList = enabledAttributeItemList.map(productAttributeItem => { return productAttributeItem.AttributeID})
      var attributeItemList = await attributesCollection.find({AttribCatID: productAttribCat.AttribCatID, AttributeID: {$in: enabledAttributeList}}, {projection: {
        Attribute: 1, Price: 1, Weight: 1, Length: 1,
        Width: 1, Girth: 1, PriceType: 1, AttributeCode: 1
      }}).toArray()
      var attribCatName = attribCatList['qqqwww' + productAttribCat.AttribCatID]
      if (attribCatName) {
        displayOrder++
        var d = new Date()
        var groupRes = await localgroupsCollection.insertOne({
          local_id: groupId,
          label: attribCatName,
          display_order: displayOrder,
          created_at: d,
          updated_at: d,
          template_id: parseInt(product.template_id)
        })
        groupId++
        await asyncForEach2(attributeItemList, async (attributeItem) => {
          var attributeList = await localattributesCollection.find({
            label: attributeItem.Attribute,
            price: attributeItem.Price,
            price_type: attributeItem.PriceType
          }).toArray()
          if (attributeList.length == 0) {
            await localattributesCollection.insertOne({
              local_id: attributeId,
              label: attributeItem.Attribute,
              price_type: attributeItem.PriceType,
              price: attributeItem.Price,
              group_id: groupRes.ops[0].local_id,
              weight: attributeItem.Weight,
              width: attributeItem.Width,
              length: attributeItem.Length,
              girth: attributeItem.Girth,
              attribute_code: attributeItem.AttributeCode
            })
            await localgroupattributesCollection.insertOne({
              local_id: groupAttributeId,
              group_id: groupRes.ops[0].local_id,
              attribute_id: attributeId,
              template_id: parseInt(product.template_id)
            })
            attributeId++
            groupAttributeId++
          } else {
            await localgroupattributesCollection.insertOne({
              local_id: groupAttributeId,
              group_id: groupRes.ops[0].local_id,
              attribute_id: attributeId,
              template_id: parseInt(product.template_id)
            })
            groupAttributeId++
          }
        })
      }
    })
    */
  })
  
  res.render('home')
})

router.get('/templatetest', async (req, res, next) => {
  var templateFindQueryText = 'SELECT * FROM templates WHERE shopify_product_id=$1'
  var templateFindValues = [4344938627161]
  pgClient
    .query(templateFindQueryText, templateFindValues)
    .then(templateFindRes => {
      console.log('template result: ', templateFindRes)
    })
    .catch(templateErr => {
      console.log('template error: ', templateErr)
    })
})

router.get('/attributeTest', async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const attributeCollection = mydb.collection('attributes')
  const attributeTestCollection = mydb.collection('attributes-test')

  var attributes = await attributeCollection.aggregate([
    {
      "$group": {
        "_id": {
          Attribute: "$Attribute",
          Price: "$Price",
          PriceType: "$PriceType",
          Weight: "$Weight",
          Length: "$Length",
          Width: "$Width",
          Girth: "$Girth"
        }
      }
    }
  ]).toArray()
  // console.log(attributes.length)
  await asyncForEach(attributes, async (row) => {
    var attribute = row._id
    await attributeTestCollection.insertOne({
      Attribute: attribute.Attribute,
      Price: attribute.Price,
      PriceType: attribute.PriceType,
      Weight: attribute.Weight,
      Length: attribute.Length,
      Width: attribute.Width,
      Girth: attribute.Girth
    })
  })

  process.exit()
})

router.get('/productreset', async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const productCollection = mydb.collection('products')

  const productList = productCollection.find({SiteID: 1})
  productList.forEach(product => {
    productCollection.updateOne(
      {_id: product._id},
      {$set: {
                updatedOnline: 0
              }
      }
    ).then(res => {
      console.log(product._id)
    })
  })
  res.render('home')
})

router.get('/groupchunk', async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const groupCollection = mydb.collection('localgroups')
  var pgformat = require('pg-format')

  for(var groupSkip = 0; groupSkip < 36; groupSkip += 5) {
    var groupChunk = await groupCollection.find({}).skip(groupSkip).limit(5).toArray()
    var groupValues = []
    groupChunk.forEach(group => {
      groupValues.push([group.local_id, group.label, group.display_order, group.created_at, group.updated_at, group.template_id])
    })
    var groupDataUploadQuery = pgformat('INSERT INTO groups (id, label, display_order, created_at, updated_at, template_id) VALUES %L', groupValues)
    pgClient
      .query(groupDataUploadQuery)
      .then(res => {
        console.log('uploaded: ', res)
      })
  }
  res.render('home')
})

router.get('/attributechunk', async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const attributeCollection = mydb.collection('localattributes')
  var pgformat = require('pg-format')

  for(var attributeSkip = 0; attributeSkip < 115; attributeSkip += 5) {
    var attributeChunk = await attributeCollection.find({}).skip(attributeSkip).limit(5).toArray()
    var attributeValues = []
    attributeChunk.forEach(attribute => {
      attributeValues.push([attribute.local_id, attribute.label, attribute.price, attribute.price_type, attribute.weight, attribute.length, attribute.width, attribute.girth, attribute.attribute_code])
    })
    var attributeDataUploadQuery = pgformat('INSERT INTO dattributes (id, label, price, price_type, weight, length, width, girth, attribute_code) VALUES %L', attributeValues)
    pgClient
      .query(attributeDataUploadQuery)
      .then(res => {
        console.log('uploaded: ', res)
      })
  }
  res.render('home')
})

router.get('/groupattributechunk', async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const groupattributeCollection = mydb.collection('localgroupattributes')
  var pgformat = require('pg-format')

  for(var groupattributeSkip = 0; groupattributeSkip < 170; groupattributeSkip += 5) {
    var groupattributeChunk = await groupattributeCollection.find({$query: {}, $orderby: {local_id: 1}}).skip(groupattributeSkip).limit(5).toArray()
    var groupattributeValues = []
    groupattributeChunk.forEach(groupattribute => {
      groupattributeValues.push([groupattribute.local_id, groupattribute.group_id, groupattribute.attribute_id])
    })
    var groupattributeDataUploadQuery = pgformat('INSERT INTO drellations (id, group_id, dattribute_id) VALUES %L', groupattributeValues)
    pgClient
      .query(groupattributeDataUploadQuery)
      .then(res => {
        console.log('uploaded: ', res)
      })
  }
  res.render('home')
})

router.get('/testresult', (req, res, next) => {
  shopify.product.get(4344878137433).then(productResult => {
    console.log('product result from shopify store: ', productResult.image.src)
    res.render('home')
  });
});

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
async function asyncForEach1(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
async function asyncForEach2(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

module.exports = router