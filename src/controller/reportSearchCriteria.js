const { errorLogger } = require('../helper/loggerService');
const validate = require('../helper/validate')
const model = require("../models/module")
const moment = require('moment')
const mongoose = require('mongoose')
function extractMenuNames(item) {
    const items = [{ id: item._id, value: item.menuName }]; // Start with the current level

    // Recursively extract menu names and ids from 'options' array
    if (item.options && item.options.length) {
        item.options.forEach(option => {
            items.push(...extractMenuNames(option)); // Flatten and combine the results
        });
    }

    // Recursively extract menu names and ids from 'child' array
    if (item.child && item.child.length) {
        item.child.forEach(childItem => {
            items.push(...extractMenuNames(childItem)); // Flatten and combine the results
        });
    }

    return items;
}
function createObjectId(companyId) {
    try {
        if (companyId !== null) {

            return new mongoose.Types.ObjectId(companyId);
        } else {
            return null
        }
        // Attempt to create a new ObjectId with the provided companyId
    } catch (error) {
        // If an error occurs (e.g., due to an invalid companyId format), return null
        return companyId;
    }
}
module.exports = {
    Add: async (req, res) => {
        const validationRule = {
            menuID: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "validation error....",
                    data: err
                })
            }
            else {
                try {
                    let insertData = {
                        id: req.body.id || "",
                        tableName: req.body.tableName,
                        menuID: req.body.menuID,
                        apiUrl: req.body.apiUrl,
                        fields: Array.isArray(req.body.fields) ? req.body.fields : JSON.parse(req.body.fields),
                        buttons: Array.isArray(req.body.buttons) ? req.body.buttons : JSON.parse(req.body.buttons),
                        grid: Array.isArray(req.body.grid) ? req.body.grid : JSON.parse(req.body.grid),
                        clientCode: req.body.clientCode
                    }
                    let data = await model.updateIfAvailableElseInsertMaster("tblReportSearchCriteria", "tblReportSearchCriteria", insertData, {}, res)
                    data ? res.send({ success: true, message: "Data inserted successfully....", data: data }) : res.send({ success: false, message: "Data not inserted successfully....", data: data })



                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({ success: false, message: "Something went wrong", data: error.message })
                }
            }
        })
    },
    list: async (req, res) => {
        try {
            let matchData = { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode }
            // if (req.body.menuID && req.body.menuID !== "" && req.body.menuID !== "undefined") {
                // let menuData = await model.AggregateFetchData("tblMenu", "tblMenu", [{ $match: { status: Number(process.env.ACTIVE_STATUS) } }], res)
                // let menuNames = menuData.flatMap(item => extractMenuNames(item))
                // if (menuNames.find(item => item.value === req.body.menuID)) {
                    // let menuObjectId = menuNames.find(item => item.value === req.body.menuID).id.toString()
                    matchData['_id'] = createObjectId(req.body.menuID)
                // }
                // else {
                //     return res.send({
                //         success: false,
                //         message: "No Menu Found",
                //         data: []
                //     })
                // }

//                // console.log(menuNames);
                // matchData['menuID'] = req.body.menuID
            // }
            let query = [{ $match: matchData }]
            let data = await model.AggregateFetchData("tblReportSearchCriteria", "tblReportSearchCriteria", query, res)
            data.length > 0 ?
                res.send({
                    success: true,
                    message: "Data fetched successfully....!",
                    data: data

                })
                : res.send({
                    success: false,
                    message: "No data Found",
                    data: data
                })
        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    }

}
