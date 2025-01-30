const validate = require('../helper/validate')
const model = require("../models/module")
const moment = require('moment')

module.exports = {
    Add: async (req, res) => {
        const validationRule = {
            menuID: "required",
        };
        try {
            let insertData = {
                id: req.body.id || "",
                status: Number(req.body.status) || Number(process.env.ACTIVE_STATUS),
                tableName: req.body.tableName,
                menuID: req.body.menuID,
                apiUrl: req.body.apiUrl,
                fields: Array.isArray(req.body.fields) ? req.body.fields : (req.body.fields ? JSON.parse(req.body.fields) : []),
                grid: Array.isArray(req.body.grid) ? req.body.grid : (req.body.grid ? JSON.parse(req.body.grid) : [])
            };
            let data = await model.updateIfAvailableElseInsertMaster("tblChart", "tblChart", insertData, {}, res);
            data ? res.send({ success: true, message: "Data inserted successfully....", data: data }) : res.send({ success: false, message: "Data not inserted successfully....", data: data });
        } catch (error) {
            res.status(500).send({ success: false, message: "Something went wrong", data: error.message });
        }
    },
    
    list: async (req, res) => {
        try {
            let matchData = { status: Number(process.env.ACTIVE_STATUS) }
            if (req.query.menuID && req.query.menuID !== "" && req.query.menuID !== "undefined") {
                matchData['menuID'] = req.query.menuID
            }
         
            let query = [{ $match: matchData }]
            
            let data = await model.AggregateFetchData("tblChart", "tblChart", query, res)
            console.log("matchData:", matchData, "query:", JSON.stringify(query));

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
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    },
}