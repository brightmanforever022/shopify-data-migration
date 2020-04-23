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

const vendorList = [
  { name: 'United MFRS. Supplies, Inc.', zipcode: '11520'}, { name: 'TENSATOR', zipcode: '11706'},
  { name: 'CAB-network', zipcode: '11520'}, { name: 'United Visual Products, Inc.', zipcode: '53207'},
  { name: 'Don Mar Frame & Moulding', zipcode: '11520'}, { name: 'Studio Moulding Inc.', zipcode: '11520'},
  { name: 'Delta Lock Company', zipcode: '11520'}, { name: 'MDI Worldwide', zipcode: '48331'},
  { name: 'Pinquist Tool & Die Co., Inc.', zipcode: '13440'}, { name: 'Stylmark', zipcode: '55432'},
  { name: 'Alpina Manufacturing, LLC', zipcode: '11520'}, { name: 'Alpina Manufacturing, LLC', zipcode: '11520'},
  { name: 'Jack Sayers Products Ltd', zipcode: '11520'}, { name: 'J & J Display', zipcode: '19973'},
  { name: 'The Miller Group', zipcode: '63026'}, { name: 'Presentation Systems', zipcode: '94801'},
  { name: 'Carmanah Signs', zipcode: '98230'}, { name: 'DSA/Phototech, Inc.', zipcode: '90746'},
  { name: 'Mark Bric Display Corp.', zipcode: '23875'}, { name: 'Decor Moulding & Supply', zipcode: '11520'},
  { name: 'SwingFrame Manufacturing', zipcode: '11520'}, { name: 'True Textiles', zipcode: '11520'},
  { name: 'WL Concept', zipcode: '11520'}, { name: 'Nielsen & Bainbridge', zipcode: '11520'},
  { name: "Itt's Industrial", zipcode: '11520'}, { name: 'Alto Mfg. Co., Inc.', zipcode: '60657'},
  { name: 'Orbus Company', zipcode: '60440'}, { name: 'M.F. Blouin Merchandising', zipcode: '03869'},
  { name: 'Global Glass Corp.', zipcode: '11801'}, { name: 'Marino Custom Display Co.', zipcode: '01983'},
  { name: 'VKF Renzel USA Corp', zipcode: '60007'}, { name: 'Fiber Char Corp.', zipcode: '11520'},
  { name: 'Testrite Instrument Co., Inc.', zipcode: '07601'}, { name: 'Visiontron Corp', zipcode: '11788'},
  { name: 'Display Fixture Warehouse', zipcode: '30336'}, { name: 'HMC Display', zipcode: '93637'},
  { name: 'Joseph Struhl Company, Inc.', zipcode: '11040'}, { name: 'Hollywood Banners', zipcode: '11726'},
  { name: 'CUSTOM PRODUCT', zipcode: '11520'}, { name: 'MT Displays LLC', zipcode: '18706'},
  { name: 'Glaro Incorporated', zipcode: '11788'}, { name: 'Accessories', zipcode: '11520'},
  { name: 'Kirby Built Products', zipcode: '53151'}, { name: 'Forbes Industries', zipcode: '91761'},
  { name: 'Windigo Signs', zipcode: '85281'}, { name: 'Britten', zipcode: '49685'},
  { name: 'Displays 2 Go', zipcode: '02809'}, { name: 'Ghent', zipcode: '45036'},
  { name: 'Marvolus Manufacturing', zipcode: '60612'}, { name: 'Queue Solutions', zipcode: '11716'},
  { name: 'SignTech Co., Ltd', zipcode: '11520'}, { name: 'South Beach Media, Inc.', zipcode: '92708'},
]
const mongoUrl = 'mongodb://localhost:27017'
const dbName = 'display4sale'

const router = express.Router()

let localdattributeIndex = 2
let localdrellationIndex = 2
let localgroupIndex = 2

