import express from "express"
import msdb from "mssql"
import { MongoClient } from 'mongodb'

const mongoUrl = 'mongodb://localhost:27017'
const dbName = 'display4sale'

const router = express.Router()


var config = {
    server: process.env.msdb_server,
    user:     process.env.msdb_user,
    password: process.env.msdb_password,
    database: process.env.msdb_database
}

router.get("/", async (req, res, next) => {
    const client = await MongoClient.connect(mongoUrl)
    const mydb = client.db(dbName)

    const tableList = [
                        // 'AdCategories', 
                        // 'AdPages', 
                        // 'AdPageTitle', 
                        // 'AttribCat', 
                        // 'AttribCatTriggers', 
                        // 'AttributeCodes', 
                        // 'Attributes', 
                        // 'Authnet', 
                        // 'BillTo', 
                        // 'BuyGetFree', 
                        // 'CartAttributes', 
                        // 'CartMaterials', 
                        // 'Categories', 
                        // 'CategoryType', 
                        // 'CatSubCat', 
                        // 'CatSubCatBK', 
                        // 'CatSubCatProd', 
                        // 'CatSubCatProdBK', 
                        // 'CatSubCatRightExt', 
                        // 'ChartColumns', 
                        // 'ChartRows', 
                        // 'ChartValues', 
                        // 'CodeCat', 
                        // 'CodeSubCat', 
                        // 'CodeSubCat2', 
                        // 'Countries', 
                        // 'CouponEmails', 
                        // 'Coupons', 
                        // 'CustCat', 
                        // 'CustCatTEMP', 
                        // 'CustList', 
                        // 'CustListImages', 
                        // 'CustListTEMP', 
                        // 'CustomerType', 
                        // 'DropShipping', 
                        // 'dtproperties', 
                        // 'EmailHistory', 
                        // 'Feedback', 
                        // 'FilterCategory', 
                        // 'FilterChoices', 
                        // 'FilterEntry',
                        // 'FilterOption', 
                        // 'FilterOptionProduct', 
                        // 'Filters', 
                        // 'FlashBox', 
                        // 'Freight', 
                        // 'GiftCertificates', 
                        // 'HideAttributes', 
                        // 'HideMaterials', 
                        // 'HomePageBlocks', 
                        // 'HomePageProducts', 
                        // 'Inventory', 
                        // 'ItemStatusHistory', 
                        // 'LeftBoxes', 
                        // 'MarketExt', 
                        // 'MasterCodes', 
                        // 'MasterSiteEmails', 
                        // 'MasterSites', 
                        // 'MaterialCodes', 
                        // 'Materials', 
                        // 'MaterialType', 
                        // 'MaterialTypeTriggers', 
                        // 'Options', 
                        // 'OrderCodes', 
                        // 'OrderCredit', 
                        // 'OrderDetailAttributes', 
                        // 'OrderDetails', 
                        // 'OrderDetailsARCH', 
                        // 'OrderItemTracking', 
                        // 'OrderItemVendor', 
                        // 'Orders', 
                        // 'OrdersARCH', 
                        // 'OrderStatus', 
                        // 'OrderStatusEmails', 
                        // 'OrderStatusHistory', 
                        // 'OrderVendors', 
                        // 'Payment', 
                        // 'PaymentAuthorization', 
                        // 'PayPalToken', 
                        // 'PrintProfileCodes', 
                        // 'PrintProfileMaterial', 
                        // 'PrintProfiles', 
                        // 'PrintShipping', 
                        // 'PrintVolume', 
                        // 'ProductAttribCat', 
                        // 'ProductAttributes', 
                        // 'ProductCategories', 
                        // 'ProductFilterChoices', 
                        // 'ProductImages', 
                        // 'ProductMattes', 
                        // 'ProductOptions', 
                        // 'ProductQuantities', 
                        // 'ProductRelated', 
                        // 'Products', 
                        // 'ProductSEO', 
                        // 'ProductsPage', 
                        // 'ProductStatus', 
                        // 'ProductsTemp', 
                        // 'ProductSubCat', 
                        // 'ProductSwatches', 
                        // 'ProductSwatches3', 
                        // 'ProductSwatches4', 
                        // 'Provinces', 
                        // 'PSEO', 
                        // 'QuoteCart', 
                        // 'QuoteCartAttribute', 
                        // 'QuoteCodes', 
                        // 'QuoteDetailAttributes', 
                        // 'QuoteDetails', 
                        // 'Quotes', 
                        // 'RightBoxes', 
                        // 'RightExt', 
                        // 'Roles', 
                        // 'SCBK', 
                        // 'Sessions', 
                        // 'ShippingTypes', 
                        // 'ShipRates', 
                        // 'ShipTo', 
                        // 'ShoppingCart', 
                        // 'ShoppingCartPopup', 
                        // 'States', 
                        // 'Status', 
                        // 'Store', 
                        // 'SubCategories', 
                        // 'SubHome', 
                        // 'SubSubVendors', 
                        // 'SubVendors', 
                        // 'SwingCounties', 
                        // 'TaxCode', 
                        // 'TaxCode2', 
                        // 'TaxCode3', 
                        // 'TaxTemp', 
                        // 'TempAttr', 
                        // 'TempAttr2', 
                        // 'TempProd1', 
                        // 'TempProductCats', 
                        // 'TempProducts', 
                        // 'TempTax12', 
                        // 'TempUser', 
                        // 'TLBS', 
                        // 'Tokens', 
                        // 'TotalDiscount', 
                        // 'Transactions', 
                        // 'UDesign', 
                        // 'UDImages', 
                        // 'UserAddresses', 
                        // 'UserCredit', 
                        // 'UserRoles', 
                        // 'Users', 
                        // 'UserUploads', 
                        // 'UTax', 
                        // 'Vendors', 
                        // 'WishList', 
                        // 'WishListAttribute', 
                        'ZIP_CODES', 
                        // 'ZIPCOD'
                    ]

    msdb.connect(config, function (err) {
    
        if (err) console.log(err)

        // create Request object
        var request = new msdb.Request()
        request.stream = true
        var rowsToProcess = []
        tableList.forEach(async (tableName) => {
            var collection = mydb.collection(tableName.toLowerCase())
            // query to the database and get the records
            rowsToProcess = []
            request.query('select * from ' + tableName)
            request.on('row', row => {
                rowsToProcess.push(row)
                if (rowsToProcess.length >= 20) {
                    request.pause()
                    collection.insertMany(rowsToProcess)
                    rowsToProcess = []
                    request.resume()
                }
            })
            request.on('done', result => {
                if (rowsToProcess.length > 0 && rowsToProcess.length < 20) {
                    collection.insertMany(rowsToProcess)
                }
                console.log('end of ', tableName)
            })
        })
    })
    res.render('home')
})

module.exports = router