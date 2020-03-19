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

let localdattributeIndex = 2
let localdrellationIndex = 2
let localgroupIndex = 2

router.get('/updateHideAttributes', async (req, res, next) => {
  res.render('home')
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const hideRelationCollection = mydb.collection('local-dattribute-relation')
  var hideRelationFindQueryText = `SELECT id, excepts FROM drellations`

  await pgClient
    .query(hideRelationFindQueryText)
    .then(async (relationFindRes) => {
      await asyncForEach(relationFindRes.rows, async (dr) => {
        if (dr.excepts != '') {
          // console.log(dr)
          const exceptIdList = dr.excepts.split(',')
          let exceptNewIdList = await hideRelationCollection.find({
            originId: {
              $in: exceptIdList
            }
          }).project({
            newId: 1
          }).toArray()
          exceptNewIdList = exceptNewIdList.map(exItem => exItem.newId)
          const uniqueIdList = exceptNewIdList.filter((elem, pos) => {
            return exceptNewIdList.indexOf(elem) == pos
          })
          var relationUpdateQueryText = `UPDATE drellations 
                                SET excepts=$1 WHERE id=$2`

          var relationUpdateValues = [uniqueIdList.join(','), dr.id]
          await pgClient.query(relationUpdateQueryText, relationUpdateValues)
          // process.exit()
        }
      })
      console.log('update relation excepts end')
    })
})

