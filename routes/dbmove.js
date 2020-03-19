import express from "express"
import { MongoClient } from 'mongodb'
require('dotenv').config()

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
    const rolesCollection = mydb.collection('roles')

    const roles = await rolesCollection.find({}).toArray()
    console.log(roles)
    res.status(200).json({roles});
    
})

module.exports = router