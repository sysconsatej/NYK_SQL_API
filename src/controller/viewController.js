const validate = require('../helper/validate')
const model = require("../models/module")
const mongoose = require('mongoose')
const moment = require('moment')
const { errorLogger } = require('../helper/loggerService')
const ACTIVE_STATUS = Number(process.env.ACTIVE_STATUS)
function fixJsonLikeString(str) {
    // Normalize colons by ensuring there's a space after them
    str = str.replace(/:\s*/g, ': ');

    // Add quotes to keys and values, supporting spaces in values
    // This matches a key (with optional periods), followed by a colon, then captures everything until a comma or closing brace
    str = str.replace(/([{\s,])([\w.]+)(\s*:\s*)([^,}]+)/g, function (match, p1, p2, p3, p4) {
        // Add quotes around the key
        let newRegex = new RegExp("^{");
        console.log(p3);
        console.log(p4);
        let key = `"${p2.trim()}"`;
        // Add quotes around the value if not already quoted, and trim spaces
        let value = p4.trim().startsWith('"') ? p4.trim() : newRegex.test(p4.trim()) ? p4.trim() : `"${p4.trim()}"`;
        console.log(value);
        return `${p1}${key}${p3}${value}`;
    });

    // Handle $in arrays
    str = str.replace(/\$in\s*:\s*\[([^\]]+)\]/g, function (match, p1) {
        let arrayValues = p1.split(',').map(val => {
            val = val.trim();
            return val.startsWith('"') ? val : `"${val}"`;
        }).join(', ');
        return `"$in": [${arrayValues}]`;
    });

    // Handle nested objects recursively
    const nestedObjectRegex = /"([\w.]+)":\s*"{([^}]+)}"/;
    // const nestedObjectRegex = /"([\w.$]+)"\s*:\s*(?:"{([^}]+)}"|{\s*\$in:\s*\[[^\]]*\]\s*})/;
    let match = nestedObjectRegex.exec(str);

    while (match) {
        console.log(str);
        const fixedNestedObject = fixJsonLikeString(`{${match[2]}}`);
        str = str.replace(nestedObjectRegex, `"${match[1]}": ${fixedNestedObject}`);
        match = nestedObjectRegex.exec(str);
    }
    console.log(str);
    return str;
}


module.exports = {
    /**
     * Retrieves the types of fields.
     *
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @return {Promise<void>} - A promise that resolves when the response is sent.
     */
    TypesofFields: async (req, res) => {
        try {
            const{ dropdownFilter } = req.body
            let matchData={ status: ACTIVE_STATUS, tableName: { $nin: ["tblErrorLog", "tblTermsCondition"] } }
            if (dropdownFilter&&dropdownFilter!==null&&dropdownFilter!==''){ {
                let filter=JSON.parse(fixJsonLikeString(dropdownFilter))
                Object.assign(matchData,filter)
            }
            let query=[{ $match: matchData }, { $project: { value: "$tableName", label: "$tableName" } }]
            // Send the response with the types of fields
            console.log(req.body.dropdownFilter);
            let data = await model.AggregateFetchData("master_schema", "master_schema",query, res)
            return data
        }
        } catch (error) {
            // Log the error and send the error response
            errorLogger(error)
            res.status(500).json({
                success: false,
                data: [],
                message: `error in ViewCOntroller ${error.message}`
            })
        }
    },

}