router.get("/", async (req, res, next) => {
  res.render('home')

  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const productCollection = mydb.collection('products')
  const productattributesCollection = mydb.collection('productattributes')
  const productattribcatCollection = mydb.collection('productattribcat')
  const attributesCollection = mydb.collection('attributes')
  const hideAttributeCollection = mydb.collection('hideattributes')

  const localgroupCollection = mydb.collection('local-groups')
  const localAttributeCollection = mydb.collection('local-dattributes')
  const localAttributeRelationCollection = mydb.collection('local-dattribute-relation')
  const localRelationCollection = mydb.collection('local-drellations')

  const testProductIDList = [
    'tlbs', 'sfc', 'SBMW-SHELF8-2024', 'CBOECL-5050', 'TTR855',
    'TKM514', 'SBMWIDE4-LED', 'LOREADHDH-2S-7248', 'scm-1117p',
    'lscl', 'abmc', 'sfwlbhl', 'fdg', 'sswf'
  ]

  const mainPropertyNameList = [
    'Insert Size', 'Overall Size', 'Poster Board Size', 'Viewable Area', 'Poster Size',
    'Interior Size', 'Cork Board Frame Size', 'Letterboard Size', 'Corkboard Size', 'Overall Panel Size',
    'Panel Size', 'Helvetica Letter Sets', 'Dry Erase Board Size', 'Newspaper Size', 'Graphic Insert',
    'Poster (Insert) Size', 'Sidewalk Sign', 'Light Post Sign', 'Sign Panel' , 'Sign Stand', 'Easy Tack Board Size',
    'Cork Bar Length', 'Post Options' , 'Poster Width', 'Clamps', 'Graphic Holders', 'Graphic Width', 'Banner Size',
    'Fabric Graphic Size', 'Chalk Board Size', 'Reader Letter Sets', 'Message Panel Size', 'Wet Erase Board Size',
    'Roman Letter Sets', 'Marker Board Size', 'Overall Sleeve Size', 'Clamp Sign Stand', 'Counter Top Display', 'Sign Face',
    'Letter Tracks', 'Additional Headers', 'Letter Set', 'Backing Board', 'Menu Case Layout', 'Marker Type',
    'Finish', 'Portable Pole Sign', 'Header Panel', 'Brochure Holder', 'Display Width', 'Floor Stand', 'Style', 'Easel',
    'Newspaper Name', 'Wall Bracket', 'Moulding Display', 'Base Width', 'Display Type', 'Banner Stand', 'SignHolders',
    'Tabletop Sign Stand', 'Pole/Base', 'Elliptical Stand', 'Magnetic Mount', 'Catalog Holders', 'Plastic Lenses'
  ]

  productCollection.createIndex({ ProductID: 1, SiteID: 1 })
  productattributesCollection.createIndex({ ProductID: 1, SiteID: 1})
  productattribcatCollection.createIndex({ ProductID: 1, SiteID: 1})
  attributesCollection.createIndex({ AttributeID: 1, AttribCatID: 1 })
  hideAttributeCollection.createIndex({ AttributeID: 1, ProductID: 1, SiteID: 1 })

  // get product list
  const productList = await productCollection.find({
    // ProductID: {
    //   $in: testProductIDList
    // },
    ProductID: 'LOREADHDH-2S-7248',
    SiteID: 1
  }).project({
    ProductID: 1, SiteID: 1, template_id: 1
  }).toArray()
  
  await asyncForEach(productList, async (productItem) => {
    // get all productattribute id list related each productItem
    const proAttributeList = await productattributesCollection.find({
      ProductID: productItem.ProductID,
      SiteID: 1
    }).project({
      _id: 0, AttributeID: 1
    }).toArray()
    const proAttributeIdList = proAttributeList.map(proAttr => proAttr.AttributeID)
    
    // for test
    
    // const attributesTest = await attributesCollection.find({
    //   AttributeID: {
    //     $in: proAttributeIdList
    //   },
    //   AttribCatID: '630'
    // }).toArray()
    // // console.log(attributesTest)
    // attributesTest.map(attr => {
    //   console.log('---', attr.Attribute)
    // })
    
    
    // const testAttributes = await hideAttributeCollection.aggregate([
    //   {
    //     $match: {
    //       AttributeID: '425649',
    //       ProductID: 'tlbs',
    //       SiteID: 1
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'attributes',
    //       localField: 'HideAttributeID',
    //       foreignField: 'AttributeID',
    //       as: 'HideAttrData'
    //     }
    //   },
    //   {
    //     $unwind: {
    //       path: '$HideAttrData', preserveNullAndEmptyArrays: true
    //     }
    //   }
    // ]).toArray()

    // console.log('-----------', testAttributes)
    
    
    // get the list of product attribute category (group)
    const attrCatList = await productattribcatCollection.aggregate([
      {
        $match: {
          ProductID: productItem.ProductID,
          SiteID: 1
        }
      },
      {
        $lookup: {
          from: 'attribcat',
          localField: 'AttribCatID',
          foreignField: 'AttribCatID',
          as: 'attrCatData'
        }
      },
      {
        $unwind: {
          path: '$attrCatData', preserveNullAndEmptyArrays: true
        }
      }
    ]).sort({ _id: 1 }).toArray()

    console.log('######', productItem.ProductID)
    console.log('------------', attrCatList)
    // let isFirstCat = 1
    // attrCatList.forEach(attrcat => {
    //   if (mainPropertyNameList.includes(attrcat.attrCatData.AttrCategory) && isFirstCat) {
    //     console.log(attrcat.ProductID + ' : ' + attrcat.attrCatData.AttrCategory)
    //     isFirstCat = 0
    //   }
    // })
    
    /*
    let displayOrder = 0
    await asyncForEach(attrCatList, async (attrCat) => {
      displayOrder++
      const groupId = await insertGroup(attrCat.attrCatData.AttrCategory, productItem.template_id, displayOrder)
      // const groupId = await insertLocalGroup(localgroupCollection, attrCat.attrCatData.AttrCategory, productItem.template_id, displayOrder)
      // console.log('---------------------------')
      const groupAttributeList = await attributesCollection.aggregate([
        {
          $match: {
            AttributeID: { $in: proAttributeIdList },
            AttribCatID: attrCat.AttribCatID
          }
        },
        {
          $lookup: {
            from: 'attributecodes',
            localField: 'AttributeID',
            foreignField: 'AttributeID',
            as: 'attrCodeData'
          }
        },
        {
          $unwind: {
            path: '$attrCodeData', preserveNullAndEmptyArrays: true
          }
        }
      ]).toArray()
      // console.log('---------------')
      // console.log(groupAttributeList)
      let uploadedAttributeList = []
      await asyncForEach(groupAttributeList, async (proAttr) => {
        if(!uploadedAttributeList.includes(proAttr.AttributeID)) {
          const attributeId = await insertAttribute(localAttributeRelationCollection, proAttr)
          uploadedAttributeList.push(proAttr.AttributeID)
          // const attributeId = await insertLocalAttribute(localAttributeCollection, proAttr)
          const hideAttributeList = await hideAttributeCollection.find({
            AttributeID: proAttr.AttributeID,
            ProductID: productItem.ProductID,
            SiteID: 1
          }).toArray()
          const hideAttributeIdList = hideAttributeList.map(ha => ha.HideAttributeID)
          // console.log('------------')
          // console.log(hideAttributeList)
          const tablerowOption = proAttr.attrCodeData ? proAttr.attrCodeData.AttributeCodeLine : ''
          const tablerowVendor = proAttr.attrCodeData ? proAttr.attrCodeData.MFGCodeLine : ''
          const relationId = await insertRelation(
            groupId, attributeId, hideAttributeIdList.join(','),
            tablerowOption, tablerowVendor
          )
          // const relationId = await insertLocalRelation(
          //   localRelationCollection,
          //   groupId, attributeId, hideAttributeIdList.join(','),
          //   tablerowOption, tablerowVendor
          // )
        }
      })
    })
    */

    // console.log('######', productItem.ProductID)

  })

  console.log('upload end')
  
})

