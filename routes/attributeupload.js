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

router.get("/", async (req, res, next) => {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const productattributesCollection = mydb.collection('productattributes')
  const attributesCollection = mydb.collection('attributes')
  const attributeCodeCollection = mydb.collection('attributecodes')

  const productAttributes = await productattributesCollection.find({
    SiteID: 1, 
    ProductID: {
      $in: [
        'tlbs', 'sfc', 'SBMW-SHELF8-2024', 'CBOECL-5050', 'TTR855', 
        'TKM514', 'SBMWIDE4-LED', 'LOREADHDH-2S-7248', 'scm-1117p',
        'lscl', 'abmc', 'sfwlbhl', 'fdg', 'sswf'
      ]
    }
  }).toArray()

  asyncForEach(productAttributes, async (proAttr) => {
    // Get Attribute
    var attr = await attributesCollection.find({
      AttributeID: proAttr.AttributeID
    }).toArray()
    attr = attr[0]
    // Check if attribute already exists, no? then, upload
    var attributeFindQueryText = `SELECT id FROM dattributes 
                                  WHERE label=$1::text AND price=$2 
                                    AND price_type=$3 AND attribute_code=$4 AND vendor_sku=$5`

    var attributeFindValues = [
                                attr.Attribute, attr.Price, 
                                attr.PriceType, attr.AttributeCode, attr.MFGCode
                              ]
    
    await pgClient
      .query(attributeFindQueryText, attributeFindValues)
      .then(async (attributeFindRes) => {
        if (attributeFindRes.rowCount == 0) { // Upload new attribute
          // console.log('insert: ', attr.Attribute)
          var attributeUploadQueryText = `INSERT INTO dattributes(
              label, price, price_type, 
              weight, width, length,
              girth, attribute_code, weight2, 
              width2, length2, girth2, 
              weight3, width3, length3,
              girth3, freight, min_ship_quantity,
              max_ship_quantity, ship_price_percent, vendor_sku
            ) VALUES(
              $1, $2, $3, $4, $5, $6, 
              $7, $8, $9, $10, $11, $12, 
              $13, $14, $15, $16, $17, $18, $19, $20, $21
            ) 
            RETURNING id`
          var attributeUploadValues = [
            attr.Attribute, attr.Price, attr.PriceType,
            attr.Weight, attr.Width, attr.Length,
            attr.Girth, attr.AttributeCode, attr.Weight2,
            attr.Width2, attr.Length2, attr.Girth2,
            attr.Weight3, attr.Width3, attr.Length3,
            attr.Girth3, attr.Freight, attr.MinQuantityShip,
            attr.MaxQuantityShip, attr.ShipPricePercent, attr.MFGCode
          ]

          await pgClient
            .query(attributeUploadQueryText, attributeUploadValues)
            .then(attributeUploadRes => {
              console.log('inserted: ', attr.Attribute)
            })
        } else { // This attribute already exists
          console.log('hahaha: ', attr.Attribute)
        }
      })
  })
  
  
  res.render('home')
})

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

module.exports = router