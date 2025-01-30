const validate = require('../helper/validate')
const model = require("../models/module")
const keysToFindInJSON = require('../helper/keyToFindInJSON')
const moment = require('moment')
const mongoose = require('mongoose')
const { errorLogger } = require('../helper/loggerService')
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
        return convertStringToNumberIfNeeded(companyId);
    }
}
function convertStringToNumberIfNeeded(value) {
    // Attempt to convert the value to a number
    const number = parseFloat(value);

    // Check if the conversion result is a number and the conversion has consumed the entire string
    if (!isNaN(number) && number.toString() === value.trim()) {
        return number; // Return the number if conversion is successful
    } else {
        return value; // Return the original value if conversion is not possible
    }
}
function fetchDataForDropdown(dropdownData, model, value,clientCode, res) {
    let dropdownMatch = { status: 1 ,clientCode:clientCode};
    if (value) {
        Object.assign(dropdownMatch, { [dropdownData.filterColumn]: createObjectId(value) });
    }
    //    dropdownData.dropdownFilter!==null&&console.log("DropdownFilter",JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"')));
    let dropdownQuery = [{ $match: dropdownMatch }];

    let referenceTable = dropdownData.tableName.split('.');
    for (let i = 1; i < referenceTable.length; i++) {
        let path = referenceTable.slice(1, i + 1).join('.');
        dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });
    }
    console.log();
    if (dropdownData.columnName && dropdownData.tableName.split(".").length > 1) {
        // const keys = dropdownData.referenceColumn.split(',');
        // const regex = /[\s\W]/;
        // const fieldsToConcat = keys.map(key => regex.test(key) ? `${key}` : `$${key.trim()}`);
        console.log("dropdownData.columnName",);
        dropdownQuery.push({ $project: { [dropdownData.columnName.replace("$", "")]: dropdownData.columnName } })
    }
    else {

        dropdownQuery.push({ $project: { [dropdownData.columnName.replace("$", "")]: `$${dropdownData.columnName}` } })
    }

    return model.AggregateFetchData(referenceTable[0], dropdownData.referenceTable, dropdownQuery, res);
}
function getPropertyByString(obj, propString) {
    const props = propString.split('.');
    let currentObj = obj;

    for (let i = 0; i < props.length; i++) {
        if (currentObj[props[i]] !== undefined) {
            currentObj = currentObj[props[i]];
        } else {
            // Property not found
            return undefined;
        }
    }

    return currentObj;
}

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