async function insertGroup(groupTitle, templateId, displayOrder) {
  const d = new Date()
  var groupUploadQueryText = `INSERT INTO groups(
    label, display_order,
    created_at, updated_at,
    template_id
  ) VALUES(
    $1, $2, $3, $4, $5
  ) 
  RETURNING id`
  var groupUploadValues = [
    groupTitle, displayOrder,
    d, d,
    parseInt(templateId)
  ]

  const groupUploadResponse = await pgClient.query(groupUploadQueryText, groupUploadValues)

  return groupUploadResponse.rows[0].id
}

async function insertAttribute(attrInstance, attr) {
  var attributeId = 0

  // Check if attribute already exists, no? then, upload
  var attributeFindQueryText = `SELECT id, label FROM dattributes 
                                WHERE label=$1::text AND price=$2 
                                  AND price_type=$3 AND attribute_code=$4 AND vendor_sku=$5`

  var attributeFindValues = [
                              attr.Attribute.trim(), attr.Price, 
                              attr.PriceType, attr.AttributeCode.trim(), attr.MFGCode.trim()
                            ]
  
  await pgClient
    .query(attributeFindQueryText, attributeFindValues)
    .then(async (attributeFindRes) => {
      if (attributeFindRes.rowCount == 0) { // Upload new attribute
        // console.log('insert: ', attr.Attribute)
        var attributeUploadQueryText = `INSERT INTO dattributes(
            label, price, price_type,
            weight, width, length,
            girth, attribute_code, store_list, weight2,
            width2, length2, girth2,
            weight3, width3, length3,
            girth3, freight, min_ship_quantity,
            max_ship_quantity, ship_price_percent, vendor_sku
          ) VALUES(
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21,
            $22
          ) 
          RETURNING id`
        var attributeUploadValues = [
          attr.Attribute.trim(), attr.Price, attr.PriceType,
          attr.Weight, attr.Width, attr.Length,
          attr.Girth, attr.AttributeCode.trim(), 'displays4sale.myshopify.com', attr.Weight2,
          attr.Width2, attr.Length2, attr.Girth2,
          attr.Weight3, attr.Width3, attr.Length3,
          attr.Girth3, attr.Freight, attr.MinQuantityShip,
          attr.MaxQuantityShip, attr.ShipPricePercent, attr.MFGCode.trim()
        ]

        await pgClient
          .query(attributeUploadQueryText, attributeUploadValues)
          .then(attributeUploadRes => {
            attributeId = attributeUploadRes.rows[0].id
            console.log('++++++ attribute id: ', attributeUploadRes.rows[0].id)
          })
      } else { // This attribute already exists
        attributeId = attributeFindRes.rows[0].id
        console.log('----attribute id: ', attributeId)
      }
      await attrInstance.insertOne({
        originId: attr.AttributeID,
        newId: attributeId
      })
    })

  return attributeId
}