router.get("/", async (req, res, next) => {
  res.render('home')

  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const productCollection = mydb.collection('products')
  const productattributesCollection = mydb.collection('productattributes')
  const attribcatCollection = mydb.collection('attribcat')
  const attributesCollection = mydb.collection('attributes')
  const attributecodesCollection = mydb.collection('attributecodes')
  const mastercodesCollection = mydb.collection('mastercodes')
  const vendorsCollection = mydb.collection('vendors')
  const hideAttributeCollection = mydb.collection('hideattributes')

  productCollection.createIndex({ ProductID: 1, SiteID: 1 })
  productattributesCollection.createIndex({ ProductID: 1, SiteID: 1})
  attribcatCollection.createIndex({AttribCatID: 1, SiteID: 1})
  attributesCollection.createIndex({ AttributeID: 1, AttribCatID: 1 })
  attributecodesCollection.createIndex({ AttributeID: 1 })
  mastercodesCollection.createIndex({ CodeID: 1 })
  vendorsCollection.createIndex({ VendorID: 1 })
  hideAttributeCollection.createIndex({ AttributeID: 1, ProductID: 1, SiteID: 1 })
  
  const localgroupCollection = mydb.collection('local-groups')
  const localAttributeCollection = mydb.collection('local-dattributes')
  const localAttributeRelationCollection = mydb.collection('local-dattribute-relation')
  const localRelationCollection = mydb.collection('local-drellations')


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

  const testProductIDList = [
    'tlbs', 'sfc', 'SBMW-SHELF8-2024', 'CBOECL-5050', 'TTR855',
    'TKM514', 'SBMWIDE4-LED', 'LOREADHDH-2S-7248', 'scm-1117p',
    'lscl', 'abmc', 'sfwlbhl', 'fdg', 'sswf'
  ]

  // get product list
  const productList = await productCollection.find({
    ProductID: {
      $in: testProductIDList
    },
    // ProductID: 'sswf',
    SiteID: 1
  }).project({
    ProductID: 1, SiteID: 1, template_id: 1
  }).toArray()
  
  await asyncForEach(productList, async (productItem) => {
    // get all attribute id list related each productItem
    const proAttributeList = await productattributesCollection.find({
      ProductID: productItem.ProductID,
      SiteID: 1
    }).project({
      _id: 0, AttributeID: 1
    }).sort({'ProductAttributeID': 1}).toArray()
    const proAttributeIdList = proAttributeList.map(proAttr => proAttr.AttributeID)

    // get all attributes with the list of all attribute id
    let attributes = await attributesCollection.find({
      AttributeID: {
        $in: proAttributeIdList
      }
    }).toArray()

    attributes = attributes.reduce((acc, attr) => {
      acc[attr.AttributeID] = attr
      return acc
    }, {})
    const attributeList = proAttributeIdList.map(attrId => attributes[attrId])

    // get the list of attribute categoriy id related with this product
    let proAttributeCategoryIdList = attributeList.map(attr => attr.AttribCatID)
    const attribCatIDList = proAttributeCategoryIdList.filter((item, index) =>proAttributeCategoryIdList.indexOf(item) === index)
    
    // get attribute cat list
    let attribCats = await attribcatCollection.find({
      AttribCatID: {$in: attribCatIDList},
      SiteID: 1,
    }).toArray()

    attribCats = attribCats.reduce(function(acc, cat) {
      acc[cat.AttribCatID] = cat
      return acc
    }, {})
    const attribCatList = attribCatIDList.map(catId => attribCats[catId])

    /*
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%')
    attribCatList.map(attribCat => {
      console.log('++', attribCat.AttrCategory)
      attributeList.map(async (attr) => {
        if (attr.AttribCatID == attribCat.AttribCatID) {
          console.log('++', attr.Attribute, attr.AttributeID)
        }
      })
    })
    */
    // const newAttr = await getNewAttr(
    //   {
    //     AttributeID:"288593",        
    //     Price: 658,
    //   },
    //   attributecodesCollection, mastercodesCollection, vendorsCollection
    // )
    // console.log('new attribute: ', newAttr)
    // process.exit()
    
    // /*
    let displayOrder = 0
    await asyncForEach(attribCatList, async (attrCat) => {
      displayOrder++
      // const groupId = await insertGroup(attrCat.AttrCategory, productItem.template_id, displayOrder)
      const groupId = await insertLocalGroup(localgroupCollection, attrCat.AttrCategory, productItem.template_id, displayOrder)
      const groupAttrList = attributeList.filter(attr => attr.AttribCatID == attrCat.AttribCatID)
      let uploadedAttributeList = []
      await asyncForEach(groupAttrList, async (proAttr) => {
        if(!uploadedAttributeList.includes(proAttr.AttributeID)) {
          // const attributeId = await insertAttribute(localAttributeRelationCollection, proAttr)
          const newAttr = await getNewAttr(proAttr, attributecodesCollection, mastercodesCollection, vendorsCollection)
          const attributeId = await insertLocalAttribute(localAttributeCollection, newAttr, localAttributeRelationCollection)
          uploadedAttributeList.push(proAttr.AttributeID)
          const hideAttributeList = await hideAttributeCollection.find({
            AttributeID: proAttr.AttributeID,
            ProductID: productItem.ProductID,
            SiteID: 1
          }).toArray()
          const hideAttributeIdList = hideAttributeList.map(ha => ha.HideAttributeID)
          const tablerowOption = newAttr.TableOption
          const tablerowVendor = newAttr.TableVendor
          // const relationId = await insertRelation(
          //   groupId, attributeId, hideAttributeIdList.join(','),
          //   tablerowOption, tablerowVendor
          // )
          const relationId = await insertLocalRelation(
            localRelationCollection,
            groupId, attributeId, hideAttributeIdList.join(','),
            tablerowOption, tablerowVendor
          )
        }
      })
    })
  })

  console.log('generation end')
  await updateHiddenAttributes()
  console.log('except updating end. Please upload to the db of online store.')
})