module.exports = {
    AddRules: async (req, res) => {
        const validationRule = {
            "FormControlId": "required",
            "module": "required",
            preFix: "required",
            NoofDigits: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error...!",
                    data: err
                })
            }
            else {
                try {
                    let insertData = {}
                    insertData.id = req.body.id || ""
                    insertData.menuID = req.body.menuID
                    insertData.module = req.body.module
                    insertData.preFix = req.body.preFix
                    insertData.NoofDigits = req.body.NoofDigits
                    if (Array.isArray(req.body.rules)) {
                        insertData.rules = req.body.rules

                    }
                    else {
                        insertData.rules = JSON.parse(req.body.rules)
                    }
                    if (Array.isArray(req.body.cycleType)) {
                        insertData.cycleType = req.body.cycleType

                    }
                    else {
                        insertData.cycleType = JSON.parse(req.body.cycleType)
                    }
                    let data = await model.updateIfAvailableElseInsert("tblNoGeneration", "NumberGenerationSchema", insertData, {}, res)
                    data ? res.send({
                        success: true,
                        message: "Data inserted successfully....!",
                        data: data
                    }) : res.send({
                        success: false,
                        message: "Data not inserted successfully....!",
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
        })
    },
    GenerateNumber: async (req, res) => {
        console.log("No Generation",);
        // Defining validation rules
        const validationRule = {
            // tableName: "required",
            // menuID: "required"
        }
        try {
            let matchData = { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode }
            // let menuData=await model.AggregateFetchData("tblMenu", "tblMenu", [{ $match: { status: Number(process.env.ACTIVE_STATUS),clientCode:req.clientCode } }], res)
            //     let menuNames = menuData.flatMap(item => extractMenuNames(item))
            //     if (menuNames.find(item => item.value === req.body.menuID)) {
            //         let menuObjectId=menuNames.find(item => item.value === req.body.menuID).id.toString()
            //         matchData['menuIds'] = menuObjectId
            //     }
            // let menuData = await model.AggregateFetchData("tblMenu1", "tblMenu1", [{ $match: { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode,_id: createObjectId(req.body.menuID) } }], res)
            matchData['menuIds'] = req.body.menuID

            // Constructing the query and fetching the data from the NumberGenerationSchema table
            let query = [
                {
                    $match: matchData
                }
            ]
            let data = await model.AggregateFetchData("tblNoGeneration", "NumberGenerationSchema", query, res)
            // defining the variables to be used in the loop
            data[0].rules.sort((a, b) => a.ordering - b.ordering)
            let datatofetch = []
            let finaldata = {}
            var temp = data[0].preFix;
            let finalDataArray = []
            // Looping through the rules and fetching the data from the corresponding tables
            for (const iterator of data[0].rules) {

                if (iterator.type !== "separator" && iterator.type !== "sequence"&&iterator.tableName!==""&&iterator.tableName!==null) {
                    let values = keysToFindInJSON.find(req.body, [iterator.name])
                    datatofetch.push(fetchDataForDropdown(iterator, model, values[iterator.name], req.clientCode,res))
                }
                else if (iterator.type === "date" && (iterator.tableName == ""||iterator.tableName==null)) {
                    datatofetch.push([req.body])
                }
                
            }
            // console.log("datatofetch", datatofetch);
            let fetchedData = await Promise.all(datatofetch)
            // console.log("fetchedData", fetchedData);
            // return console.log(fetchedData);
            // return
            let index = 0
            // restructuring the fetched data into the finaldata object
            for (let idx = 0; idx < data[0].rules.length; idx++) {
                if (data[0].rules[idx].type !== "separator" && data[0].rules[idx].type !== "sequence") {
                    finaldata[`${data[0].rules[idx].tableName}${data[0].rules[idx].name}`] = fetchedData[index];
                    index++

                }
                // if (data[0].rules[idx].type === "date" && (data[0].rules[idx].tableName == ""||data[0].rules[idx].tableName==null)) {
                //     finaldata[`${data[0].rules[idx].tableName}${data[0].rules[idx].name}`] = [[req.body]];
                // }
                

            }
            console.log("finaldata",finaldata);
            let _matchdata = {clientCode:req.clientCode}
            let queryforRecord = []
            // Looping through the cycleType and adding the necessary fields to the query
            for (const cycle of data[0].cycleType) {
                if (cycle.keyType == "date") {
                    console.log("hello");
                    queryforRecord.unshift({
                        $addFields: {
                            [cycle.keyName]: {
                                $cond: {
                                    if: { $eq: [{ $type: `$${cycle.keyName}` }, "string"] },
                                    then: { $dateFromString: { dateString: `$${cycle.keyName}` } },
                                    else: `$${cycle.keyName}`
                                }
                            },
                        },
                    })
                    console.log(queryforRecord);
                    keysToFindInJSON.find(req.body, [cycle.keyName])
                    _matchdata["$or"] = [
                        {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [{ $month: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format(cycle.dateFormat))]
                                    },
                                    {
                                        $eq: [{ $year: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format("YYYY"))]
                                    }
                                ]
                            }
                        },  // Replace yourMonth with the desired month
                        {
                            $expr: {
                                $and: [
                                    { $eq: [{ $year: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format(cycle.dateFormat))] }
                                ]
                            }
                        },    // Replace yourYear with the desired year
                        {
                            $expr: {
                                $and: [
                                    { $eq: [{ $dayOfMonth: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format(cycle.dateFormat))] },
                                    { $eq: [{ $month: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format("MM"))] },
                                    { $eq: [{ $year: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format("YYYY"))] }
                                ]
                            }
                        }  // Replace yourDate with the desired date
                    ]

                    // _matchdata[cycle.keyName] = moment(req.body[cycle.keyName]).format(cycle.DateFormat)

                }
                else {

                    Object.assign(_matchdata, { [cycle.keyName]: keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName] })
                }
            }
            console.log("queryforRecord",queryforRecord);
            // throw new Error("hello");
            queryforRecord.push({ $match: _matchdata }, { $count: "count" })

            // Looping through the rules and fetching the data from the corresponding tables and Generating number
            for (const iterator of data[0].rules) {
                if (iterator.type === "key") {
                    console.log(iterator.tableName);
                    // console.log(finaldata[iterator.tableName][0]);
                    console.log(iterator.columnName.replace("$", ""));
                    console.log(`${iterator.tableName}${iterator.name}`);
                    // console.log(getPropertyByString(finaldata[iterator.tableName][0], iterator.columnName.replace("$", "")));
                    temp += getPropertyByString(finaldata[`${iterator.tableName}${iterator.name}`][0], iterator.columnName.replace("$", "")).substring(iterator.from, iterator.to).toUpperCase()

                }
                if (iterator.type === "date") {
                    console.log(moment(getPropertyByString(finaldata[`${iterator.tableName}${iterator.name}`][0], iterator.columnName.replace("$", ""))).format(iterator.dateFormat));
                    temp += moment(getPropertyByString(finaldata[`${iterator.tableName}${iterator.name}`][0], iterator.columnName.replace("$", ""))).format(iterator.dateFormat)

                }
                if (iterator.type === "separator") {
                    console.log(iterator.specialSymbol);
                    temp += iterator.specialSymbol

                }
                if (iterator.type === "sequence") {
                    let noofRecords = await model.AggregateFetchData(req.body.tableName, req.body.tableName, queryforRecord, res)

                    let Numbers
                    noofRecords.length > 0 ? Numbers = noofRecords[0].count + 1 : Numbers = 1
                    for (let index = 0; index < Number(data[0].NoofDigits) - Numbers.toString().length; index++) {
                        temp += "0"

                    }
                    noofRecords.length > 0 ? Number(noofRecords[0].count) > 0 ? temp += Number(noofRecords[0].count) + 1 : "" : temp += 1;
                }
            }

            console.log({

                success: true,
                message: "Data fetched successfully....!",
                data: finaldata,
                Number: temp
            });
            req.body[data[0]?.columnName] = temp
            return { success: true, message: "Data fetched successfully....!", data: finaldata, Number: temp };
            data ? res.send({
                success: true,
                message: "Data fetched successfully....!",
                data: finaldata,
                Number: temp

            }) : res.send({
                success: false,
                message: "Data not fetched successfully....!",
                data: data
            })
        } catch (error) {
            errorLogger(error, req)
            console.log(error);
        }
        //     }
        // })
    },
    GenerateNumberbk: async (req, res) => {
        console.log("No Generation", req.body);
        // Defining validation rules
        const validationRule = {
            tableName: "required",
            FormControlId: "required"
        }
        // Validate the request body against the validation rules
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                // If validation fails, return an error response
                res.status(403).send({
                    success: false,
                    message: "Validation Error...!",
                    data: err
                })
            }
            else {
                try {
                    // Constructing the query and fetching the data from the NumberGenerationSchema table
                    let query = [
                        {
                            $match: { status: Number(process.env.ACTIVE_STATUS), menuID: req.body.menuID }
                        },
                        {
                            $set: {
                                rules: {
                                    $sortArray: {
                                        input: "$rules",
                                        sortBy: { ordering: 1 } // Sorting the rules by the ordering field
                                    }
                                }
                            }
                        }
                    ]
                    let data = await model.AggregateFetchData("tblNoGeneration", "NumberGenerationSchema", query, res)
                    // defining the variables to be used in the loop
                    let datatofetch = []
                    let finaldata = {}
                    var temp = data[0].preFix;
                    let finalDataArray = []
                    // Looping through the rules and fetching the data from the corresponding tables
                    for (const iterator of data[0].rules) {

                        if (iterator.type !== "separator" && iterator.type !== "sequence") {
                            let values = keysToFindInJSON.find(req.body, [iterator.name])
                            datatofetch.push(fetchDataForDropdown(iterator, model, values[iterator.name], res))
                        }
                    }
                    let fetchedData = await Promise.all(datatofetch)
                    // return console.log(fetchedData);
                    // return
                    let index = 0
                    // restructuring the fetched data into the finaldata object
                    for (let idx = 0; idx < data[0].rules.length; idx++) {
                        if (data[0].rules[idx].type !== "separator" && data[0].rules[idx].type !== "sequence") {
                            finaldata[data[0].rules[idx].tableName] = fetchedData[index];
                            index++

                        }

                    }
                    let _matchdata = {}
                    let queryforRecord = []
                    // Looping through the cycleType and adding the necessary fields to the query
                    for (const cycle of data[0].cycleType) {
                        if (cycle.keyType == "date") {
                            console.log("hello");
                            queryforRecord.unshift({
                                $addFields: {
                                    [cycle.keyName]: {
                                        $cond: {
                                            if: { $eq: [{ $type: `$${cycle.keyName}` }, "string"] },
                                            then: { $dateFromString: { dateString: `$${cycle.keyName}` } },
                                            else: `$${cycle.keyName}`
                                        }
                                    },
                                },
                            })
                            console.log(queryforRecord);
                            keysToFindInJSON.find(req.body, [cycle.keyName])
                            _matchdata["$or"] = [
                                {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [{ $month: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format(cycle.dateFormat))]
                                            },
                                            {
                                                $eq: [{ $year: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format("YYYY"))]
                                            }
                                        ]
                                    }
                                },  // Replace yourMonth with the desired month
                                {
                                    $expr: {
                                        $and: [
                                            { $eq: [{ $year: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format(cycle.dateFormat))] }
                                        ]
                                    }
                                },    // Replace yourYear with the desired year
                                {
                                    $expr: {
                                        $and: [
                                            { $eq: [{ $dayOfMonth: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format(cycle.dateFormat))] },
                                            { $eq: [{ $month: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format("MM"))] },
                                            { $eq: [{ $year: `$${cycle.keyName}` }, Number(moment(keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName]).format("YYYY"))] }
                                        ]
                                    }
                                }  // Replace yourDate with the desired date
                            ]

                            // _matchdata[cycle.keyName] = moment(req.body[cycle.keyName]).format(cycle.DateFormat)

                        }
                        else {

                            Object.assign(_matchdata, { [cycle.keyName]: keysToFindInJSON.find(req.body, [cycle.keyName])[cycle.keyName] })
                        }
                    }
                    queryforRecord.push({ $match: _matchdata }, { $count: "count" })

                    // Looping through the rules and fetching the data from the corresponding tables and Generating number
                    for (const iterator of data[0].rules) {
                        if (iterator.type === "key") {
                            console.log(iterator.tableName);
                            console.log(finaldata[iterator.tableName][0]);
                            console.log(iterator.columnName.replace("$", ""));
                            // console.log(getPropertyByString(finaldata[iterator.tableName][0], iterator.columnName.replace("$", "")));
                            temp += getPropertyByString(finaldata[iterator.tableName][0], iterator.columnName.replace("$", "")).substring(iterator.from, iterator.to).toUpperCase()

                        }
                        if (iterator.type === "date") {
                            temp += moment(getPropertyByString(finaldata[iterator.tableName][0], iterator.columnName.replace("$", ""))).format(iterator.dateFormat)

                        }
                        if (iterator.type === "separator") {
                            console.log(iterator.specialSymbol);
                            temp += iterator.specialSymbol

                        }
                        if (iterator.type === "sequence") {
                            let noofRecords = await model.AggregateFetchData(req.body.tableName, req.body.tableName, queryforRecord, res)

                            let Numbers
                            noofRecords.length > 0 ? Numbers = noofRecords[0].count + 1 : Numbers = 1
                            for (let index = 0; index < Number(data[0].NoofDigits) - Numbers.toString().length; index++) {
                                temp += "0"

                            }
                            noofRecords.length > 0 ? Number(noofRecords[0].count) > 0 ? temp += Number(noofRecords[0].count) + 1 : "" : temp += 1;
                        }
                    }


                    return res.send({

                        success: true,
                        message: "Data fetched successfully....!",
                        data: finaldata,
                        Number: temp
                    })
                    data ? res.send({
                        success: true,
                        message: "Data fetched successfully....!",
                        data: finaldata,
                        Number: temp

                    }) : res.send({
                        success: false,
                        message: "Data not fetched successfully....!",
                        data: data
                    })
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "Something went wrong",
                        data: error.message
                    })
                }
            }
        })
    }
}