async function insertRelation(groupId, attributeId, excepts, tablerowOption, tablerowVendor) {
  var relationUploadQueryText = `INSERT INTO drellations(
    group_id, dattribute_id, excepts, table_row_option, table_row_vendor
  ) VALUES(
    $1, $2, $3, $4, $5
  ) 
  RETURNING id`
  var relationUploadValues = [
    groupId, attributeId, excepts, tablerowOption, tablerowVendor
  ]

  const relationUploadResponse = await pgClient.query(relationUploadQueryText, relationUploadValues)

  return relationUploadResponse.rows[0].id
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// For local

async function insertLocalGroup(collectionInstance, groupTitle, templateId, displayOrder) {
  const d = new Date()
  await collectionInstance.insertOne({
    local_group_id: localgroupIndex,
    label: groupTitle,
    display_order: displayOrder,
    created_at: d,
    updated_at: d,
    template_id: parseInt(templateId)
  })
  localgroupIndex ++
  return (localgroupIndex - 1)
}

async function insertLocalAttribute(collectionInstance, attr) {
  var attributeId = 0

  // Check if attribute already exists, no? then, upload
  const attributeFind = await collectionInstance.find({
    label: attr.Attribute.trim(),
    price: attr.Price,
    price_type: attr.PriceType,
    attribute_code: attr.AttributeCode.trim(),
    vendor_sku: attr.MFGCode.trim()
  }).toArray()
  
  if (attributeFind.length == 0) { // Upload new attribute
    await collectionInstance.insertOne({
      local_attribute_id: localdattributeIndex,
      label: attr.Attribute.trim(),
      price: attr.Price,
      price_type: attr.PriceType,
      weight: attr.Weight,
      width: attr.Width,
      length: attr.Length,
      girth: attr.Girth,
      attribute_code: attr.AttributeCode.trim(),
      store_list: 'displays4sale.myshopify.com',
      weight2: attr.Weight2,
      width2: attr.Width2,
      length2: attr.Length2,
      girth2: attr.Girth2,
      weight3: attr.Weight3,
      width3: attr.Width3,
      length3: attr.Length3,
      girth3: attr.Girth3,
      freight: attr.Freight,
      min_ship_quantity: attr.MinQuantityShip,
      max_ship_quantity: attr.MaxQuantityShip,
      ship_price_percent: attr.ShipPricePercent,
      vendor_sku: attr.MFGCode.trim()
    })
    attributeId = localdattributeIndex
    localdattributeIndex ++
    // console.log('++++++ attribute: ', attributeId)
  } else { // This attribute already exists
    attributeId = attributeFind[0].local_attribute_id
    // console.log('----attribute id: ', attributeId)
  }
  return attributeId
}

async function insertLocalRelation(collectionInstance, groupId, attributeId, excepts, tablerowOption, tablerowVendor) {
  await collectionInstance.insertOne({
    local_relation_id: localdrellationIndex,
    group_id: groupId,
    dattribute_id: attributeId,
    excepts: excepts,
    table_row_option: tablerowOption,
    table_row_vendor: tablerowVendor
  })
  localdrellationIndex ++
  return (localdrellationIndex - 1)
}


module.exports = router