router.get('/tostore', async (req, res, next) => {
  res.render('home')

  await groupUpload()
  await attributeUpload()
  await relationUpload()

  console.log('end of uploading with group, attribute and relation')
})


// Get new attribute data
async function getNewAttr(attr, attributecodesCollection, mastercodesCollection, vendorsCollection) {
  const attributeCodeList = await attributecodesCollection.aggregate([
    {
      $match: {
        AttributeID: attr.AttributeID
      }
    },
    {
      $lookup: {
        from: 'mastercodes',
        localField: 'CodeID',
        foreignField: 'CodeID',
        as: 'mastercodeData'
      }
    },
    {
      $unwind: {
        path: '$mastercodeData', preserveNullAndEmptyArrays: true
      }
    }
  ]).sort({AttributeCodeLine: 1, MFGCodeLine: 1}).toArray()
  
  const codeList1 = attributeCodeList.filter(ac => ac.AttributeCodeLine > 0).map(item => item.mastercodeData.AttributeCode)
  const tableOption = attributeCodeList.filter(ac => ac.AttributeCodeLine > 0).map(item => item.AttributeCodeLine)
  const codeList2 = attributeCodeList.filter(ac => ac.MFGCodeLine > 0).map(item => item.mastercodeData.MFGCode)
  const tableVendor = attributeCodeList.filter(ac => ac.MFGCodeLine > 0).map(item => item.MFGCodeLine)

  // get postal code
  const firstAttributeCode = await attributecodesCollection.aggregate([
    {
      $match: {
        AttributeID: attr.AttributeID
      }
    },
    {
      $lookup: {
        from: 'mastercodes',
        localField: 'CodeID',
        foreignField: 'CodeID',
        as: 'mastercodeData'
      }
    },
    {
      $unwind: {
        path: '$mastercodeData', preserveNullAndEmptyArrays: true
      }
    }
  ]).limit(1).toArray()

  let zipCode = ''
  let vendorID = 0
  if (firstAttributeCode.length > 0) {
    vendorID = firstAttributeCode[0].mastercodeData.VendorID
    const vendors = await vendorsCollection.find({
      VendorID: vendorID
    }).toArray()
    vendorList.map(vl => {
      if(vl.name == vendors[0].VendorName) {
        zipCode = vl.zipcode
      }
    })
  }
  
  return Object.assign(attr, {
    AttributeSku: codeList1.join(','),
    VendorSku: codeList2.join(','),
    TableOption: tableOption.join(','),
    TableVendor: tableVendor.join(','),
    VendorID: vendorID,
    ZipCode: zipCode,
  })
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

async function insertLocalAttribute(collectionInstance, attr, localRelationInstance) {
  var attributeId = 0

  // Check if attribute already exists, no? then, upload
  const attributeFind = await collectionInstance.find({
    label: attr.Attribute.trim(),
    price: attr.Price,
    price_type: attr.PriceType,
    attribute_sku: attr.AttributeSku,
    vendor_sku: attr.VendorSku,
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
      attribute_sku: attr.AttributeSku,
      vendor_sku: attr.VendorSku,
      zip_code: attr.ZipCode,
    })
    attributeId = localdattributeIndex
    localdattributeIndex ++
    // console.log('++++++ attribute: ', attributeId)
  } else { // This attribute already exists
    attributeId = attributeFind[0].local_attribute_id
    // console.log('----attribute id: ', attributeId)
  }
  await localRelationInstance.insertOne({
    originId: attr.AttributeID,
    newId: attributeId
  })
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

async function groupUpload() {
  const uploadNumberSize = process.env.UPLOAD_NUMBER_SIZE

  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const localgroupCollection = mydb.collection('local-groups')
  
  // group uploading
  const groupList = await localgroupCollection.find({}, {_id: 0}).toArray()
  const groupUploadTimes = (groupList.length % uploadNumberSize) == 0 ? parseInt(groupList.length / uploadNumberSize) : parseInt(groupList.length / uploadNumberSize) + 1
  const groupArray = [...Array(groupUploadTimes).keys()]
  const initialGroupQuery = "INSERT INTO public.groups(id, label, display_order, created_at, updated_at, template_id) VALUES"
  await asyncForEach(groupArray, async (groupItem, index) => {
    let additionalGroupQuery = ""
    const d = "2020-04-22T17:14:54.824+00:00"
    if (index == (groupUploadTimes - 1)) {
      const blockLength = groupList.length - uploadNumberSize * index
      for (let itemIndex = 0; itemIndex < blockLength; itemIndex++) {
        const groupElement = groupList[groupItem * uploadNumberSize + itemIndex]
        if (itemIndex < (blockLength - 1)) {
          additionalGroupQuery += "(" + parseInt(groupElement.local_group_id) + ",'" + groupElement.label + "',"
                               + groupElement.display_order + ",'" + d + "','"
                               + d + "'," + groupElement.template_id + "), "
        } else {
          additionalGroupQuery += "(" + parseInt(groupElement.local_group_id) + ",'" + groupElement.label + "',"
                               + groupElement.display_order + ",'" + d + "','"
                               + d + "'," + groupElement.template_id + ")"
        }
      }
      await pgClient.query(initialGroupQuery + additionalGroupQuery)
    } else {
      for (let itemIndex = 0; itemIndex < uploadNumberSize; itemIndex++) {
        const groupElement = groupList[groupItem * uploadNumberSize + itemIndex]
        if (itemIndex < (uploadNumberSize - 1)) {
          additionalGroupQuery += "(" + parseInt(groupElement.local_group_id) + ",'" + groupElement.label + "',"
                               + groupElement.display_order + ",'" + d + "','"
                               + d + "'," + groupElement.template_id + "), "
        } else {
          additionalGroupQuery += "(" + parseInt(groupElement.local_group_id) + ",'" + groupElement.label + "',"
                               + groupElement.display_order + ",'" + d + "','"
                               + d + "'," + groupElement.template_id + ")"
        }
      }
      await pgClient.query(initialGroupQuery + additionalGroupQuery)
    }

    console.log('group uploaded: ', (index + 1) + ' of ' + groupUploadTimes)
  })
  console.log('end uploading of group')
  return true
}

async function attributeUpload() {
  const uploadNumberSize = process.env.UPLOAD_NUMBER_SIZE

  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const localAttributeCollection = mydb.collection('local-dattributes')
  
  // attribute uploading
  const attributeList = await localAttributeCollection.find({}, {_id: 0}).toArray()
  const attributeUploadTimes = (attributeList.length % uploadNumberSize) == 0 ? parseInt(attributeList.length / uploadNumberSize) : parseInt(attributeList.length / uploadNumberSize) + 1
  const attributeArray = [...Array(attributeUploadTimes).keys()]
  const initialAttributeQuery = "INSERT INTO public.dattributes(id, label, price, price_type, weight, width, "
                                + "length, girth, attribute_code, postal_code, store_list, vendor_sku, width2, "
                                + "length2, girth2, width3, length3, girth3, weight2, weight3, freight, "
                                + "min_ship_quantity, max_ship_quantity, ship_price_percent) VALUES"
  await asyncForEach(attributeArray, async (attributeItem, index) => {
    let additionalAttributeQuery = ""
    if (index == (attributeUploadTimes - 1)) {
      const blockLength = attributeList.length - uploadNumberSize * index
      for (let itemIndex = 0; itemIndex < blockLength; itemIndex++) {
        const attributeElement = attributeList[attributeItem * uploadNumberSize + itemIndex]
        if (itemIndex < (blockLength - 1)) {
          additionalAttributeQuery += "(" + parseInt(attributeElement.local_attribute_id) + ",'" + attributeElement.label + "',"
                               + attributeElement.price + "," + attributeElement.price_type + "," + attributeElement.weight + ","
                               + attributeElement.width + "," + attributeElement.length + "," + attributeElement.girth + ",'"
                               + attributeElement.attribute_sku + "','" + attributeElement.zip_code + "','" + attributeElement.store_list + "','"
                               + attributeElement.vendor_sku + "'," + attributeElement.width2 + "," + attributeElement.length2 + ","
                               + attributeElement.girth2 + "," + attributeElement.width3 + "," + attributeElement.length3 + ","
                               + attributeElement.girth3 + "," + attributeElement.weight2 + "," + attributeElement.weight3 + ","
                               + attributeElement.freight + "," + attributeElement.min_ship_quantity + ","
                               + attributeElement.max_ship_quantity + "," + attributeElement.ship_price_percent + "), "
        } else {
          additionalAttributeQuery += "(" + parseInt(attributeElement.local_attribute_id) + ",'" + attributeElement.label + "',"
                               + attributeElement.price + "," + attributeElement.price_type + "," + attributeElement.weight + ","
                               + attributeElement.width + "," + attributeElement.length + "," + attributeElement.girth + ",'"
                               + attributeElement.attribute_sku + "','" + attributeElement.zip_code + "','" + attributeElement.store_list + "','"
                               + attributeElement.vendor_sku + "'," + attributeElement.width2 + "," + attributeElement.length2 + ","
                               + attributeElement.girth2 + "," + attributeElement.width3 + "," + attributeElement.length3 + ","
                               + attributeElement.girth3 + "," + attributeElement.weight2 + "," + attributeElement.weight3 + ","
                               + attributeElement.freight + "," + attributeElement.min_ship_quantity + ","
                               + attributeElement.max_ship_quantity + "," + attributeElement.ship_price_percent + ")"
        }
      }
      await pgClient.query(initialAttributeQuery + additionalAttributeQuery)
    } else {
      for (let itemIndex = 0; itemIndex < uploadNumberSize; itemIndex++) {
        const attributeElement = attributeList[attributeItem * uploadNumberSize + itemIndex]
        if (itemIndex < (uploadNumberSize - 1)) {
          additionalAttributeQuery += "(" + parseInt(attributeElement.local_attribute_id) + ",'" + attributeElement.label + "',"
                               + attributeElement.price + "," + attributeElement.price_type + "," + attributeElement.weight + ","
                               + attributeElement.width + "," + attributeElement.length + "," + attributeElement.girth + ",'"
                               + attributeElement.attribute_sku + "','" + attributeElement.zip_code + "','" + attributeElement.store_list + "','"
                               + attributeElement.vendor_sku + "'," + attributeElement.width2 + "," + attributeElement.length2 + ","
                               + attributeElement.girth2 + "," + attributeElement.width3 + "," + attributeElement.length3 + ","
                               + attributeElement.girth3 + "," + attributeElement.weight2 + "," + attributeElement.weight3 + ","
                               + attributeElement.freight + "," + attributeElement.min_ship_quantity + ","
                               + attributeElement.max_ship_quantity + "," + attributeElement.ship_price_percent + "), "
        } else {
          additionalAttributeQuery += "(" + parseInt(attributeElement.local_attribute_id) + ",'" + attributeElement.label + "',"
                               + attributeElement.price + "," + attributeElement.price_type + "," + attributeElement.weight + ","
                               + attributeElement.width + "," + attributeElement.length + "," + attributeElement.girth + ",'"
                               + attributeElement.attribute_sku + "','" + attributeElement.zip_code + "','" + attributeElement.store_list + "','"
                               + attributeElement.vendor_sku + "'," + attributeElement.width2 + "," + attributeElement.length2 + ","
                               + attributeElement.girth2 + "," + attributeElement.width3 + "," + attributeElement.length3 + ","
                               + attributeElement.girth3 + "," + attributeElement.weight2 + "," + attributeElement.weight3 + ","
                               + attributeElement.freight + "," + attributeElement.min_ship_quantity + ","
                               + attributeElement.max_ship_quantity + "," + attributeElement.ship_price_percent + ")"
        }
      }
      await pgClient.query(initialAttributeQuery + additionalAttributeQuery)
    }

    console.log('attribute uploaded: ', (index + 1) + ' of ' + attributeUploadTimes)
  })
  console.log('end uploading of attribute')
  return true
}

async function relationUpload() {
  const uploadNumberSize = process.env.UPLOAD_NUMBER_SIZE

  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const localRelationCollection = mydb.collection('local-drellations')

  // relation uploading
  const relationList = await localRelationCollection.find({}, {_id: 0}).toArray()
  const relationUploadTimes = (relationList.length % uploadNumberSize) == 0 ? parseInt(relationList.length / uploadNumberSize) : parseInt(relationList.length / uploadNumberSize) + 1
  const relationArray = [...Array(relationUploadTimes).keys()]
  const initialRelationQuery = "INSERT INTO public.drellations(id, group_id, dattribute_id, excepts, table_row_option, table_row_vendor) VALUES"
  await asyncForEach(relationArray, async (relationItem, index) => {
    let additionalRelationQuery = ""
    if (index == (relationUploadTimes - 1)) {
      const blockLength = relationList.length - uploadNumberSize * index
      for (let itemIndex = 0; itemIndex < blockLength; itemIndex++) {
        const relationElement = relationList[relationItem * uploadNumberSize + itemIndex]
        if (itemIndex < (blockLength - 1)) {
          additionalRelationQuery += "(" + parseInt(relationElement.local_relation_id) + "," + relationElement.group_id + ","
                               + relationElement.dattribute_id + ",'" + relationElement.excepts + "','"
                               + relationElement.table_row_option + "','" + relationElement.table_row_vendor + "'), "
        } else {
          additionalRelationQuery += "(" + parseInt(relationElement.local_relation_id) + "," + relationElement.group_id + ","
                               + relationElement.dattribute_id + ",'" + relationElement.excepts + "','"
                               + relationElement.table_row_option + "','" + relationElement.table_row_vendor + "')"
        }
      }
      await pgClient.query(initialRelationQuery + additionalRelationQuery)
    } else {
      for (let itemIndex = 0; itemIndex < uploadNumberSize; itemIndex++) {
        const relationElement = relationList[relationItem * uploadNumberSize + itemIndex]
        if (itemIndex < (uploadNumberSize - 1)) {
          additionalRelationQuery += "(" + parseInt(relationElement.local_relation_id) + "," + relationElement.group_id + ","
                               + relationElement.dattribute_id + ",'" + relationElement.excepts + "','"
                               + relationElement.table_row_option + "','" + relationElement.table_row_vendor + "'), "
        } else {
          additionalRelationQuery += "(" + parseInt(relationElement.local_relation_id) + "," + relationElement.group_id + ","
                               + relationElement.dattribute_id + ",'" + relationElement.excepts + "','"
                               + relationElement.table_row_option + "','" + relationElement.table_row_vendor + "')"
        }
      }
      await pgClient.query(initialRelationQuery + additionalRelationQuery)
    }

    await sleep(200)

    console.log('relation uploaded: ', (index + 1) + ' of ' + relationUploadTimes)
  })
  console.log('end uploading of relation')
  return true
}

async function updateHiddenAttributes() {
  const client = await MongoClient.connect(mongoUrl)
  const mydb = client.db(dbName)
  const localRelationCollection = mydb.collection('local-drellations')
  const hideRelationCollection = mydb.collection('local-dattribute-relation')
  
  const localRelationList = await localRelationCollection.find().toArray()

  await asyncForEach(localRelationList, async (lr) => {
    if (lr.excepts != '') {
      const exceptIdList = lr.excepts.split(',')
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

      localRelationCollection.updateOne(
        {
          _id: lr._id
        },
        {
          $set: {
            excepts: uniqueIdList.join(',')
          }
        }
      )
    }
  })
  console.log('end except updating')
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/*
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
*/

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

module.exports = router