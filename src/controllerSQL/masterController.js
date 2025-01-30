const validate = require('../helper/validate')
const { executeQuery, executeStoredProcedure, executeNonJSONStoredProcedure } = require("../modelSQL/model")

module.exports = {
    DisPlaySeacrchApi: async (req, res) => {
        const validationRule = { tableName: "required", menuID: "required" };
        // validate for validation according to validationRule
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                return res.status(403).send({ success: false, message: "Validation Error...!", data: err });
            }
            try {
                const { label, menuID, order, searchQuery, tableName, search, keyName, keyValue } = req.body
                let pageNo = parseInt(req.body.pageNo, 10) || 1; // Default to page 1 if not specified
                let limit = parseInt(req.body.limit, 10) || 10; // Default to 10 items per page if not specified
                let parameter = { clientId: 0, tableName: tableName, columnName: null, filterCondition: null, sortingOrder: null, search: null, menuId: menuID }
                let query = ``
                if (keyName && keyName !== "" && keyName !== "undefined" && keyValue && keyValue !== "" && keyValue !== "undefined") {
                    parameter.columnName = keyName
                    parameter.search = keyValue
                }
                else if (searchQuery && searchQuery !== "undefined" && searchQuery !== "") {
                    parameter.globalSearch = searchQuery
                }

                if (search && typeof search == "object") {

                    for (const key of Object.keys(search)) {
                        query += ` and ${key} = '${search[key]}'`
                    }
                    parameter.filterCondition = query

                }

                let count = await executeQuery(`select count(*) as total from ${tableName} where status = 0` + query, {})
                console.log(count.recordset[0].total === 0);

                if (count.recordset[0].total === 0) {
                    return res.send({ success: true, message: "No data found", data: [], count: count.recordset[0].total })
                }
                let data = await executeStoredProcedure('dynamicSearchApi', parameter)
                if (data.length > 0) {
                    return res.send({ success: true, message: "Data fetched successfully....!", data: data, Count: count.recordset[0].total })
                }
                res.send({ success: true, message: "No data found", data: data })
            }
            catch (error) {
                res.status(500).send({ success: false, message: "Something went wrong", data: [], error: error.message });
            }
        })
    },
    createMaster: async (req, res) => {
        try {
            let data = await executeNonJSONStoredProcedure('insertDataApi', { json: JSON.stringify(req.body), formId: req.body.menuID, clientId: req.body.clientId || 3, createdBy: req.userId || 4 })
            res.send({ success: true, message: "Data Inserted Successfully", data: data })
        }
        catch (error) {
            res.status(500).send({ success: false, message: "Something went wrong", data: [], error: error.message });
        }
    },
    infoData: async (req, res) => {
        try {
            let query = { clientID: req.clientId || 3, menuID: req.body.menuID, recordID: req.body.id }            
            let data = await executeStoredProcedure('dynamicFetchApi', query)
            data.length > 0 ? res.send({ success: true, message: "list fetched", data: data }) : res.status(403).send({ success: false, message: "No Data Found", data: [] });
        }
        catch (error) {
            res.status(500).send({ success: false, message: "Something went wrong", data: [], error: error.message });
        }
    }

}