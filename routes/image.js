import express from "express"
import fs from 'fs'
import path from 'path'

var router = express.Router()

router.get("/", async (req, res, next) => {
	res.render('home')
	
	var errorFileList = []
	// get the list of files in the folder
	var pathStr = 'images/s2/'
	var directoryPath = path.join(__dirname, '../' + pathStr)
	fs.readdir(directoryPath, async (err, files) => {
		if (err) {
			return console.log('Unable to scan directory: ' + err)
		} else {
			await asyncForEach1(files, async (file) => {
				// Do whatever you want to do with the file
				var fileName = file.split('.')
				var originalName = pathStr + file
				var targetName = pathStr + fileName[0] + '-thumb.jpg'
				var err = await fs.renameSync(originalName, targetName)
				// console.log(file)
				if (err) {
					errorFileList.push(file)
				}

				// fs.rename(originalName, targetName, (err) => {
				// 	if (err) {
				// 		errorFileList.push(file)
				// 		console.log('-----------error-----------', errorFileList)
				// 	} else {
				// 		console.log('renamed: ', file)
				// 	}
				// })
			})
			console.log('---------------error---------------', errorFileList)
		}

	})
	
})
// https://prnt.sc/rmtcpo
// https://prnt.sc/rmyipv
async function asyncForEach1(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

module.exports = router