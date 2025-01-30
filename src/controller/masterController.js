const moment = require('moment')
const validate = require('../helper/validate')
const model = require("../models/module")
const mongoose = require('mongoose')
const Schema = require('../schema/Newschema')
const connection = require('../config/MongoConnection')
const Msgmodel = require("../models/messageModel")
const getFolderSize = require('../helper/getFolderSize')
const { GenerateNumber } = require('../controller/NoGenerationController')
const fs = require('fs');
const path = require('path');
const sendMail = require('../helper/NodeMailer');
const { errorLogger } = require('../helper/loggerService')
const { isNullOrUndefined } = require('util')
const { default: axios } = require('axios')
const maxAllowedSizeInBytes = 1024 * 1024 * 1024;
function findFieldWithNewName(childs) {
    for (const child of childs) {
        // Check if fields array exists and is an array
        if (Array.isArray(child.fields)) {
            // Use find() to search for the field with a 'newName' key
            const field = child.fields.find(f => f.newName !== undefined || f.newField !== undefined || f.status == 2);

            // If a field with 'newName' is found, return it
            if (field) {
                return field;
            }
        }

        // Repeat the process for subChild if they exist
        if (child.subChild && Array.isArray(child.subChild)) {
            const subChildField = findFieldWithNewName(child.subChild);
            if (subChildField) {
                return subChildField;
            }
        }
    }

    // Return null if no field with 'newName' is found in any child or subChild
    return null;
}
function fixJsonLikeString(str) {
    // Normalize colons by ensuring there's a space after them
    str = str.replace(/:\s*/g, ': ');

    // Add quotes to keys and values, supporting spaces in values
    // This matches a key (with optional periods), followed by a colon, then captures everything until a comma or closing brace
    str = str.replace(/([{\s,])(\w+(\.\w+)?)(\s*:\s*)([^,}]+)/g, function (match, p1, p2, p3, p4, p5) {
        // Add quotes around the key
        let key = `"${p2.trim()}"`;
        // Add quotes around the value if not already quoted, and trim spaces
        let value = p5.trim().startsWith('"') ? p5.trim() : `"${p5.trim()}"`;
        return `${p1}${key}${p4}${value}`;
    });

    // Handle nested objects recursively
    const nestedObjectRegex = /"(\w+(\.\w+)*)":\s*"{([^}]+)}"/;
    let match = nestedObjectRegex.exec(str);

    while (match) {
        const fixedNestedObject = fixJsonLikeString(`{${match[3]}}`);
        str = str.replace(nestedObjectRegex, `"$1": ${fixedNestedObject}`);
        match = nestedObjectRegex.exec(str);
    }

    return str;
}
function handleChildData(data, keyData) {
    for (const key of keyData.fields) {
        if (data[key.fieldname] === undefined) {
            data[key.fieldname] = key.defaultValue || null;
        }
        if (key.newName && key.newName !== "") {
            data[key.newName] = data[key.fieldname];
            delete data[key.fieldname];
        }
        if (key.status === 2) {
            delete data[key.fieldname];
        }
    }
}
async function fetchDataForFields(fields, res, data) {

    let dataa = data || [];
    //    console.log("data", data);
    const dataPromises = fields.map(field => {
        let _matchData = { status: 1 }
        const referenceTable = field.referenceTable.split('.');

        let keyData = new Set(dataa.map(x => createObjectId(x[field.fieldname])));
        //        console.log("keyData");
        _matchData[referenceTable.slice(1).join(".")] = { $in: Array.from(keyData) }


        //        console.log("referenceTable", referenceTable.slice(1).join("."));
        const dropdownQuery = [{ $match: _matchData }];

        for (let i = 1; i < referenceTable.length; i++) {
            let path
            if (i !== referenceTable.length - 1) {
                path = referenceTable.slice(1, i + 1).join('.');
                let project = {}
                project[`${path}`] = `$${path}`
                // dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } }, { $project: project });
                dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });
            }

        }


        return model.AggregateFetchData(referenceTable[0], referenceTable[0], dropdownQuery, res)
            .then(result => ({ fieldname: field.fieldname, data: result }));
    });

    const results = await Promise.all(dataPromises);
    const dataObj = results.reduce((obj, item) => {
        obj[item.fieldname] = item.data;
        return obj;
    }, {});
    return dataObj;
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
function filterFieldsWithReference(fields) {
    return fields.filter(field => field.referenceTable !== null);
}

// Function to process each child
async function processChildren(childs, res, data) {
    const processedChildren = [];
    let dataForChild = []
    let dataForSubChild = []
    for (const value of data) {
        for (const child of childs) {
            if (value[child.tableName] !== undefined) {



                const childData = value[child.tableName];
                dataForChild.push(...childData);

                for (const subChild of child.subChild || []) {
                    const subChildData = childData.flatMap(c => c[subChild.tableName] || []);
                    dataForSubChild.push(...subChildData);
                }
            }
        }
    }
    //    console.log("dataForChild", dataForChild);
    //    console.log("dataForSubChild", dataForSubChild);
    // return []
    for (const child of childs) {
        let childField = { ...child };

        // Filter fields and fetch data from reference table in child
        childField.fields = filterFieldsWithReference(childField.fields);// filter the fields with reference table is not null of Child
        childField.dataObj = await fetchDataForFields(childField.fields, res, dataForChild);// fetch the data for the reference table of child and store in dataObj

        // Process subChild if they exist and subChild is an array
        if (childField.subChild && Array.isArray(childField.subChild)) {
            const processedSubChildren = [];
            for (const subChild of childField.subChild) {
                subChild.fields = filterFieldsWithReference(subChild.fields);// filter the fields with reference table is not null of subChild
                subChild.dataObj = await fetchDataForFields(subChild.fields, res, dataForSubChild);// fetch the data for the reference table of subChild and store in dataObj

                processedSubChildren.push(subChild);
            }
            childField.subChild = processedSubChildren;
        }

        processedChildren.push(childField);
    }

    return processedChildren;
}

// Access the Object Nestedly with dot notation dynamicaly
function getNestedProperty(obj, propertyPath) {
    return propertyPath.split('.').reduce((currentObject, key) => {

        return currentObject && currentObject[key] !== undefined ? currentObject[key] : null;
    }, obj);
}
async function validateReference(field, value, model) {
    if (value !== "" && value !== null) {
        const referenceTable = field.referenceTable.split('.');
        let _matchdata = { status: 1, [referenceTable.slice(1).join('.')]: referenceTable[referenceTable.length - 1] == "_id" ? createObjectId(value) : value };
        const dropdownQuery = [{ $match: _matchdata }];

        for (let i = 1; i < referenceTable.length; i++) {
            let path
            if (i !== referenceTable.length - 1) {
                path = referenceTable.slice(1, i + 1).join('.');
                let project = {}
                project[`${path}`] = `$${path}`
                dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });

            }

        }
        // Perform the aggregation query
        let data = await model.AggregateFetchData(referenceTable[0], referenceTable[0], dropdownQuery);

        // Return true if any documents are found, otherwise false
        return data.length > 0;

    }
    else {
        return true
    }
}
function generateAggregationPipeline(inputJson) {
    const pipelines = inputJson.map(config => {
        const {
            currentTable,
            currentColumn,
            referenceTable,
            referenceColumn,
            updateColumn,
            masterName // Added masterTable to the config
        } = config;

        let stages = [];
        let current = currentColumn.split('.')

        if (current.length > 1) {
            //            console.log("current", current);
            current.map((item, index) => {
                index == 1 && stages.push({
                    $unwind: {
                        path: `$${current.slice(0, index).join('.')}`,
                        preserveNullAndEmptyArrays: true
                    }
                })
            })

        }
        // Convert currentColumn to an integer, assuming it's stored as a string
        const convertToIntStage = {
            $set: {
                [currentColumn]: { $toInt: `$${currentColumn}` }
            }
        };
        stages.push(convertToIntStage);

        // Check if masterTable is provided and not empty
        if (masterName) {
            // First $lookup stage to join with tblMasterList
            const lookupMasterListStage = {
                $lookup: {
                    from: "tblMasterList",
                    let: { localId: masterName }, // Adjusted to match your provided query
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$name", "$$localId"]
                                }
                            }
                        }
                    ],
                    as: "tblMasterListdata"
                }
            };

            // $unwind stage for the result of the first lookup
            const unwindMasterListStage = {
                $unwind: {
                    path: "$tblMasterListdata",
                    includeArrayIndex: "string", // Assuming you need the array index
                    preserveNullAndEmptyArrays: true
                }
            };

            // Second $lookup stage to join with tblMasterData
            const lookupMasterDataStage = {
                $lookup: {
                    from: "tblMasterData",
                    let: {
                        localId: `$${currentColumn}`,
                        objectId: { $toString: "$tblMasterListdata._id" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [{ $toInt: "$oldId" }, { $toInt: "$$localId" }] },
                                        { $eq: ["$tblMasterListId", "$$objectId"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                [`${currentColumn}Id`]: "$_id",
                                [`${currentColumn}IdNo`]: "$oldId"
                            }
                        }
                    ],
                    as: "tblMasterDatadata"
                }
            };

            // $unwind stage for the result of the second lookup
            const unwindMasterDataStage = {
                $unwind: {
                    path: "$tblMasterDatadata",
                    preserveNullAndEmptyArrays: true
                }
            };

            // Add the stages related to masterTable processing
            stages.push(lookupMasterListStage, unwindMasterListStage, lookupMasterDataStage, unwindMasterDataStage);
        }
        const referenceColumnParts = referenceColumn.split('.');
        const lastReferenceField = referenceColumnParts.pop(); // Extract the last field for matching
        const nestedPath = referenceColumnParts.join('.'); // Reconstruct the nested path without the last field

        // Generate $unwind stages for each level in the nested path
        const unwindPaths = referenceColumnParts.map((_, index, array) => `$${array.slice(0, index + 1).join('.')}`);

        // Generate $unwind stages for each part of the nested path
        const unwinds = unwindPaths.map(path => ({
            $unwind: {
                path: path,
                preserveNullAndEmptyArrays: true
            }
        }));
        // unwinds.pop(0)
        // Dynamic lookup stage using pipeline
        if (!masterName) {
            const lookupStage = {
                $lookup: {
                    from: referenceTable,
                    let: { localId: `$${currentColumn}` },
                    pipeline: [
                        ...unwinds,
                        {
                            $match: {
                                $expr: {
                                    $eq: [{ $toInt: `$${nestedPath ? nestedPath + '.' : ''}${lastReferenceField}` }, { $toInt: '$$localId' }]
                                }
                            }
                        },
                        {
                            $project: {
                                [`${currentColumn}Id`]: nestedPath ? `$${nestedPath}.${updateColumn}` : `$${updateColumn}`,
                                [`${currentColumn}IdNo`]: nestedPath ? `$${nestedPath}.${lastReferenceField}` : `$${lastReferenceField}`
                            }
                        }
                    ],
                    as: `${referenceTable}data`
                }
            };
            stages.push(lookupStage);
        }


        // Unwind the result of the lookup to process each joined document
        const unwindStage = {
            $unwind: {
                path: `$${referenceTable}data`,
                preserveNullAndEmptyArrays: true
            }
        };

        // Conditionally set the currentColumn to the value of updateColumn from the joined document
        const conditionalSetStage = {
            $set: {
                [currentColumn]: {
                    $ifNull: [
                        { $toString: { $ifNull: [`$${referenceTable}data.${currentColumn}Id`, `$${currentColumn}`] } },
                        null
                    ]
                }
            }
        };

        const project = {
            $project: {
                [`${referenceTable}data`]: 0,
                "tblMasterListdata": 0
            }
        }
        const mergeStage = {
            $merge: {
                into: currentTable, // Specify your target collection here
                on: "_id", // Field(s) to identify the document. Commonly the primary key.
                whenMatched: "replace", // Could be "replace", "keepExisting", "merge", or "fail"
                whenNotMatched: "discard"  // Could be "insert" or "discard"
            }
        };
        // Other stages like conditionalSetStage, project, and mergeStage should be added here similar to your initial function
        stages.push(...[unwindStage, conditionalSetStage,]);
        if (current.length > 1) {
            //            console.log("current", current);
            current.map((item, index) => {
                index == 1 && stages.push(
                    // $unwind: {
                    //     path: `$${current.slice(0, index).join('.')}`,
                    //     preserveNullAndEmptyArrays: true
                    // }
                    {
                        $group: {
                            _id: "$_id",
                            doc: { $first: "$$ROOT" },
                            [`${current.slice(0, index).join('.')}`]: { $push: `$${current.slice(0, index).join('.')}` },
                        },
                    },
                    {
                        $replaceRoot: { newRoot: { $mergeObjects: ["$doc", { [`${current.slice(0, index).join('.')}`]: `$${current.slice(0, index).join('.')}` }] } }
                    },
                )
            })

        }
        stages.push(project, mergeStage);
        // Return the stages for the current configuration
        return stages;
    });

    // Flatten the array of pipelines since `pipelines` is an array of arrays
    return pipelines.flat();
}
function parseDecimalFormat(inputString, value) {
    // Regular expression to match "decimal(m,n)" and capture m and n
    const regex = /decimal\((\d+),(\d+)\)/;
    const matches = inputString.match(regex);

    if (matches) {
        // The first capturing group (\d+) is m, and the second is n
        const m = parseInt(matches[1], 10); // Convert captured strings to integers
        const n = parseInt(matches[2], 10);

        return { success: true, m: m, n: n };
    } else {
        // Return null or throw an error if the format does not match
        // throw Error('Invalid decimal format');
        return { success: false }
    }
}
function createDecimalValidator(m, n) {
    return function (value) {
        const stringValue = value?.toString() || "0";
        //        console.log(stringValue);
        // Calculate the maximum number of digits allowed before the decimal point
        const maxDigitsBeforeDecimal = m - n;
        const parts = stringValue.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] || '';

        const integerPartLength = integerPart.replace('-', '').length; // Remove sign for length check
        const decimalPartLength = decimalPart.length;

        return integerPartLength + decimalPartLength <= m
        // && decimalPartLength <= n;
    };
}
function truncateDecimal(value, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.floor(value * factor) / factor;
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
function paginate(items, pageNumber, pageSize) {
    const startIndex = (pageNumber - 1) * pageSize; // Calculate the starting index
    const endIndex = startIndex + pageSize;         // Calculate the ending index
    return items.slice(startIndex, endIndex);        // Return the slice of items for the current page
}
async function fetchDataForDropdown(dropdownData, model, array, res, sort) {
    let dropdownMatch = { status: 1 };
    // if (typeof dropdownData.dropdownFilter !== "undefined" && dropdownData.dropdownFilter !== null && dropdownData.dropdownFilter !== "") {
    //     //        console.log(JSON.parse(fixJsonLikeString(dropdownData.dropdownFilter)));
    //     // let temp = JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"'));
    //     let temp = JSON.parse(fixJsonLikeString(dropdownData.dropdownFilter));
    //     //        console.log(typeof temp);
    //     Object.assign(dropdownMatch, temp);
    //     //        console.log(dropdownMatch);
    // }
    //    //    dropdownData.dropdownFilter!==null&&console.log("DropdownFilter",JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"')));
    let dropdownQuery = [{ $match: dropdownMatch }];
    // if (dropdownData.referenceTable == "tblMenu") {
    //     let menuData = await model.AggregateFetchData("tblMenu", "tblMenu", [{ $match: { status: Number(process.env.ACTIVE_STATUS) } }], res)
    //     let menuNames = menuData.flatMap(item => extractMenuNames(item))
    //     menuNames = sortJSON(menuNames, "value", sort)
    //     return menuNames
    // }



    let referenceTable = dropdownData.referenceTable.split('.');
    for (let i = 1; i < referenceTable.length; i++) {
        let path = referenceTable.slice(1, i + 1).join('.');
        dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });
    }

    if (dropdownData.referenceColumn) {
        const keys = dropdownData.referenceColumn.split(',');
        const regex = /[\s\W]/;
        const fieldsToConcat = keys.map(key => regex.test(key) ? `${key}` : `$${key.trim()}`);

        dropdownQuery.push({
            $project: {
                id: referenceTable.length == 1 ? "$_id" : `$${referenceTable.slice(1).join('.')}._id`,
                value: { $concat: fieldsToConcat }
            }
        });
    }
    dropdownQuery.push({ $match: { id: { $in: array || [] } } })
    dropdownQuery.push({
        $addFields: {
            upperValue: { $toUpper: "$value" }
        }
    });

    // Then, sort by the new uppercase field
    dropdownQuery.push({
        $sort: { upperValue: sort || 1 }
    });
    // dropdownQuery.push({ $sort: { value: sort || 1 } });

    return await model.AggregateFetchData(referenceTable[0], dropdownData.referenceTable, dropdownQuery, res);
    // return []

}
async function fetchDataForSearch(dropdownData, model, search, req) {
    let dropdownMatch = { status: 1, clientCode: req.clientCode };
    //    console.log(dropdownMatch);
    //    //    dropdownData.dropdownFilter!==null&&console.log("DropdownFilter",JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"')));
    let dropdownQuery = [{ $match: dropdownMatch }];

    let referenceTable = dropdownData.referenceTable !== null ? dropdownData.referenceTable.split('.') : [];
    for (let i = 1; i < referenceTable.length; i++) {
        let path = referenceTable.slice(1, i + 1).join('.');
        dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });
    }
    if (dropdownData.referenceTable == "tblMenu") {
        let menuData = await model.AggregateFetchData("tblMenu", "tblMenu", [{ $match: { status: Number(process.env.ACTIVE_STATUS) } }], req)
        let menuNames = menuData.flatMap(item => extractMenuNames(item))
        let regex = new RegExp(`^${search}`, 'i');
        // menuNames=sortJSON(menuNames,"value",sort)
        return menuNames.filter(item => regex.test(item.value))
    }
    if (dropdownData.referenceColumn) {
        const keys = dropdownData.referenceColumn.split(',');
        const regex = /[\s\W]/;
        const fieldsToConcat = keys.map(key => regex.test(key) ? `${key}` : `$${key.trim()}`);
        dropdownQuery.push({
            $project: {
                id: referenceTable.length == 1 ? "$_id" : `$${referenceTable.slice(1).join('.')}._id`,
                oldId: referenceTable.length == 1 ? "$oldId" : `$${referenceTable.slice(1).join('.')}.oldId`,
                value: { $concat: fieldsToConcat }
            }
        });
    }
    if (search) {
        dropdownQuery.push({ $match: { value: { $regex: `^${search}`, $options: "i" } } })
    }
    // dropdownQuery.push({$limit:100})
    return await model.AggregateFetchData(referenceTable[0], dropdownData.referenceTable, dropdownQuery, req);
}
function sortJSON(jsonArray, field, sortOrder = 1) {
    // return jsonArray.sort((a, b) => {
    //     const rawValueA = a[field];
    //     const rawValueB = b[field];
    //     const valueA = convertToComparable(rawValueA);
    //     const valueB = convertToComparable(rawValueB);

    //     if (sortOrder === 1) {  // Ascending order
    //         return (valueA > valueB) ? 1 : (valueA < valueB) ? -1 : 0;
    //     } else if (sortOrder === -1) {  // Descending order
    //         return (valueA > valueB) ? -1 : (valueA < valueB) ? 1 : 0;
    //     }
    //     // Default case if sortOrder is not 1 or -1, treated as ascending
    //     return (valueA > valueB) ? 1 : (valueA < valueB) ? -1 : 0;
    // });
    return jsonArray.sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Normalize data: remove leading/trailing spaces and prioritize numbers
        valueA = normalizeValue(valueA);
        valueB = normalizeValue(valueB);

        // Comparison logic
        if (valueA < valueB) return sortOrder * -1;
        if (valueA > valueB) return sortOrder * 1;
        return 0;
    });
}
function normalizeValue(value) {
    if (typeof value === 'string') {
        value = value.trim();
        // Check if it's a date string
        const dateValue = Date.parse(value);
        if (!isNaN(dateValue)) {
            return new Date(value);
        }
        // Check if it's a numeric string
        if (!isNaN(value) && value !== '') {
            return parseFloat(value);
        }
        return value.toLowerCase();
    }
    return value;
}

function createCommaSeparatedValues(masterData, datatoBeFetched) {
    // for (let data of masterData){
    //     for (let key of Object.keys(datatoBeFetched) || []) {
    //         const keys = key.split('.');
    //         const topLevelKey = keys[0]; // The dynamic part of the key

    //         // Check if data[topLevelKey] exists and is iterable
    //         if (data[topLevelKey] && typeof data[topLevelKey].forEach === 'function') {
    //             for(let charge of data[topLevelKey]){
    //                 let value = charge;
    //                 for (let i = 1; i < keys.length; i++) {
    //                     if (value[keys[i]]) {
    //                         if (Array.isArray(value[keys[i]])) {
    //                             value[keys[i]].forEach(item => {
    //                                 if (item[keys[i + 1]] !== undefined) {
    //                                     if (!datatoBeFetched[key].hasOwnProperty('add')) {
    //                                         datatoBeFetched[key] = new Set();
    //                                     }
    //                                     datatoBeFetched[key].add(item[keys[i + 1]]);
    //                                 }
    //                             });
    //                         } else {
    //                             value = value[keys[i]];
    //                             if (i === keys.length - 1) {
    //                                 if (!datatoBeFetched[key].hasOwnProperty('add')) {
    //                                     datatoBeFetched[key] = new Set();
    //                                 }
    //                                 datatoBeFetched[key].add(value);
    //                             }
    //                         }
    //                     }
    //                 }
    //             };
    //         }
    //         else {
    //             datatoBeFetched[key].add(data[key])
    //         }
    //     };
    // };

    // Convert sets to arrays or other desired formats before returning
    // Object.keys(datatoBeFetched).forEach(key => {
    //     datatoBeFetched[key] = [...datatoBeFetched[key]];
    // });


    for (let data of masterData) {
        for (let key of Object.keys(datatoBeFetched) || []) {
            const keys = key.split('.');
            const topLevelKey = keys[0]; // The dynamic part of the key

            // Initialize the Set if it doesn't exist
            if (!datatoBeFetched[key]) {
                datatoBeFetched[key] = new Set();
            }

            // Check if data[topLevelKey] exists and is iterable
            if (data[topLevelKey] && typeof data[topLevelKey].forEach === 'function') {
                for (let charge of data[topLevelKey]) {
                    let value = charge;
                    for (let i = 1; i < keys.length; i++) {
                        if (value[keys[i]]) {
                            if (Array.isArray(value[keys[i]])) {
                                value[keys[i]].forEach(item => {
                                    if (item[keys[i + 1]] !== undefined) {
                                        datatoBeFetched[key].add(item[keys[i + 1]]);
                                    }
                                });
                            } else {
                                value = value[keys[i]];
                                if (i === keys.length - 1) {
                                    datatoBeFetched[key].add(value);
                                }
                            }
                        }
                    }
                }
            } else {
                datatoBeFetched[key].add(data[key]);
            }
        }
    }

    return datatoBeFetched;
}
function deleteFileFromPublic(relativeFilePath) {
    // Construct the full file system path
    const fullPath = path.join('public', relativeFilePath);

    // Check if the file exists
    if (fs.existsSync(fullPath)) {
        // Delete the file
        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            //            console.log('File deleted successfully:', fullPath);
        });
    } else {
        //        console.log('File does not exist:', fullPath);
    }
}
function extractIPv4(ip) {
    // Check if the IP has an IPv6 prefix
    if (ip.includes('::ffff:')) {
        ip = ip.split(':').pop(); // Split by ':' and take the last part
    }
    return ip;
}
async function optimizedFetchAndProcess(req, res, gridkeysForSearch, FetchRules, projectionKey, query) {
    try {
        // Filter once and reuse
        const dropdownFields = gridkeysForSearch.filter(field => field.controlname.toLowerCase() === "dropdown");
        const dropdownObj = dropdownFields.find(field => field.fieldname === req.body.label);

        if (dropdownObj) {
            // let query = { status: Number(process.env.ACTIVE_STATUS) }; // Assuming there's some base query logic here
            // Perform a single aggregation query to fetch and process data



            query.push({
                $group: {
                    _id: "$" + req.body.label,
                    documents: { $push: "$$ROOT" }
                }
            })
            let groupedData = await model.AggregateFetchData(req.body.tableName, req.body.tableName, query, res);

            // Flatten the data after grouping
            let temData = groupedData.reduce((acc, group) => acc.concat(group.documents), []);
            let count = temData.length;

            // Set of labels for dropdown data
            let setOfLabel = new Set(temData.map(obj => createObjectId(obj[req.body.label])));

            let dropdownData = await fetchDataForDropdown(dropdownObj, model, Array.from(setOfLabel), res, req.body.order);
            //            console.log("dropdownData", dropdownData[0]);
            let sortOrderMap = new Map(dropdownData.map((item, index) => [item.id.toString(), index]));

            temData.sort((a, b) => {
                let indexA = sortOrderMap.get(a[req.body.label]?.toString());
                let indexB = sortOrderMap.get(b[req.body.label]?.toString());
                if (req.body.order == -1) {
                    indexA = indexA === undefined ? Infinity : indexA;
                    indexB = indexB === undefined ? Infinity : indexB;
                }
                else {
                    // Handle undefined, null, or blank values by assigning them the smallest value
                    indexA = indexA === undefined || a[req.body.label] === "" || a[req.body.label] == null ? -1 : indexA;
                    indexB = indexB === undefined || b[req.body.label] === "" || b[req.body.label] == null ? -1 : indexB;

                    // return indexA - indexB;
                }

                // If index is undefined, assume a large index number to sort these items towards the end


                return indexA - indexB;
            });

            let gridkeys = FetchRules[0].fields.filter(x => x.isGridView === true && x.controlname.toLowerCase() === "dropdown");

            // Binding the data of reference table with main table data
            for (const iterator of gridkeys) {
                let fieldValues = await fetchDataForDropdown(iterator, model, temData.map(obj => createObjectId(obj[iterator.fieldname])), res);
                let valueMap = new Map(fieldValues.map(item => [item.id.toString(), item.value]));

                for (const d of temData) {
                    d[iterator.fieldname] = valueMap.get(d[iterator.fieldname]) || d[iterator.fieldname];
                }
            }

            // Pagination

            temData = paginate(temData, Number(req.body.pageNo), Number(req.body.limit));
            // let lookupDataArray = gridkeysForSearch.filter(x => x.isDummy == true)
            // let lookupValueObject = new Set(temData.map(x => x._id.toString()))
            // for (const item of lookupDataArray) {
            //     let lookupData = await model.AggregateFetchData(item.referenceTable,item.referenceTable, [{ $match: { [`${item.referenceColumn}`]: { $in: Array.from(lookupValueObject) } } }], res)
            //     for (const dataObject of temData) {
            //         dataObject[item.yourlabel]=lookupData.filter(x => x[item.referenceColumn].toString() == dataObject._id.toString())||"No Data"
            //     }
            // }

            return { success: true, data: temData, Count: count };
        }
    } catch (error) {
        console.error("Failed to fetch and process data:", error);
        throw new Error("Failed to fetch and process data");
        //    return res.status(500).send({
        //         success: false,
        //         message: "Failed to process data",
        //         error: error.toString()
        //     });
    }
}






module.exports = {
    // for defining the structure of master
    addSchema: async (req, res) => {
        const validationRule = {
            tableName: "required"
        }
        // Check for validation according to rule
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error....!",
                    data: err
                })
            }
            else {
                try {
                    // Forming the JSON data For Dynamic Schema 
                    let insertData = {}
                    insertData.id = req.body.id || ""
                    insertData.tableName = req.body.tableName,
                        insertData.isDelete = req.body.isDelete
                    if (Array.isArray(req.body.fields)) {
                        insertData.fields = req.body.fields
                    }
                    else {
                        insertData.fields = JSON.parse(req.body.fields)
                    }
                    insertData.child = req.body.child
                    insertData.fields = req.body.fields
                    insertData.updatedBy = req.body.updatedBy || null
                    insertData.createdBy = req.body.createdBy || null
                    insertData.status = req.body.status || 1
                    // insertData.updatedDate = new Date(req.body.updatedDate)|| new Date()
                    insertData.indexes = req.body.indexes || null
                    // Check for Chidren Exist or Not
                    for (let field of insertData.fields) {
                        let validateField = insertData.fields.filter(f => f.fieldname === field.fieldname)
                        if (validateField.length > 1) {
                            return res.status(403).send({
                                success: false,
                                message: "Duplicate Field Name Found....!",
                                data: field.fieldname
                            })
                        }
                    }
                    if (Array.isArray(req.body.child)) {
                        insertData.child = req.body.child
                        for (const childData of insertData.child) {
                            for (const childField of childData.fields) {
                                let validateField = childData.fields.filter(f => f.fieldname === childField.fieldname)
                                if (validateField.length > 1) {
                                    return res.status(403).send({
                                        success: false,
                                        message: "Duplicate Field Name Found....!",
                                        data: `${childData.tableName}.${childField.fieldname}`
                                    })
                                }

                            }
                            for (const subChild of childData.subChild) {
                                for (const subChildField of subChild.fields) {
                                    let validateField = subChild.fields.filter(f => f.fieldname === subChildField.fieldname)
                                    if (validateField.length > 1) {
                                        //const statusCode = 403;
                                        // const errorMessage = await Msgmodel.handleMessage(statusCode);
                                        return res.status(403).send({
                                            success: false,
                                            message: "Duplicate Field Name Found....!",
                                            data: `${childData.tableName}.${subChild.tableName}.${subChildField.fieldname}`
                                        })
                                    }
                                }

                            }
                        }
                    }
                    else {
                        // if not exist then create
                        insertData.child = []
                    }
                    // Checking the is their any key for rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in Child and subchild
                    let findChildAndSubchild = findFieldWithNewName(insertData.child)
                    // Checking the is their any key for rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in parent
                    let findparent = findFieldWithNewName([insertData])
                    // if Below Condition is true then it means there is any key to rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in Child and subchild and parent
                    if (findChildAndSubchild !== null || findparent !== null) {
                        if (connection.models[req.body.tableName]) {
                            delete connection.models[req.body.tableName];
                            // delete connection.modelSchemas[req.body.tableName];
                        }

                        let modell = connection.model(req.body.tableName, Schema.any);
                        if (connection.models[req.body.tableName]) {
                            modell = connection.models[req.body.tableName] = connection.model(req.body.tableName, Schema.any);

                        }
                        let _unset = {};
                        let collectionData = await model.AggregateFetchData(req.body.tableName, req.body.tableName, [{ $match: { status: 1 } }], res);

                        for (const cd of collectionData) {
                            if (findparent !== null) {
                                for (const key of insertData.fields) {
                                    if (cd[key.fieldname] === undefined) {
                                        cd[key.fieldname] = key.defaultValue || null;
                                    }
                                    if (key.newName && key.newName !== "") {
                                        cd[key.newName] = cd[key.fieldname];
                                        _unset[key.fieldname] = "";
                                        delete cd[key.fieldname];
                                    }
                                    if (key.status === 2) {
                                        _unset[key.fieldname] = "";
                                    }
                                }
                            }

                            if (findChildAndSubchild !== null) {
                                for (const childKey of insertData.child) {
                                    const childTableName = childKey.tableName;
                                    if (cd[childTableName]) {
                                        for (const childData of cd[childTableName]) {
                                            handleChildData(childData, childKey);// This function will handle the key rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in Child
                                        }
                                    }
                                    // Handling subChild
                                    for (const sc of childKey.subChild) {
                                        const subChildTableName = sc.tableName;
                                        if (cd[childTableName]) {
                                            for (const childData of cd[childTableName]) {
                                                if (childData[subChildTableName]) {
                                                    for (const scd of childData[subChildTableName]) {
                                                        handleChildData(scd, sc);// This function will handle the key rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in subChild
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            //                            console.log(cd);
                            await modell.updateOne({ _id: cd._id }, cd);// Update records in the collection
                        }


                        if (Object.keys(_unset).length > 0) {
                            await modell.updateMany({}, { $unset: _unset });// unset the keys in case of parents
                        }
                    }

                    // Changing the field names and deleting fields in Parent, child and subchild  to update the master Schema
                    insertData.fields.map((key) => {
                        key.newName && key.newName !== "" ? key.fieldname = key.newName : null
                    })
                    insertData.child.map((key) => {
                        key.fields.map((key) => {
                            key.newName && key.newName !== "" ? key.fieldname = key.newName : null
                        })
                        key.subChild.map((key) => {
                            key.fields.map((key) => {
                                key.newName && key.newName !== "" ? key.fieldname = key.newName : null
                            })
                        })
                    })


                    // res.send({ success: true, data: insertData })
                    // return
                    let isValidate = await model.validateBeforeSubmit(req.body); // check custom validation
                    if (isValidate.validation) {

                        let data = await model.updateIfAvailableElseInsert("master_schema", "master_schema", insertData, { tableName: req.body.tableName, ip: extractIPv4(req.ip || req.connection.remoteAddress) }, res)
                        data ? res.send({ success: true, message: "Data inserted successfully....", data: data }) : res.status(500).send({ success: false, message: "Data not inserted Successfully..." })
                    }
                    else {
                        // validation failed logic and msg
                        res.status(500).send({
                            success: false,
                            message: isValidate.msg,
                            data: data
                        })
                    }
                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({
                        success: false,
                        message: "Something went wrong...",
                        data: error.message
                    })
                }
            }
        })

    },

    listSchema: async (req, res) => {
        try {
            let _matchdata = {
                status: 1
            }
            if (req.query.id) {
                _matchdata['id'] = Number(req.query.id)
            }
            let query = [
                {
                    $match: _matchdata
                },
                {
                    $project: {
                        _id: 1,
                        id: 1,
                        status: 1,
                        __v: 1,
                        add_by: 1,
                        add_dt: 1,
                        child: {
                            $map: {
                                input: "$child",
                                as: "child",
                                in: {
                                    tableName: "$$child.tableName",
                                    _id: "$$child._id",
                                    fields: {
                                        $filter: {
                                            input: "$$child.fields",
                                            as: "field",
                                            cond: { $eq: ["$$field.status", 1] }
                                        }
                                    },
                                    subChild: {
                                        $map: {
                                            input: "$$child.subChild",
                                            as: "subChild",
                                            in: {
                                                tableName: "$$subChild.tableName",
                                                _id: "$$subChild._id",
                                                fields: {
                                                    $filter: {
                                                        input: "$$subChild.fields",
                                                        as: "subField",
                                                        cond: { $eq: ["$$subField.status", 1] }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        fields: {
                            $filter: {
                                input: "$fields",
                                as: "field",
                                cond: { $eq: ["$$field.status", 1] }
                            }
                        },
                        tableName: 1,
                        updated_by: 1,
                        updated_dt: 1,
                        indexes: 1
                    }
                }
            ]
            let result = await model.AggregateFetchData("master_schema", "master_schema", query, res)
            result.length > 0 ? res.send({ success: true, message: "Master Record fetched", data: result }) : res.status(200).send({
                success: false, message: "No data Found....!", data: []
            })
        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "Something went Wrong....!",
                data: error.message
            })
        }
    },

    // to Insert values in mastrers
    createMaster: async (req, res) => {

        try {
            const validationRule = {

            }
            if (req.body.id && req.body.id != undefined && req.body.id !== "") {


            }
            else {
                validationRule.tableName = "required"
            }
            if (Array.isArray(req.body)) {
                const records = req.body
                // let finalerror = []
                // let finaldata = []
                let query = [
                    {
                        $match: {
                            tableName: req.body[0].tableName,
                            status: Number(process.env.ACTIVE_STATUS)
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            id: 1,
                            status: 1,
                            __v: 1,
                            add_by: 1,
                            add_dt: 1,
                            child: {
                                $map: {
                                    input: "$child",
                                    as: "child",
                                    in: {
                                        tableName: "$$child.tableName",
                                        _id: "$$child._id",
                                        fields: {
                                            $filter: {
                                                input: "$$child.fields",
                                                as: "field",
                                                cond: { $eq: ["$$field.status", 1] }
                                            }
                                        },
                                        subChild: {
                                            $map: {
                                                input: "$$child.subChild",
                                                as: "subChild",
                                                in: {
                                                    tableName: "$$subChild.tableName",
                                                    _id: "$$subChild._id",
                                                    fields: {
                                                        $filter: {
                                                            input: "$$subChild.fields",
                                                            as: "subField",
                                                            cond: { $eq: ["$$subField.status", 1] }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            fields: {
                                $filter: {
                                    input: "$fields",
                                    as: "field",
                                    cond: { $eq: ["$$field.status", 1] }
                                }
                            },
                            tableName: 1,
                            updated_by: 1,
                            updated_dt: 1,
                            indexes: 1
                        }
                    }
                ]

                let dataForValidation = await model.AggregateFetchData("master_schema", "master_schema", query, res)// Fethching the data from master schema

                if (dataForValidation.length == 0) {
                    // Creating Dynamic Validation Rules according to master schema data
                    return res.status(403).send({
                        success: false,
                        message: "Schema Not Found",
                        data: []
                    })
                }
                let insertData = {
                    id: { type: Number, required: true, default: 0 },
                    status: { type: Number, required: true, default: 1 },
                    createdDate: { type: Date, required: true, default: Date.now() },
                    createdBy: { type: String, required: false, default: req.logged_in_id },
                    updatedDate: { type: Date, required: true, default: Date.now() },
                    updatedBy: { type: String, required: false, default: null },
                    companyId: { type: String, required: false, default: req.body.companyId || null },
                    brachId: { type: String, required: false, default: req.body.branchName || null },
                    defaultFinYearId: { type: String, required: false, default: req.body.defaultFinYearId || null },
                    clientCode: { type: String, required: false, default: req.clientCode || null },
                }
                dataForValidation[0].fields.forEach((field) => {
                    let properties = {
                        required: field.isRequired,
                        default: field.defaultValue
                    }
                    field.type.toLowerCase() == "string" ? properties.type = String : null
                    field.type.toLowerCase() == "number" ? properties.type = Number : null
                    field.type.toLowerCase() == "file" ? properties.type = String : null
                    field.type.toLowerCase() == "date" ? properties.type = Date : null
                    field.type.toLowerCase() == "boolean" ? properties.type = Boolean : null
                    field.isUnique && field.isUnique ? properties.unique = true : null
                    field.index && field.index == 1 ? properties.index = 'asc' : null
                    if (field.referenceTable !== null) {
                        properties.ref = field.referenceTable
                        properties.validate = {
                            validator: async (value) => {
                                return await validateReference(field, value, model);

                                // return checkDocumentExists(this[field.fieldname].ref,value)
                            },
                            message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`
                        }

                    }
                    if (parseDecimalFormat(field.type).success == true) {
                        properties.type = Number
                        properties.set = function (value) {
                            // Assuming you want to keep 2 decimal places
                            return truncateDecimal(value, parseDecimalFormat(field.type).n);
                        }
                        properties.validate = {
                            validator: (value) => {
                                return createDecimalValidator(parseDecimalFormat(field.type).m, parseDecimalFormat(field.type).n)(value)
                            },
                            message: `Value of ${field.fieldname} is not valid decimal format`
                        }

                    }
                    insertData[field.fieldname] = properties
                });
                // Creating the JSON of Child to insert into the master
                dataForValidation[0].child.forEach((child) => {
                    insertData[child.tableName] = [{}]

                    child.fields.forEach((field) => {

                        let properties = {
                            required: field.isRequired,
                            default: field.defaultValue
                        }
                        field.type.toLowerCase() == "string" ? properties.type = String : null
                        field.type.toLowerCase() == "number" ? properties.type = Number : null
                        field.type.toLowerCase() == "date" ? properties.type = Date : null
                        field.type.toLowerCase() == "boolean" ? properties.type = Boolean : null
                        // field.isUnique && field.isUnique ? properties.unique = true : null
                        if (parseDecimalFormat(field.type).success == true) {
                            properties.type = Number,
                                properties.set = function (value) {
                                    // Assuming you want to keep 2 decimal places
                                    return truncateDecimal(value, parseDecimalFormat(field.type).n);
                                }
                            properties.validate = {
                                validator: (value) => {
                                    return createDecimalValidator(parseDecimalFormat(field.type).m, parseDecimalFormat(field.type).n)(value)
                                },
                                message: `Value of ${field.fieldname} is not valid decimal format`
                            }

                        }
                        if (field.isUnique && field.isUnique) {
                            properties.validate = {
                                validator: function (value) {
                                    //                                    // console.log("this parent",this.parent());
                                    // Assuming `this.parent()` refers to the parent array (`fields`)
                                    const fieldsArray = this.parent()[child.tableName];
                                    // Count occurrences of `value` in `fieldname`s of the `fieldsArray`
                                    const occurrences = fieldsArray.filter(item => item[field.fieldname] === value).length;
                                    // Validation passes if there's only one occurrence (the current field itself)
                                    return occurrences === 1;
                                },
                                message: props => `${props.value} is not unique within the fields array`
                            }
                        }
                        if (field.referenceTable !== null) {
                            properties.ref = field.referenceTable
                            properties.validate = {
                                validator: async (value) => {
                                    return await validateReference(field, value, model);

                                    // return checkDocumentExists(this[field.fieldname].ref,value)
                                },
                                message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`
                            }

                        }
                        insertData[child.tableName][0][field.fieldname] = properties
                    })
                    child.subChild.forEach((subChild) => {
                        insertData[child.tableName][0][subChild.tableName] = [{}]
                        subChild.fields.forEach((field) => {
                            let properties = {
                                required: field.isRequired,
                                default: field.defaultValue
                            }
                            field.type.toLowerCase() == "string" ? properties.type = String : null
                            field.type.toLowerCase() == "number" ? properties.type = Number : null
                            field.type.toLowerCase() == "date" ? properties.type = Date : null
                            field.type.toLowerCase() == "boolean" ? properties.type = Boolean : null
                            // field.isUnique && field.isUnique ? properties.unique = true : null
                            if (field.isUnique && field.isUnique) {
                                properties.validate = {
                                    validator: function (value) {
                                        //                                        console.log("this parent", this.parent());
                                        // return true
                                        // Assuming `this.parent()` refers to the parent array (`fields`)
                                        const fieldsArray = this.parent()[subChild.tableName];
                                        // Count occurrences of `value` in `fieldname`s of the `fieldsArray`
                                        const occurrences = fieldsArray.filter(item => item[field.fieldname] === value).length;
                                        // Validation passes if there's only one occurrence (the current field itself)
                                        return occurrences === 1;
                                    },
                                    message: props => `${props.value} is not unique within the fields array For ${subChild.tableName}`
                                }

                            }
                            if (parseDecimalFormat(field.type).success == true) {
                                properties.type = Number
                                properties.set = function (value) {
                                    // Assuming you want to keep 2 decimal places
                                    return truncateDecimal(value, parseDecimalFormat(field.type).n);
                                }
                                properties.validate = {
                                    validator: (value) => {
                                        return createDecimalValidator(parseDecimalFormat(field.type).m, parseDecimalFormat(field.type).n)(value)
                                    },
                                    message: `Value of ${field.fieldname} is not valid decimal format`
                                }

                            }
                            if (field.referenceTable !== null) {
                                properties.ref = field.referenceTable
                                properties.validate = {
                                    validator: async (value) => {
                                        return await validateReference(field, value, model);

                                        // return checkDocumentExists(this[field.fieldname].ref,value)
                                    },
                                    message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`
                                }

                            }
                            insertData[child.tableName][0][subChild.tableName][0][field.fieldname] = properties
                            //                            // console.log(insertData[child.tableName][0][subChild.tableName][0]);
                        })
                    })
                    //                    // console.log(insertData[child.tableName][0]);
                });
                //                //console.log(insertData);



                let data = await model.updateIfAvailableElseInsertMasterBulk(req.body[0].tableName, insertData, req.body, res)
                const validationResponse = await model.validateAfterInsert(req.body[0].tableName, req.body.clientId, data);

                //                console.log(validationResponse.success);
                //                console.log("validationResponse.success.................................");
                if (validationResponse.success == true) {
                    return res.send({
                        success: data.success,
                        message: data.message,
                        data: data.data,
                        error: data.error
                    })

                } else {
                    // console.log("565656666666666")
                    // If validation fails, rollback the transaction
                    // await session.abortTransaction();
                    // session.endSession();

                    res.status(400).send({
                        success: false,
                        message: validationResponse.message,
                        data: null
                    });

                }

            }
            //            console.log(validationRule);
            // Check For the validation of Table Name if table name exists then else condition will be executed
            validate(req.body, validationRule, {}, async (err, status) => {
                if (!status) {
                    res.status(403).send({

                        success: false,
                        Message: "Validation Error...!",
                        data: err
                    }
                    )
                }
                else {
                    // Aggregate query to fetch the schema from the master_Schema
                    try {
                        let query = [
                            {
                                $match: {
                                    tableName: req.body.tableName,
                                    status: Number(process.env.ACTIVE_STATUS)
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    id: 1,
                                    status: 1,
                                    __v: 1,
                                    add_by: 1,
                                    add_dt: 1,
                                    child: {
                                        $map: {
                                            input: "$child",
                                            as: "child",
                                            in: {
                                                tableName: "$$child.tableName",
                                                _id: "$$child._id",
                                                fields: {
                                                    $filter: {
                                                        input: "$$child.fields",
                                                        as: "field",
                                                        cond: { $eq: ["$$field.status", 1] }
                                                    }
                                                },
                                                subChild: {
                                                    $map: {
                                                        input: "$$child.subChild",
                                                        as: "subChild",
                                                        in: {
                                                            tableName: "$$subChild.tableName",
                                                            _id: "$$subChild._id",
                                                            fields: {
                                                                $filter: {
                                                                    input: "$$subChild.fields",
                                                                    as: "subField",
                                                                    cond: { $eq: ["$$subField.status", 1] }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    fields: {
                                        $filter: {
                                            input: "$fields",
                                            as: "field",
                                            cond: { $eq: ["$$field.status", 1] }
                                        }
                                    },
                                    tableName: 1,
                                    updated_by: 1,
                                    updated_dt: 1,
                                    indexes: 1
                                }
                            }
                        ]

                        let dataForValidation = await model.AggregateFetchData("master_schema", "master_schema", query, res)// Fethching the data from master schema
                        let ValidationRules_for_tables = {}
                        if (dataForValidation.length > 0) {
                            // Creating Dynamic Validation Rules according to master schema data
                            dataForValidation[0].fields.map((validation) => {
                                validation.isRequired == true ? ValidationRules_for_tables[validation.fieldname] = "required" : ""
                            })
                            // Validating the Dynamic Validation Rules according to master schema if validation is true then else condition will be executed
                            validate(req.body, ValidationRules_for_tables, {}, async (err, status) => {
                                if (!status) {
                                    res.status(403).send({
                                        success: false,
                                        Message: "Validation Error...!",
                                        data: err
                                    })
                                }
                                else {
                                    try {
                                        let todays_dt = moment().format("YYYY-MM-DD HH:mm:ss")
                                        if ((!req.body.id || req.body.id == 0 || req.body.id == "0" || req.body.id == "undefined" || req.body.id == "") && req.body.isNoGenerate == true) {

                                            await GenerateNumber(req, res);

                                        }
                                        //                                        // console.log("req.body.jobNo", req.body.jobNo);
                                        const insertData = {
                                            id: req.body.id || '',
                                            createdDate: todays_dt,
                                            isDelete: req.body.isDelete,
                                            tableName: req.body.tableName,
                                            // createdBy: req.logged_in_id,
                                            status: Number(req.body.status) || Number(process.env.ACTIVE_STATUS),
                                            updatedDate: todays_dt,
                                            updatedBy: req.logged_in_id,
                                            // companyId: req.body.companyName,
                                            // brachId: req.body.brachName,
                                            // defaultFinYearId: req.body.defaultFinYearId,
                                            clientCode: req.clientCode,
                                            attachment: Array.isArray(req.body.attachment) ? req.body.attachment : [],
                                            loginCompany: req.body.loginCompany,
                                            loginBranch: req.body.loginBranch,
                                            loginfinYear: req.body.loginfinYear
                                        };
                                        let schemaObj = {
                                            id: { type: Number, required: true, default: 0 },
                                            status: { type: Number, required: true, default: 1 },
                                            createdDate: { type: Date, required: true, default: Date.now() },
                                            createdBy: { type: String, required: false, default: req.logged_in_id },
                                            updatedDate: { type: Date, required: true, default: Date.now() },
                                            updatedBy: { type: String, required: false, default: null },
                                            // companyId: { type: String, required: false, default: null },
                                            // brachId: { type: String, required: false, default: null },
                                            // defaultFinYearId: { type: String, required: false, default: null },
                                            clientCode: { type: String, required: false, default: null },

                                            attachment: [{ path: { type: String, required: false, default: null }, status: { type: Number, required: false, default: 1 } }],

                                            loginCompany: { type: String, required: false, default: null },
                                            loginBranch: { type: String, required: false, default: null },
                                            loginfinYear: { type: String, required: false, default: null }

                                        }
                                        let responseSent = false; // Flag to indicate a response has been sent
                                        let message = ""
                                        for (const field of dataForValidation[0].fields) {
                                            if (field.type.toLowerCase() == "file") {
                                                //                                                // console.log("getFolderSize", getFolderSize(`./public/api/images`));
                                                // if (getFolderSize(`./public/api/images`) >= maxAllowedSizeInBytes) {
                                                //     responseSent = true; // Update flag since response is being sent
                                                //     message += 'Your storage capacity has surpassed the 1GB limit. Kindly consider upgrading your plan.'


                                                // } else {
                                                //     if (req.files && req.files[field.fieldname]) {
                                                //         const file = req.files[field.fieldname]; // Adjust the field name based on your form
                                                //         const allowedExtensions = /\.(png|jpg|jpeg|pdf|doc|xls|txt)$/i;

                                                //         // Check file extension
                                                //         if (!allowedExtensions.test(file.name)) {
                                                //             responseSent = true; // Update flag since response is being sent

                                                //             message += 'Sorry, the file type you provided is invalid. Please upload a file with one of the following extensions: .png, .jpg, .jpeg, .pdf, .doc, .xls, .txt.'

                                                //             break; // Break out of the loop
                                                //         }
                                                //         // Check file size
                                                //         else if (file.size > 1024 * 1024) { // 1MB in bytes
                                                //             responseSent = true; // Update flag since response is being sent

                                                //             message += 'The file size exceeds the maximum limit of 1MB.'

                                                //             break; // Break out of the loop
                                                //         }

                                                //         var element = req.files[field.fieldname];
                                                //         var image_name = moment().format("YYYYMMDDHHmmss") + element.name;
                                                //         element.mv(`./public/api/images/` + image_name.trim());
                                                //         insertData[field.fieldname] = image_name; // Store the processed file name
                                                //     }
                                                // }

                                            } else {
                                                insertData[field.fieldname] = req.body[field.fieldname] || field.defaultValue;
                                            }
                                            let properties = {
                                                required: field.isRequired,
                                                default: field.defaultValue
                                            }
                                            field.type.toLowerCase() == "string" ? properties.type = String : null
                                            field.type.toLowerCase() == "number" ? properties.type = Number : null
                                            field.type.toLowerCase() == "date" ? properties.type = Date : null
                                            field.type.toLowerCase() == "file" ? properties.type = String : null
                                            field.type.toLowerCase() == "boolean" ? properties.type = Boolean : null

                                            if (parseDecimalFormat(field.type).success == true) {
                                                properties.type = Number
                                                properties.set = function (value) {
                                                    // Assuming you want to keep 2 decimal places
                                                    return truncateDecimal(value, parseDecimalFormat(field.type).n);
                                                }
                                                properties.validate = {
                                                    validator: (value) => {
                                                        return createDecimalValidator(parseDecimalFormat(field.type).m, parseDecimalFormat(field.type).n)(value)
                                                    },
                                                    message: `Value of ${field.fieldname} is not valid decimal format.`
                                                }

                                            }
                                            field.isUnique && field.isUnique ? properties.unique = true : null
                                            field.index && field.index == 1 ? properties.index = 'asc' : null
                                            if (field.referenceTable !== null) {
                                                properties.ref = field.referenceTable
                                                properties.validate = {
                                                    validator: async (value) => {
                                                        return await validateReference(field, value, model);

                                                        // return checkDocumentExists(this[field.fieldname].ref,value)
                                                    },
                                                    message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`
                                                }

                                            }
                                            schemaObj[field.fieldname] = properties
                                        }

                                        // After the loop, you need to check if a response has already been sent before continuing
                                        if (responseSent) {
                                            res.status(400).send({
                                                success: false,
                                                message: message,
                                                data: []
                                            })
                                            // Continue with your remaining code logic here...
                                            // This part will only execute if no response has been sent during the loop
                                        } else {

                                            // Junk Code Please don't use it

                                            dataForValidation[0].child.forEach((child) => {

                                                insertData[child.tableName] = req.body[child.tableName] || []
                                                // insertData[child.tableName] = (req.body[child.tableName] || []).map((values) => {
                                                // const tempObject = { isChecked: values?.isChecked };

                                                // child.fields.forEach((child_fields) => {
                                                //     tempObject[child_fields.fieldname] = values[child_fields.fieldname] || child_fields.defaultValue;
                                                // });
                                                // Creating the JSON of SubChild to insert into the master
                                                // // child.subChild.forEach((subChild) => {
                                                // //     tempObject[subChild.tableName] = (values[subChild.tableName] || []).map((values) => {
                                                // //         const subChildObject = { isChecked: values?.isChecked };
                                                // //         subChild.fields.forEach((subChild_fields) => {
                                                // //             subChildObject[subChild_fields.fieldname] = values[subChild_fields.fieldname] || subChild_fields.defaultValue;
                                                // //         });
                                                // //         return subChildObject;
                                                // //     });
                                                // })



                                                // return tempObject;
                                                // });
                                            });



                                            // dynamic schema validation
                                            dataForValidation[0].child.forEach((child) => {
                                                schemaObj[child.tableName] = [{ isChecked: { type: Boolean, default: true } }];

                                                child.fields.forEach((field) => {

                                                    let properties = {
                                                        required: field.isRequired,
                                                        default: field.defaultValue
                                                    }
                                                    field.type.toLowerCase() == "string" ? properties.type = String : null
                                                    field.type.toLowerCase() == "number" ? properties.type = Number : null
                                                    field.type.toLowerCase() == "date" ? properties.type = Date : null
                                                    field.type.toLowerCase() == "boolean" ? properties.type = Boolean : null
                                                    // field.isUnique && field.isUnique ? properties.unique = true : null
                                                    if (field.referenceTable !== null) {
                                                        properties.ref = field.referenceTable
                                                        properties.validate = {
                                                            validator: async (value) => {
                                                                return await validateReference(field, value, model);

                                                                // return checkDocumentExists(this[field.fieldname].ref,value)
                                                            },
                                                            message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`
                                                        }

                                                    }
                                                    if (parseDecimalFormat(field.type).success == true) {
                                                        properties.type = Number
                                                        properties.set = function (value) {
                                                            // Assuming you want to keep 2 decimal places
                                                            return truncateDecimal(value, parseDecimalFormat(field.type).n);
                                                        }
                                                        properties.validate = {
                                                            validator: (value) => {
                                                                return createDecimalValidator(parseDecimalFormat(field.type).m, parseDecimalFormat(field.type).n)(value)
                                                            },
                                                            message: `Value of ${field.fieldname} is not valid decimal format`
                                                        }

                                                    }
                                                    if (field.isUnique && field.isUnique) {
                                                        properties.validate = {
                                                            validator: function (value) {
                                                                //                                                                // console.log("this parent",this.parent());
                                                                // Assuming `this.parent()` refers to the parent array (`fields`)
                                                                const fieldsArray = this.parent()[child.tableName];
                                                                // Count occurrences of `value` in `fieldname`s of the `fieldsArray`
                                                                const occurrences = fieldsArray.filter(item => item[field.fieldname] === value).length;
                                                                // Validation passes if there's only one occurrence (the current field itself)
                                                                return occurrences === 1;
                                                            },
                                                            message: props => `${props.value} is not unique within the fields array`
                                                        }
                                                    }
                                                    schemaObj[child.tableName][0][field.fieldname] = properties
                                                })
                                                child.subChild.forEach((subChild) => {
                                                    schemaObj[child.tableName][0][subChild.tableName] = [{ isChecked: { type: Boolean, default: true } }];
                                                    subChild.fields.forEach((field) => {
                                                        let properties = {
                                                            required: field.isRequired,
                                                            default: field.defaultValue
                                                        }

                                                        field.type.toLowerCase() == "string" ? properties.type = String : null
                                                        field.type.toLowerCase() == "number" ? properties.type = Number : null
                                                        field.type.toLowerCase() == "date" ? properties.type = Date : null
                                                        field.type.toLowerCase() == "boolean" ? properties.type = Boolean : null

                                                        // field.isUnique && field.isUnique ? properties.unique = true : null
                                                        if (field.referenceTable !== null) {
                                                            properties.ref = field.referenceTable
                                                            properties.validate = {
                                                                validator: async (value) => {
                                                                    return await validateReference(field, value, model);

                                                                    // return checkDocumentExists(this[field.fieldname].ref,value)
                                                                },
                                                                message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`
                                                            }

                                                        }
                                                        if (parseDecimalFormat(field.type).success == true) {
                                                            properties.type = Number
                                                            properties.set = function (value) {
                                                                // Assuming you want to keep 2 decimal places
                                                                return truncateDecimal(value, parseDecimalFormat(field.type).n);
                                                            }
                                                            properties.validate = {
                                                                validator: (value) => {
                                                                    return createDecimalValidator(parseDecimalFormat(field.type).m, parseDecimalFormat(field.type).n)(value)
                                                                },
                                                                message: `Value of ${field.fieldname} is not valid decimal format`
                                                            }

                                                        }
                                                        if (field.isUnique && field.isUnique) {
                                                            properties.validate = {
                                                                validator: function (value) {
                                                                    //                                                                    console.log("this parent", this.parent());
                                                                    // return true
                                                                    // Assuming `this.parent()` refers to the parent array (`fields`)
                                                                    const fieldsArray = this.parent()[subChild.tableName];
                                                                    // Count occurrences of `value` in `fieldname`s of the `fieldsArray`
                                                                    const occurrences = fieldsArray.filter(item => item[field.fieldname] === value).length;
                                                                    // Validation passes if there's only one occurrence (the current field itself)
                                                                    return occurrences === 1;
                                                                },
                                                                message: props => `${props.value} is not unique within the fields array For ${subChild.tableName}`
                                                            }

                                                        }
                                                        schemaObj[child.tableName][0][subChild.tableName][0][field.fieldname] = properties
                                                        //                                                        // console.log(insertData[child.tableName][0][subChild.tableName][0]);
                                                    })
                                                })
                                                //                                                // console.log(insertData[child.tableName][0]);
                                            });

                                            let isValidate = await model.validateBeforeSubmit(req.body); // check custom validation

                                            if (isValidate.validation) {
                                                //                                                console.log(schemaObj);
                                                //console.log("Omkar Fina",result);
                                                let result = await model.updateIfAvailableElseInsertMaster(req.body.tableName, schemaObj, insertData, { tableName: req.body.tableName, ip: extractIPv4(req.ip || req.connection.remoteAddress) }, req.body.menuID, res)
                                                ///
                                                if (result) {

                                                    insertData.attachment.filter((e) => e.status == 2).forEach((element) => {
                                                        deleteFileFromPublic(element.path)
                                                    })
                                                    // Perform post-insert validation
                                                    const validationResponse = await model.validateAfterInsert(req.body.tableName, req.body.clientId, result);

                                                    console.log(validationResponse.success);
                                                    //                                                    console.log('ggggggggggggggggggggg222222222222222222 resultresultresultresult2')
                                                    if (validationResponse.success == true) {
                                                        // If validation is successful, commit the transaction
                                                        // await session.commitTransaction();
                                                        // session.endSession();

                                                        res.send({
                                                            success: true,
                                                            message: "Submit Successfully..!",
                                                            data: result
                                                        });

                                                    } else {
                                                        //                                                        console.log("565656666666666")
                                                        // If validation fails, rollback the transaction
                                                        // await session.abortTransaction();
                                                        // session.endSession();

                                                        res.status(400).send({
                                                            success: false,
                                                            message: validationResponse.message,
                                                            data: null
                                                        });
                                                    }
                                                }
                                            }
                                            else {
                                                // validation failed logic and msg
                                                res.status(400).send({
                                                    success: false,
                                                    message: isValidate.msg,
                                                    data: data
                                                })
                                            }
                                        }

                                        // Creating the JSON of Child to insert into the master


                                    } catch (error) {
                                        res.status(500).send({
                                            success: false,
                                            message: "Post-insert validation and deletion failed",
                                            data: error.message
                                        })
                                    }
                                }
                            })
                        }
                        else {
                            res.status(403).send({
                                success: false,
                                message: "Schema Not Found",
                                data: []
                            })
                        }
                    } catch (error) {
                        res.status(500).send({
                            success: false,
                            message: "something Went Wrong...!",
                            data: error.message
                        })
                    }

                }
            })
        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "something Went Wrong...!",
                data: error.message
            })
        }
    },
    DynamicTableList: async (req, res) => {
        try {
            const validationRule = { tableName: "required" };
            // validate for validation according to validationRule
            validate(req.body, validationRule, {}, async (err, status) => {
                if (!status) {
                    return res.status(403).send({ success: false, message: "Validation Error...!", data: err });
                }
                try {
                    let pageNo = parseInt(req.body.pageNo, 10) || 1; // Default to page 1 if not specified
                    let limit = parseInt(req.body.limit, 10) || 10; // Default to 10 items per page if not specified
                    let _matchdata = { status: Number(process.env.ACTIVE_STATUS) }
                    //if req.body.id is not null or undefined or empty then the result will be filtered on the basis of id
                    if (req.body.id && req.body.id != "undefined" && req.body.id !== "") {
                        _matchdata['id'] = Number(req.body.id)
                    }
                    if (req.body.search && req.body.search != "undefined" && req.body.search !== "") {
                        Object.keys(req.body.search).map(key => {
                            _matchdata[key] = new RegExp(req.body.search[key], 'i')
                        })
                        // _matchdata['$or'] = [{ id: { $regex: req.body.search, $options: 'i' } }, { tableName: { $regex: req.body.search, $options: 'i' } }]
                        // Object.assign(_matchdata, req.body.search)
                    }
                    //                    console.log(_matchdata);
                    let query = [{ $match: _matchdata },];
                    let ProjectQuery = {}
                    if (req.body.projection && req.body.projection != "undefined" && req.body.projection !== "" && typeof req.body.projection == "object") {
                        let projectionKey = Object.keys(req.body.projection)
                        let projectionValue = req.body.projection
                        for (let index = 0; index < projectionKey.length; index++) {

                            ProjectQuery[projectionKey[index]] = projectionValue[projectionKey[index]]
                            if (projectionKey.length - 1 == index) {
                                query.push({ $project: ProjectQuery })

                            }
                        }


                    }
                    if (req.body.label && req.body.label != "undefined" && req.body.label !== "" && req.body.order && req.body.order !== "" && req.body.order !== "undefined") {
                        query.push({ $sort: { [`${req.body.label}`]: req.body.order } })
                    }
                    else {
                        query.push({ $sort: { id: -1 } })
                    }
                    // if (req.body.pageNo && req.body.pageNo != "undefined" && req.body.pageNo !== "" && req.body.limit && req.body.limit != "undefined" && req.body.limit !== "") {
                    query.push({ $skip: (Number(pageNo) - 1) * Number(limit) }, { $limit: Number(limit) })
                    // }

                    // Fetching the validation data from master schema e.g. Shcema
                    let FetchRules = await model.AggregateFetchData("master_schema", "master_schema", [{ $match: { tableName: req.body.tableName, status: Number(process.env.ACTIVE_STATUS) } }], res)
                    let data = await model.AggregateFetchData(req.body.tableName, req.body.tableName, query, res) // fetching the data from master table
                    let Count = 0
                    if (pageNo == 1) {
                        let temp = await model.AggregateFetchData(req.body.tableName, req.body.tableName, [{ $match: _matchdata },
                        {
                            $count: 'count'
                        }
                        ], res)
                        Count = temp.length > 0 ? temp[0].count : 0
                    }
                    if (FetchRules.length > 0) {
                        let field = FetchRules[0].fields.filter((field) => field.referenceTable !== null);// filtering the fields with reference table is not null of parent
                        //                        // console.log("Helllllllllllooooooooooooooooooooooo");
                        let fieldforChild = await processChildren(FetchRules[0].child, res, data)//  fetching the data for the reference table of child and subChild and store in dataObj
                        let dataObj = await fetchDataForFields(field, res, data)
                        // Binding the data of refrance table with main table data
                        for (let datavalueObj of data) {
                            // Binding the Data of reference table with main table parent
                            for (let fieldData of field) {

                                let joinKey = fieldData.referenceTable.split('.').slice(1, 5).join('.');
                                //                                console.log("joinKey", joinKey);
                                datavalueObj[fieldData.fieldname] = dataObj[fieldData.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) !== null && getNestedProperty(filterData, joinKey) === datavalueObj[fieldData.fieldname])[0] || fieldData.defaultValue // filtering the data according to join key from the dataObj and binding it to the main data 
                            }
                            // Binding the Data of reference table with main table child and SubChild
                            for (let childData of fieldforChild) {
                                let childdddd = childData
                                if (typeof datavalueObj[childdddd.tableName] !== "undefined") {


                                    for (let childObj of datavalueObj[childdddd.tableName]) {
                                        for (childField of childdddd.fields) {
                                            let joinKey = childField.referenceTable.split('.').slice(1, 5).join('.');// removing the parent from join key the reference like parent.child.subchild.key to child.subchild.key
                                            //                                            console.log("childObj", childObj[childField.fieldname]);
                                            childObj[childField.fieldname] = childdddd.dataObj[childField.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) !== null && getNestedProperty(filterData, joinKey) === childObj[childField.fieldname])[0] || childField.defaultValue // filtering the data according to join key from the dataObj and binding it to the main data 
                                        }
                                        for (subChild of childData.subChild) {
                                            //                                            console.log("subChild", childObj[subChild.tableName]);
                                            if (typeof childObj[subChild.tableName] !== "undefined") {


                                                for (const subChildData of childObj[subChild.tableName]) {
                                                    for (const subField of subChild.fields) {

                                                        let joinKey = subField.referenceTable.split('.').slice(1, 5).join('.');

                                                        subChildData[subField.fieldname] = subChild.dataObj[subField.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) !== null && getNestedProperty(filterData, joinKey) === subChildData[subField.fieldname])[0] || subField.defaultValue// filtering the data according to join key from the dataObj and binding it to the main data 
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }


                            }

                        }

                        res.send({
                            success: true,
                            message: "list fetched",
                            data: data,
                            Count: Count
                        })
                    }
                    else {
                        res.status(403).send({ success: false, message: "Schema Not Found", data: [] });
                    }
                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({ success: false, message: "Something went wrong", data: error.message });

                }

            });
        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({ success: false, message: "Something went wrong", data: error.message });
        }
    },
    DemoExample: async (req, res) => {
        const validationRule = {
            tableName: "required"
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "validation Error",
                    data: err
                })
            }
            else {
                try {
                    let matchData = { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode }
                    const { body } = req
                    if (body.id && body.id !== "") {
                        matchData['$or'] = [{ 'id': Number(body.id) }, { '_id': createObjectId(body.id) }]
                    }
                    let FetchRules = await model.AggregateFetchData("tblFormcontrol", "mainTableSchema", [{ $match: { _id: createObjectId(req.body.menuID), status: Number(process.env.ACTIVE_STATUS) } }], res)
                    let DropDownObj = []
                    for (const object of FetchRules) {

                        for (const child of object.child) {
                            let tempobject = {}
                            tempobject["tableName"] = child.tableName
                            tempobject["fields"] = child.fields.filter(x => x.controlname.toLowerCase() == "dropdown")
                            tempobject["subChild"] = []
                            for (const subChild of child.subChild) {
                                let tempobjectForChild = {}
                                tempobjectForChild["tableName"] = subChild.tableName
                                tempobjectForChild["fields"] = subChild.fields.filter(x => x.controlname.toLowerCase() == "dropdown")
                                tempobject["subChild"].push(tempobjectForChild)
                            }
                            DropDownObj.push(tempobject)
                        }
                    }
                    // res.send(DropDownObj)
                    // let gridkeys = FetchRules[0].fields.filter(x => x.isGridView == true && x.controlname.toLowerCase() == "dropdown")
                    const data = await model.AggregateFetchData(body.tableName, body.tableName, [{ $match: matchData }, {
                        $addFields: {
                            attachment: {
                                $filter: {
                                    input: "$attachment",
                                    as: "attachment",
                                    cond: {
                                        $eq: ["$$attachment.status", 1],
                                    },
                                },
                            },
                        },
                    },], res)
                    // return res.send({DropDownObj})
                    if (data.length > 0) {
                        for (const dropdown of DropDownObj) {
                            const values = new Set()
                            dropdown["values"] = {}
                            data.forEach(element => {

                                (element[dropdown.tableName] || []).map(x => {
                                    (dropdown.fields || []).map(y => {
                                        if (typeof dropdown["values"][y.fieldname] == "undefined") {
                                            dropdown["values"][y.fieldname] = [createObjectId(x[y.fieldname])]
                                        }
                                        else {
                                            dropdown["values"][y.fieldname].push(createObjectId(x[y.fieldname]))
                                        }
                                    })

                                })
                                // dropdown["values"] = Array.from(values);
                                //                                console.log(Array.from(dropdown["values"]));
                            });
                            for (const subchild of dropdown.subChild) {
                                subchild["values"] = {}
                                data.forEach(element => {

                                    (element[dropdown.tableName] || []).map(x => {
                                        (x[subchild.tableName] || []).map(z => {
                                            (subchild.fields || []).map(y => {
                                                if (typeof subchild["values"][y.fieldname] == "undefined") {
                                                    subchild["values"][y.fieldname] = [createObjectId(z[y.fieldname])]
                                                }
                                                else {
                                                    subchild["values"][y.fieldname].push(createObjectId(z[y.fieldname]))
                                                }
                                            })
                                        })
                                    })
                                    // dropdown["values"] = Array.from(values);
                                    //                                console.log(Array.from(dropdown["values"]));
                                });


                            }


                        }
                        // return res.send({ DropDownObj, data })
                        // return res.send({ DropDownObj, data })
                        console.log("DropDownObj", DropDownObj);
                        // return res.send({ success: true, message: "list fetched", data: DropDownObj})
                        for (const dropdown of DropDownObj) {

                            for (const element of dropdown.fields) {
                                // element.dropdownFilter=`{${element.referenceTable}._id:"${singleData[dropdown.tableName][element.fieldname]}"}`
                                dropdown["values"][element.fieldname] = await fetchDataForDropdown(element, model, dropdown.values[element.fieldname], "req")
                                for (const singleData of data) {
                                    for (const child of singleData[dropdown.tableName] || []) {
                                        //                                        console.log("Values", dropdown["values"][element.fieldname].find(x => x.id.toString() == child[`${element.fieldname}`])?.value);
                                        child[`${element.fieldname}Dropdown`] = dropdown["values"][element.fieldname].find(x => x.id.toString() == child[`${element.fieldname}`])?.value || null
                                    }
                                }
                            }

                            for (const subchild of dropdown.subChild) {
                                // Fetch data for subchild dropdown
                                // subchild["values"] = {};
                                for (const subElement of subchild.fields) {
                                    // console.log(subElement, model, subchild.values[subElement.fieldname]);
                                    subchild["values"][subElement.fieldname] = await fetchDataForDropdown(subElement, model, subchild.values[subElement.fieldname], "req");
                                }

                                // Assign subchild dropdown values to corresponding fields in child
                                for (const singleData of data) {
                                    for (const child of singleData[dropdown.tableName]) {
                                        for (const subChild of child[subchild.tableName] || []) {
                                            for (const subElement of subchild.fields || []) {
                                                subChild[`${subElement.fieldname}Dropdown`] = subchild["values"][subElement.fieldname].find(x => x.id.toString() == subChild[`${subElement.fieldname}`])?.value || null;
                                            }
                                        }
                                    }
                                }
                            }

                        }



                    }

                    // return res.send(DropDownObj)

                    data.length > 0 ? res.send({ success: true, message: "list fetched", data: data }) : res.status(403).send({ success: false, message: "No Data Found", data: [] });

                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({ success: false, message: "Something went wrong", data: error.message })
                }
            }
        })
    },
    UpdateTryTwo: async (req, res) => {
        try {
            let data = await model.AggregateFetchData("updateOldId", "updateOldId", [{ $match: { currentTable: "tblInvoice", flag: "n" } }], res)

            let groupedData = data.reduce((result, obj) => {
                const { currentTable } = obj;

                if (!result[currentTable]) {
                    result[currentTable] = [];
                }

                result[currentTable].push(obj);

                return result;
            }, {});
            // return res.send({groupedData})
            let query = {}
            for (const iterator of Object.keys(groupedData)) {
                query[iterator] = []

                for (const condition of groupedData[iterator]) {
                    query[iterator].push(generateAggregationPipeline([condition]));
                    // await model.AggregateFetchData(iterator, iterator, generateAggregationPipeline([condition]), res)
                    // await model.updateIfAvailableElseInsertMaster("updateOldId", "updateOldId", {id:condition.id,flag:"y"}, res)
                }




            }
            res.send({ success: true, message: "Id Updated Successfully", data: query })
        } catch (error) {
            res.send({ success: false, message: "Something went wrong", data: error.message })
        }
    },
    UpdateTryThree: async (req, res) => {
        try {
            let data = await model.AggregateFetchData("updateOldId", "updateOldId", [{ $match: { currentTable: "tblCharge", flag: "n", } }], res)
            console.log(data);
            let groupedData = data.reduce((result, obj) => {
                const { currentTable } = obj;

                if (!result[currentTable]) {
                    result[currentTable] = [];
                }

                result[currentTable].push(obj);

                return result;
            }, {});
            // console.log(groupedData)
            // return res.send({groupedData})
            let query = {}
            for (const iterator of Object.keys(groupedData)) {
                let masterData = await model.AggregateFetchData(iterator, iterator, [{ $match: { status: 1 } }], res)
                console.log(masterData.length);
                let datatoBeFeched = {}
                let fetchData = {}
                for (const condition of groupedData[iterator]) {
                    datatoBeFeched[condition.currentColumn] = new Set()
                }


                datatoBeFeched = createCommaSeparatedValues(masterData, datatoBeFeched)
                console.log(datatoBeFeched);
                for (const condition of groupedData[iterator]) {
                    //                    console.log(datatoBeFeched[condition.currentColumn]);
                    let query = []
                    let refrancecolumn = condition.referenceColumn.split(".").slice(0, -1)
                    for (let index = 1; index <= refrancecolumn.length; index++) {
                        //                        console.log(condition.referenceColumn.split(".").slice(0, index).join("."));
                        query.push({ $unwind: { path: `$${condition.referenceColumn.split(".").slice(0, index).join(".")}` } })
                    }
                    //                    console.log(refrancecolumn);
                    query.push({ $match: { [condition.referenceColumn]: { $in: Array.from(datatoBeFeched[condition.currentColumn]) } } })
                    if (condition.masterName && condition.masterName != "" && condition.masterName != null) {
                        let masterlist = [
                            {
                                $match: {
                                    name: condition.masterName,
                                },
                            },
                            {
                                $lookup: {
                                    from: "tblMasterData",
                                    let: { tblId: { $toString: "$_id" } },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: [
                                                        "$tblMasterListId",
                                                        "$$tblId",
                                                    ],
                                                },
                                            },
                                        },
                                    ],
                                    as: "masterData",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$masterData",
                                    includeArrayIndex: "string",
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            {
                                $project: {
                                    oldId: "$masterData.oldId",
                                    _id: "$masterData._id",
                                },
                            },
                        ]
                        fetchData[condition.currentColumn] = await model.AggregateFetchData("tblMasterList", "tblMasterList", masterlist, res)
                    }
                    else {

                        fetchData[condition.currentColumn] = await model.AggregateFetchData(condition.referenceTable, condition.referenceTable, query, res)

                    }
                }
                // return res.send({fetchData})
                for (const keys of Object.keys(fetchData)) {
                    let keyArray = keys.split(".")
                    let primaryKey = keyArray[0]
                    //                    // console.log(keyArray);
                    for (const data of masterData) {
                        if (Array.isArray(data[primaryKey])) {
                            ;
                            for (let index = 0; index < data[primaryKey].length; index++) {
                                //  data[primaryKey][index];
                                if (Array.isArray(data[primaryKey][index][keyArray[1]])) {
                                    for (let subchildIndex = 0; subchildIndex < data[primaryKey][index][keyArray[1]].length; subchildIndex++) {
                                        const target = data[primaryKey][index][keyArray[1]][subchildIndex][keyArray[2]];
                                        const foundItem = fetchData[keyArray.join(".")].find(f => f.oldId == target);

                                        // Safely update the target with the found item's _id, converted to string, or retain the original value if not found.
                                        data[primaryKey][index][keyArray[1]][subchildIndex][keyArray[2]] = foundItem ? foundItem?._id.toString() : target;

                                        // data[primaryKey][index][keyArray[1]][subchildIndex][keyArray[2]] = fetchData[keyArray.join(".")].find(f => f.oldId == data[primaryKey][index][keyArray[1]][subchildIndex][keyArray[2]])?._id.toString() || data[primaryKey][index][keyArray[1]][subchildIndex][keyArray[2]]

                                    }
                                }
                                else {
                                    const foundItem = fetchData[keyArray.join(".")].find(f => f.oldId == data[primaryKey][index][keyArray[1]]);
                                    data[primaryKey][index][keyArray[1]] = foundItem ? foundItem._id?.toString() : data[primaryKey][index][keyArray[1]];

                                    // data[primaryKey][index][keyArray[1]] = fetchData[keyArray.join(".")].find(f => f.oldId == data[primaryKey][index][keyArray[1]])?._id.toString() || data[primaryKey][index][keyArray[1]]
                                }


                            }
                        }
                        else {

                            const foundItem = fetchData[primaryKey].find(f => f.oldId == data[primaryKey]);
                            data[primaryKey] = foundItem ? foundItem._id?.toString() : data[primaryKey];
                        }
                    }
                }
                // return res.send({masterData})
                let finalSubmultiData = []
                for (const data of masterData) {
                    // console.log(data);
                    //    finalSubmultiData.push(model.updateIfAvailableElseInsertMaster(iterator, iterator, masterData, res))
                    await model.updateIfAvailableElseInsertMaster(iterator, iterator, data, { ip: extractIPv4(req.ip || req.connection.remoteAddress) })
                }
                await model.Update("updateOldId", "updateOldId", { currentTable: iterator }, { flag: "y" }, {}, res)
                // await Promise.all(finalSubmultiData)

            }

            res.send({ success: true, message: "Id Updated Successfully", data: query })
        } catch (error) {
            errorLogger(error, req)
            res.send({ success: false, message: "Something went wrong", data: error.message })
        }
    },
    delete: async (req, res) => {
        try {
            const validationRule = {
                id: "required",
                tableName: "required"
            }
            validate(req.body, validationRule, {}, async (err, status) => {
                if (!status) {
                    res.status(403).send({
                        success: false,
                        message: "validation Error",
                        data: err
                    })
                }
                else {
                    let data = await model.updateIfAvailableElseInsertMaster(req.body.tableName, req.body.tableName, { id: Number(req.body.id), status: 2, clientCode: req.clientCode }, { tableName: req.body.tableName, ip: extractIPv4(req.ip || req.connection.remoteAddress) }, req.body.menuID, res)
                    data ? res.send({ success: true, message: "Data Deleted Successfully", data: data }) : res.status(403).send({ success: false, message: "Not Deleted", data: [] });

                }
            })

        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    },
    upLoadFile: async (req, res) => {
        try {
            let responce = {};
            if (getFolderSize(`./public/api/images`) >= maxAllowedSizeInBytes) {
                responce.success = false; // Update flag since response is being sent
                responce.message += 'Your storage capacity has surpassed the 1GB limit. Kindly consider upgrading your plan.'


            } else {
                //                // console.log(Array.isArray(req.files.documents));
                //                console.log(req.files);
                if (req.files && req.files["documents"]) {
                    const file = req.files["documents"]; // Adjust the field name based on your form
                    // const allowedExtensions = /\.(png|jpg|jpeg|pdf|doc|xls|txt)$/i;
                    const allowedExtensions = /\.(png|jpg|jpeg|pdf|doc|docx|xls|xlsx|txt|json|xml|ppt|pptx)$/i;
                    // Check file extension
                    if (!allowedExtensions.test(file.name)) {
                        responce.success = false; // Update flag since response is being sent

                        // responce.message = 'Sorry, the file type you provided is invalid. Please upload a file with one of the following extensions: .png, .jpg, ,.jpeg, .pdf, .doc, .xls, .txt.'
                        responce.message = 'Sorry, the file type you provided is invalid. Please upload a file with one of the following extensions: .png, .jpg, .jpeg, .pdf, .doc, .docx, .xls, .xlsx, .txt, .json, .xml, .ppt, .pptx.';
                        // break; // Break out of the loop
                    }
                    // Check file size
                    else if (file.size > 1024 * 1024) { // 1MB in bytes
                        responce.success = false; // Update flag since response is being sent

                        responce.message = 'The file size exceeds the maximum limit of 1MB.'

                        // break; // Break out of the loop
                    }
                    else {
                        var element = req.files["documents"];

                        // Use path module to get the extension
                        const extension = path.extname(element.name);
                        //console.log(extension);
                        // Use path module to get the file name without extension
                        const fileNameWithoutExt = path.basename(element.name, extension);
                        //console.log(fileNameWithoutExt);
                        // var image_name = moment().format("YYYYMMDDHHmmssSSS") + element.name;
                        var image_name = fileNameWithoutExt + moment().format("YYYYMMDDHHmmssSSS") + extension;
                        element.mv(`./public/api/images/${req.clientCode}/` + image_name.trim());
                        // insertData["documents"] = image_name; // Store the processed file name
                        responce.success = true; // Update flag since response is being sent
                        responce.message = 'File uploaded successfully.';
                        responce.data = { path: `api/images/${req.clientCode}/` + image_name, status: 1 };
                    }

                }
            }
            res.status(responce.success ? 200 : 403).send(responce);

        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    },
    DisPlaySeacrchApi: async (req, res) => {
        const validationRule = { tableName: "required", menuID: "required" };
        // validate for validation according to validationRule
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                return res.status(403).send({ success: false, message: "Validation Error...!", data: err });
            }
            try {
                // console.log("req.cookies", req);
                let pageNo = parseInt(req.body.pageNo, 10) || 1; // Default to page 1 if not specified
                let limit = parseInt(req.body.limit, 10) || 10; // Default to 10 items per page if not specified
                let _matchdata = { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode }
                //if req.body.id is not null or undefined or empty then the result will be filtered on the basis of id
                if (req.body.id && req.body.id != "undefined" && req.body.id !== "") {
                    _matchdata['id'] = Number(req.body.id)
                }
                if (req.body.search && req.body.search != "undefined" && req.body.search !== "") {
                    Object.keys(req.body.search).map(key => {
                        if (typeof req.body.search[key] === "object" && ('$gte' in req.body.search[key] || '$lte' in req.body.search[key])) {
                            _matchdata[key] = {};
                            if ('$gte' in req.body.search[key]) {
                                _matchdata[key].$gte = new Date(req.body.search[key]['$gte']);
                            }
                            if ('$lte' in req.body.search[key]) {
                                _matchdata[key].$lte = new Date(req.body.search[key]['$lte']);
                            }
                        } else {
                            _matchdata[key] = {
                                $regex: req.body.search[key],
                                $options: 'i'
                            };
                        }

                    })
                    // _matchdata['$or'] = [{ id: { $regex: req.body.search, $options: 'i' } }, { tableName: { $regex: req.body.search, $options: 'i' } }]
                    // Object.assign(_matchdata, req.body.search)
                }
                let FetchRules = await model.AggregateFetchData("tblFormcontrol", "mainTableSchema", [{ $match: { _id: createObjectId(req.body.menuID), status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }], res)
                let gridkeysForSearch = FetchRules[0].fields.filter(x => x.isGridView == true)
                let searchArray = FetchRules[0]?.searchArray
                console.log(searchArray)
                for (const searchItem of searchArray || []) {
                    const { searchFieldName, searchOperator, searchFieldValue } = searchItem;
                    let opertator = ["$in", "$nin"]

                    if (!_matchdata[searchFieldName]) {
                        _matchdata[searchFieldName] = {};
                    }
                    if (opertator.includes(searchOperator)) {

                        if (!_matchdata[searchFieldName][searchOperator]) {
                            _matchdata[searchFieldName][searchOperator] = [];
                        }
                    }

                    let value = []
                    if (searchItem.searchTable && searchItem.searchTable !== "" && searchItem.searchTable !== "undefined") {
                        // console.log(searchItem.searchTable);
                        let referenceTable = searchItem.searchTable.split(".")
                        referenceTable = referenceTable.slice(0, -1).join(".")
                        let referenceColumn = searchItem.searchTable.split(".").slice(-1).join(".")
                        console.log(referenceTable, referenceColumn);
                        value = await fetchDataForSearch({ referenceTable, referenceColumn }, model, searchFieldValue, req)
                    }
                    if (opertator.includes(searchOperator)) {
                        _matchdata[searchFieldName][searchOperator].push(value.length > 0 ? value[0].id.toString() : eval(searchFieldValue));

                    }
                    else {
                        _matchdata[searchFieldName][searchOperator] = value.length > 0 ? value[0].id.toString() : eval(searchFieldValue);
                    }
                }
                // if (req.body.searchQuery && req.body.searchQuery != "undefined" && req.body.searchQuery !== "") {
                //     _matchdata["$or"] = gridkeysForSearch.map(field => ({ [field.fieldname]: { $regex: req.body.searchQuery, $options: 'i' } }))
                // }
                if (req.body.searchQuery && req.body.searchQuery !== "undefined" && req.body.searchQuery !== "") {
                    let isDate = !isNaN(Date.parse(req.body.searchQuery));
                    if (isDate) {
                        // If it's a valid date string, search for it in date fields
                        const [year, month, day] = req.body.searchQuery.split('-').map(Number);
                        const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)); // Correct day start
                        // const startDate = new Date(moment(`${year}-${month}-${day} 00:00:00`).utc()); // Correct day start
                        const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)); // Correct day end
                        // const endDate = new Date(moment(`${year}-${month}-${day} 23:59:59`).utc()); // Correct day end
                        _matchdata["$or"] = gridkeysForSearch.map(field => ({
                            [field.fieldname]: { $gte: startDate, $lte: endDate }
                        }));
                    } else {
                        // If it's not a valid date string, perform regex search in other fields
                        _matchdata["$or"] = gridkeysForSearch.filter(field => field.controlname.toLowerCase() != "dropdown").map(field => ({

                            [field.fieldname]: { $regex: `^${req.body.searchQuery}`, $options: 'i' }
                        }));
                    }
                    let dropdownFieldsforSearch = gridkeysForSearch.filter(field => field.controlname.toLowerCase() == "dropdown")
                    for (const iterator of dropdownFieldsforSearch) {
                        let objectId = await fetchDataForSearch(iterator, model, req.body.searchQuery, req)
                        objectIdarray = []
                        objectId.map((data) => {
                            objectIdarray.push(data.id.toString())
                        })
                        _matchdata["$or"].push({ [iterator.fieldname]: { $in: objectIdarray } })

                    }
                }
                if (req.body.keyName && req.body.keyValue && req.body.keyValue !== "" && req.body.keyValue !== "") {
                    let dropDownRightCilckSearch = req.body.keyName && gridkeysForSearch.find(field => field.fieldname === req.body.keyName && field.controlname.toLowerCase() === "dropdown");
                    //                    console.log("dropDownRightCilckSearch", dropDownRightCilckSearch);
                    if (dropDownRightCilckSearch) {
                        let objectId = await fetchDataForSearch(dropDownRightCilckSearch, model, req.body.keyValue, req)
                        objectIdarray = []
                        objectId.map((data) => {
                            objectIdarray.push(data.id.toString())
                        })
                        _matchdata["$or"] = [{ [req.body.keyName]: { $in: objectIdarray } }]
                    }
                    else {
                        let isDate = !isNaN(Date.parse(req.body.keyValue));
                        if (isDate) {
                            // If it's a valid date string, search for it in date fields
                            // const [year, month, day] = req.body.keyValue.split('-').map(Number);
                            // const startDate = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0, 0)); // Months are 0-indexed in JavaScript Date
                            // const endDate = new Date(Date.UTC(year, month - 1, day - 1, 23, 59, 59, 999));

                            const [year, month, day] = req.body.keyValue.split('-').map(Number);
                            const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)); // Correct day start
                            // const startDate = new Date(moment(`${year}-${month}-${day} 00:00:00`)); // Correct day start
                            const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)); // Correct day end
                            // const endDate = new Date(moment(`${year}-${month}-${day} 23:59:59`)); // Correct day end

                            _matchdata["$or"] = [{
                                [req.body.keyName]: { $gte: startDate, $lte: endDate }
                            }]
                        } else {
                            // If it's not a valid date string, perform regex search in other fields
                            _matchdata["$or"] = [{

                                [req.body.keyName]: { $regex: `^${req.body.keyValue}`, $options: 'i' }
                            }]
                        }
                    }

                }

                let query = [{ $match: _matchdata }, {
                    $addFields: {
                        attachment: {
                            $filter: {
                                input: "$attachment",
                                as: "attachment",
                                cond: {
                                    $eq: ["$$attachment.status", 1],
                                },
                            },
                        },
                    },
                },];
                let ProjectQuery = { id: 1 }
                gridkeysForSearch.map(field => {
                    ProjectQuery[field.fieldname] = 1
                })
                query.push({ $project: ProjectQuery })


                // Previous sort Code 
                if (gridkeysForSearch.filter(field => field.controlname.toLowerCase() == "dropdown").find(field => field.fieldname == req.body.label)) {
                    //                   console.log("req.body.label")
                    let data = await optimizedFetchAndProcess(req, res, gridkeysForSearch, FetchRules, ProjectQuery, query)
                    return res.status(200).send({ ...data })
                }
                if (req.body.label && req.body.label != "undefined" && req.body.label !== "" && req.body.order && req.body.order !== "" && req.body.order !== "undefined") {
                    query.push({ $addFields: { lowerCaseValue: { $toLower: "$" + req.body.label } } }, { $sort: { lowerCaseValue: req.body.order } })
                }
                else {
                    query.push({ $sort: { id: -1 } })
                }

                // if (req.body.pageNo && req.body.pageNo != "undefined" && req.body.pageNo !== "" && req.body.limit && req.body.limit != "undefined" && req.body.limit !== "") {
                query.push({ $skip: (Number(pageNo) - 1) * Number(limit) }, { $limit: Number(limit) })
                // }

                // Fetching the validation data from master schema e.g. Shcema


                let data = await model.AggregateFetchData(req.body.tableName, req.body.tableName, query, res) // fetching the data from master table
                let Count = 0
                if (pageNo == 1) {
                    let temp = await model.AggregateFetchData(req.body.tableName, req.body.tableName, [{ $match: _matchdata },
                    {
                        $count: 'count'
                    }
                    ], res)
                    Count = temp.length > 0 ? temp[0].count : 0
                }
                if (FetchRules.length > 0 && data.length > 0) {
                    let gridkeys = FetchRules[0].fields.filter(x => x.isGridView == true && x.controlname.toLowerCase() == "dropdown")
                    let multiselectkeys = FetchRules[0].fields.filter(x => x.isGridView == true && x.controlname.toLowerCase() == "multiselect")
                    // Binding the data of refrance table with main table data
                    // let lookupDataArray = gridkeysForSearch.filter(x => x.isDummy == true)
                    // let lookupValueObject = new Set(data.map(x => x._id.toString()))
                    // for (const item of lookupDataArray) {
                    //     let lookupData = await model.AggregateFetchData(item.referenceTable,item.referenceTable, [{ $match: { [`${item.referenceColumn}`]: { $in: Array.from(lookupValueObject) } } }], res)
                    //     for (const dataObject of data) {
                    //         dataObject[item.yourlabel]=lookupData.filter(x => x[item.referenceColumn].toString() == dataObject._id.toString())||"No Data"
                    //     }
                    // }
                    // console.log(lookupValueObject);
                    let tempObj = {}
                    let values = {}
                    for (const iterator of gridkeys) {
                        tempObj[iterator.fieldname] = []

                        for (const values of data) {
                            tempObj[iterator.fieldname].push(createObjectId(values[iterator.fieldname]))
                        }
                        values[iterator.fieldname] = await fetchDataForDropdown(iterator, model, tempObj[iterator.fieldname], res)
                        for (const d of data) {
                            d[iterator.fieldname] = values[iterator.fieldname].find(x => x.id?.toString() == d[iterator.fieldname])?.value || d[iterator.fieldname]
                        }
                    }
                    for (const iterator of multiselectkeys) {
                        tempObj[iterator.fieldname] = []

                        for (const values of data) {
                            let array = values[iterator.fieldname]?.split(",")
                            let arraSet = new Set(array?.map(x => createObjectId(x)))
                            tempObj[iterator.fieldname].push(...arraSet)


                        }
                        console.log(tempObj[iterator.fieldname]);
                        values[iterator.fieldname] = await fetchDataForDropdown(iterator, model, tempObj[iterator.fieldname], res)
                        for (const d of data) {
                            d[iterator.fieldname] = values[iterator.fieldname].filter(x => d[iterator.fieldname]?.split(",")?.includes(x.id?.toString())) || d[iterator.fieldname]
                            if (Array.isArray(d[iterator.fieldname])) {
                                d[iterator.fieldname] = d[iterator.fieldname].map(x => x.value).join(",")


                            }
                        }
                    }
                    let idsOfMasterTable = new Set(data.map(x => x._id.toString()));

                    if (FetchRules[0]?.viewId) {
                        const apiDefinationData = await model.AggregateFetchData(
                            "tblApiDefination",
                            "tblApiDefination",
                            [
                                { $match: { status: 1, clientCode: req.clientCode, apiLabel: FetchRules[0].viewId } },
                                { $sort: { createdDate: -1 } }
                            ]
                        );

                        if (apiDefinationData.length > 0) {
                            try {
                                const apiUrl = `http://localhost:${process.env.PORT}${apiDefinationData[0].apiPath}`;
                                console.log(apiUrl);

                                const response = await axios.post(apiUrl, {
                                    filterCondition: { jobId: Array.from(idsOfMasterTable) }
                                }, {
                                    headers: {
                                        "x-access-token": req.headers["x-access-token"],
                                        "Content-Type": "application/json"
                                    }
                                });

                                const responseData = response.data.data;
                                if (responseData.length > 0) {
                                    // Build a map with jobId as key and the array of matching items as value
                                    const responseMap = new Map();
                                    responseData.forEach(item => {
                                        if (!responseMap.has(item.jobId)) {
                                            responseMap.set(item.jobId, []);
                                        }
                                        responseMap.get(item.jobId).push(item);
                                    });

                                    data.forEach(item => {
                                        FetchRules[0].viewFields.forEach(project => {
                                            const matchedItems = responseMap.get(item._id.toString());

                                            if (matchedItems && matchedItems.length > 0) {
                                                // Map the matching field values, join them as a comma-separated string
                                                item[project.fieldname] = matchedItems
                                                    .map(matchedItem => matchedItem[project.fieldname])
                                                    .filter(value => value) // Filter out any null or undefined values
                                                    .join(",");
                                            } else {
                                                item[project.fieldname] = ''; // Set to empty string if no match is found
                                            }
                                        });
                                    });
                                }
                            } catch (error) {
                                console.error(`Error fetching data: ${error.message}`);
                            }
                        }
                    }



                    res.send({
                        success: true,
                        message: "list fetched",
                        data: data,
                        Count: Count
                    })
                }
                else {
                    res.status(200).send({ success: false, message: "No Data Found", data: [] });
                }
            } catch (error) {
                errorLogger(error, req)
                res.status(500).send({ success: false, message: "Something went wrong", data: error.message });

            }

        });
    },
    /**
     * copyDataBase function to copy data from one database to another
     * @param {Object} req - request object
     * @param {Object} res - response object
     * @returns {Object} - response containing success, message, noOfTable and data
     */
    copyDataBase: async (req, res) => {
        const validationRule = {
            copyType: "required",
        }
        // validate the request body
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "validation Error",
                    data: err
                })
            }
            else {
                try {
                    let { copyType, clientCode, tableName } = req.body
                    // check if copy type is all or custom
                    if (copyType == "all") {
                        // get all table names from master schema
                        let tableName = await model.AggregateFetchData("master_schema", "master_schema", [{ $match: { status: Number(process.env.ACTIVE_STATUS), tableName: { $nin: ["tblErrorLog", "tblTermsCondition", "demoTable"] } } }, { $project: { tableName: 1 } }], res)
                        tableName = tableName.map(x => x.tableName)
                        let dataTOfetch = []
                        // fetch data from each table
                        for (const iterator of tableName) {
                            dataTOfetch.push(await model.AggregateFetchData(iterator, iterator, [{ $match: { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }, { $addFields: { clientCode: clientCode } }, { $project: { _id: 0, id: 0 } }, { $limit: 2 }], res))
                        }
                        let arrayToinsert = []
                        let finalData = await Promise.all(dataTOfetch)
                        // insert data into destination database
                        for (let index = 0; index < tableName.length; index++) {
                            const element = tableName[index];
                            arrayToinsert.push(model.updateIfAvailableElseInsertMasterBulk(element, element, finalData[index], req))
                        }
                        console.log(arrayToinsert);
                        return res.send({ success: true, message: "table name", noOfTable: tableName.length, data: finalData })
                    }
                    else if (copyType == "custom") {
                        // fetch data from selected tables
                        let dataTOfetch = []
                        for (const iterator of tableName) {
                            dataTOfetch.push(await model.AggregateFetchData(iterator, iterator, [{ $match: { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }, { $addFields: { clientCode: clientCode } }, { $project: { _id: 0, id: 0 } }], res))
                        }
                        let arrayToinsert = []
                        let finalData = await Promise.all(dataTOfetch)
                        // insert data into destination database
                        for (let index = 0; index < tableName.length; index++) {
                            const element = tableName[index];
                            arrayToinsert.push(model.updateIfAvailableElseInsertMasterBulk(element, element, finalData[index], req))
                        }
                        await Promise.all(arrayToinsert)
                        return res.send({ success: true, message: "table name", noOfTable: tableName.length, data: finalData })
                    }
                    else {
                        return res.send({ success: false, message: "Select Proper Copy Type" })
                    }

                    // res.send({ success: true, message: "table copied successfully" })
                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({ success: false, message: "Something went wrong", data: error.message });
                }
            }
        })
    },
    DeleteDataFromAuditLog: async (req, res) => {
        const validationRule = {
            tableName: "required",
            clientCode: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error....",
                    data: err
                })
            }
            else {
                try {
                    let { tableName, fromDate, toDate, clientCode } = req.body
                    let matchData = { clientCode: clientCode }
                    if (fromDate && fromDate !== "" && toDate && toDate !== "") {
                        matchData.createdDate = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate)
                        }
                    }
                    else if (fromDate && fromDate !== "") {
                        matchData.createdDate = {
                            $gte: new Date(fromDate)
                        }
                    }
                    else if (toDate && toDate !== "") {
                        matchData.createdDate = {
                            $lte: new Date(toDate)
                        }
                    }
                    let data = await model.DeleteDataFromTable(tableName, matchData)
                    if (data) {
                        res.send({ success: true, message: "Data Deleted Successfully....", data: data })
                    }
                    else {
                        res.send({ success: false, message: "Data Not Deleted Successfully....", data: data })
                    }

                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({
                        success: false,
                        message: "Something Went Worng....!",
                        data: []
                    })
                }
            }
        })
    },
    CopyFormControlAndMenu: async (req, res) => {
        // return  console.log(thiscopyMasterDataWithMasterlist);
        const validationRule = {
            clientCode: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error",
                    data: err
                })
            }
            else {
                try {
                    let { clientCode } = req.body
                    let fetchMenu = await model.AggregateFetchData("tblMenu1", "tblMenu1", [{ $match: { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }, { $addFields: { clientCode: clientCode, createdDate: new Date(), updatedDate: new Date(), createdBy: Number(req.userId), updatedBy: Number(req.userId) } }], res)
                    let menuDataGroupedby = await model.AggregateFetchData("tblMenu1", "tblMenu1", [{ $match: { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }, { $group: { _id: "$formControlId", data: { $push: "$$ROOT" } } }], res)
                    menuDataGroupedby = new Set(menuDataGroupedby.map(x => x._id))
                    let menuDataGroupedbyReport = await model.AggregateFetchData("tblMenu1", "tblMenu1", [{ $match: { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode, reportId: { $ne: null } } }, { $group: { _id: "$reportId", data: { $push: "$$ROOT" } } }], res)
                    let menuDataGroupedbyReportId = new Set(menuDataGroupedbyReport.map(x => x._id))
                    let formControlData = await model.AggregateFetchData("tblFormcontrol", "tblFormcontrol", [{ $match: { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }, { $addFields: { clientCode: clientCode, createdDate: new Date(), updatedDate: new Date(), createdBy: Number(req.userId), updatedBy: Number(req.userId) } }], res)
                    let reportCriteriaData = await model.AggregateFetchData("tblReportSearchCriteria", "tblReportSearchCriteria", [{ $match: { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }, { $addFields: { clientCode: clientCode, createdDate: new Date(), updatedDate: new Date(), createdBy: Number(req.userId), updatedBy: Number(req.userId) } }], res)
                    // return res.send({ success: true, message: "table copied successfully", data: {reportCriteriaData } })


                    // Loop through each item in formControlData array
                    for (let index = 0; index < formControlData.length; index++) {
                        // Get the current item
                        let item = formControlData[index];
                        // Check if the item's _id exists in menuDataGroupedby
                        console.log(menuDataGroupedby.has(item._id?.toString()));
                        // Create a shallow copy of the item
                        let insertData = { ...item };
                        // Delete the _id and id properties from the insertData object
                        delete insertData._id;
                        delete insertData.id;

                        // Add the insertData object to the tblFormcontrol collection
                        let finalData = await model.AddData("tblFormcontrol", "tblFormcontrol", [insertData], res);

                        // If the item's _id exists in menuDataGroupedby,
                        // update the formControlId of the corresponding item in fetchMenu
                        if (menuDataGroupedby.has(item._id?.toString())) {
                            for (const x of fetchMenu) {
                                if (x.formControlId == item._id?.toString()) {
                                    x.formControlId = finalData[0]._id?.toString();
                                }
                            }
                        }

                    }
                    for (let index = 0; index < reportCriteriaData.length; index++) {
                        // Get the current item
                        let item = reportCriteriaData[index];
                        // Check if the item's _id exists in menuDataGroupedby
                        console.log(menuDataGroupedbyReportId.has(item._id?.toString()));
                        // Create a shallow copy of the item
                        let insertData = { ...item };
                        // Delete the _id and id properties from the insertData object
                        delete insertData._id;
                        delete insertData.id;
                        // Add the insertData object to the tblFormcontrol collection
                        let finalData = await model.AddData("tblReportSearchCriteria", "tblReportSearchCriteria", [insertData], res);
                        // If the item's _id exists in menuDataGroupedby,
                        // update the formControlId of the corresponding item in fetchMenu
                        if (menuDataGroupedbyReportId.has(item._id?.toString())) {
                            for (const x of fetchMenu) {
                                if (x.reportId == item._id?.toString()) {
                                    x.reportId = finalData[0]._id?.toString();
                                }
                            }
                        }
                    }
                    function creatingTheNestedJSON(params) {
                        let result = []
                        result = params.filter((data) => data.parentMenuId == null)
                        function toSearchChild(parent) {
                            let data = []
                            data = params.filter((data) => data.parentMenuId == parent._id.toString())
                            for (const iterator of data) {
                                iterator.child = toSearchChild(iterator)
                            }
                            return data
                        }
                        for (const iterator of result) {
                            // iterator.options = toSearchChild(iterator)
                            iterator.child = toSearchChild(iterator)
                        }

                        return result
                    }
                    fetchMenu = creatingTheNestedJSON(fetchMenu)
                    async function insertMenu(params) {

                        async function childInsert(data, parentMenuId) {
                            for (let idx = 0; idx < data.length; idx++) {
                                let iterator = data[idx];
                                let insertData = { ...iterator }
                                delete insertData._id
                                delete insertData.id
                                delete insertData.child
                                insertData.parentMenuId = parentMenuId
                                const finalData = await model.AddData("tblMenu1", "tblMenu1", [insertData])
                                if (iterator.child) {
                                    await childInsert(iterator.child, finalData[0]?._id?.toString())
                                }
                                // delete iterator.child

                            }
                            return data
                        }

                        for (let index = 0; index < params.length; index++) {
                            console.log("reached")
                            let element = params[index];
                            let insertData = { ...element }
                            delete insertData._id
                            delete insertData.id
                            delete insertData.child
                            // insertData.parentMenuId = null
                            const finalData = await model.AddData("tblMenu1", "tblMenu1", [insertData])
                            await childInsert(element.child, finalData[0]?._id?.toString())
                            delete insertData.child
                            console.log(insertData);
                        }
                        return params
                    }
                    fetchMenu = await insertMenu(fetchMenu)
                    // Coping of Port company, gernal Leadger, country
                    let copDataQuery = [
                        model.AggregateFetchData("tblCompany", "tblCompany", [
                            {
                                $match: {
                                    clientCode: req.clientCode,
                                    ownCompany: "y",
                                    status: 1
                                }
                            },
                            {
                                $addFields: {
                                    clientCode: clientCode,
                                    tblCompanyBranch: [],
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    id: 0
                                }
                            }
                        ], res),
                        //   model.AggregateFetchData("tblCountry", "tblCountry",[
                        //     {
                        //       $match: {
                        //         clientCode:req.clientCode,
                        //         status: 1
                        //       }
                        //     },
                        //     {
                        //       $addFields: {
                        //         clientCode: clientCode
                        //       }
                        //     },
                        //     {
                        //       $project: {
                        //         _id: 0,
                        //         id: 0
                        //       }
                        //     }
                        //   ], res),
                        //   model.AggregateFetchData("tblPort", "tblPort",[
                        //     {
                        //       $match: {
                        //         clientCode: req.clientCode,
                        //         status:1
                        //       }
                        //     },
                        //     {
                        //       $addFields: {
                        //         clientCode: clientCode
                        //       }
                        //     },
                        //     {
                        //       $project: {
                        //         _id: 0,
                        //         id: 0
                        //       }
                        //     }
                        //   ], res),
                        model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                            {
                                $match: {
                                    clientCode: req.clientCode,
                                    status: 1
                                }
                            },
                            {
                                $addFields: {
                                    clientCode: clientCode,
                                    tblGlGst: [],
                                    tblGlTax: [],
                                    tblPartyTds: []
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    id: 0
                                }
                            }
                        ])

                    ]

                    let data = await Promise.all(copDataQuery)

                    let dataTOinsert = [
                        model.AddData("tblCompany", "tblCompany", data[0], res),
                        // model.AddData("tblCountry", "tblCountry", data[1], res),
                        // model.AddData("tblPort", "tblPort", data[2], res),
                        model.AddData("tblGeneralLedger", "tblGeneralLedger", data[1], res)]

                    await Promise.all(dataTOinsert)

                    res.redirect(307, "/api/master/copyMasterDataAndMasterList")


                    // await this.roleCopyToNewClient(req, res)

                    // res.send({ success: true, data: fetchMenu })
                } catch (error) {
                    res.status(500).send({ success: false, message: "Something Went Worng....!", data: error.message })
                }
            }
        })
    },
    copyMasterDataWithMasterlist: async (req, res) => {
        const validationRule = {
            clientCode: "required"
        }
        validate(req.body, validationRule, {}, async (errors, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation error",
                    data: errors
                })
            }
            else {
                try {
                    const { clientCode } = req.body
                    let fethchMasterList = await model.AggregateFetchData("tblMasterList", "tblMasterList", [{ $match: { status: 1, clientCode: req.clientCode } }, { $addFields: { clientCode: clientCode, createdDate: new Date(), updatedDate: new Date(), createdBy: Number(req.userId), updatedBy: Number(req.userId) } }], res)
                    for (const masterListData of fethchMasterList) {

                        let masterData = await model.AggregateFetchData("tblMasterData", "tblMasterData", [{ $match: { tblMasterListId: masterListData._id.toString(), clientCode: req.clientCode } }, { $addFields: { clientCode: clientCode, createdDate: new Date(), updatedDate: new Date(), createdBy: Number(req.userId), updatedBy: Number(req.userId) } }, { $project: { _id: 0, id: 0 } }], res)
                        console.log(masterData);
                        delete masterListData._id
                        delete masterListData.id
                        let insertData = await model.AddData("tblMasterList", "tblMasterList", [masterListData], res)
                        if (insertData.length > 0) {
                            for (const iterator of masterData) {
                                // delete iterator._id
                                // delete iterator.id
                                iterator.tblMasterListId = insertData[0]._id.toString()
                            }
                            await model.AddData("tblMasterData", "tblMasterData", masterData, res)
                        }
                    }
                    res.redirect(307, "/api/master/roleCopy")
                    // res.send({ success: true, data: fethchMasterList })
                } catch (error) {
                    res.send({ success: false, message: "Something Went Worng....!", data: error.message })
                }
            }
        })
    },
    roleCopyToNewClient: async (req, res) => {
        const validationRule = {
            clientCode: "required"
        }
        validate(req.body, validationRule, {}, async (errors, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation error",
                    data: errors
                })
            }
            else {
                try {
                    const { clientCode } = req.body
                    let query = [
                        {
                            $match: {
                                clientCode: req.clientCode
                            }
                        },
                        {
                            $unwind: {
                                path: "$menuAccess",
                                includeArrayIndex: "string",
                                preserveNullAndEmptyArrays: false
                            }
                        },
                        {
                            $lookup: {
                                from: "tblMenu1",
                                let: {
                                    id: {
                                        $toObjectId: "$menuAccess.menuId"
                                    }
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", "$$id"]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMenu1",
                                            let: {
                                                id: {
                                                    $toObjectId: "$parentMenuId"
                                                }
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ["$_id", "$$id"]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "parentData"
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$parentData"
                                        }
                                    }
                                ],
                                as: "oldMenuData"
                            }
                        },
                        {
                            $unwind: {
                                path: "$oldMenuData",
                                includeArrayIndex: "string",
                                preserveNullAndEmptyArrays: false
                            }
                        },
                        {
                            $lookup: {
                                from: "tblMenu1",
                                let: {
                                    name: "$oldMenuData.menuName",
                                    parentName:
                                        "$oldMenuData.parentData.menuName"
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $eq: ["$menuName", "$$name"]
                                                    },
                                                    {
                                                        $eq: ["$clientCode", clientCode]
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMenu1",
                                            let: {
                                                id: {
                                                    $toObjectId: "$parentMenuId"
                                                }
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ["$_id", "$$id"]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "parentData"
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$parentData"
                                        }
                                    },
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $eq: [
                                                            "$parentData.menuName",
                                                            "$$parentName"
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: "MenuData"
                            }
                        },
                        {
                            $unwind: {
                                path: "$MenuData",
                                includeArrayIndex: "string",
                                preserveNullAndEmptyArrays: false
                            }
                        },
                        {
                            $set: {
                                "menuAccess.menuId": {
                                    $toString: "$MenuData._id"
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                menuAccess: {
                                    $push: "$menuAccess"
                                }
                            }
                        }
                    ]
                    let fetchRoles = await model.AggregateFetchData("tblRole", "tblRole", query, res)
                    let Data = {
                        clientCode: req.body.clientCode,
                        menuAccess: fetchRoles[0].menuAccess,
                        status: 1,
                        createdDate: new Date(),
                        "roleName": "Syscon",
                    }

                    let insertData = await model.AddData("tblRole", "tblRole", [Data], res)
                    let data = await model.AggregateFetchData("tblUser", "tblUser", [
                        {
                            $match: {
                                status: 1,
                                clientCode: "NCLP",
                                email: {
                                    $regex: "@sysconinfotech.com"
                                }
                            }
                        },
                        { $addFields: { clientCode: req.body.clientCode } },
                        {
                            $project: {
                                _id: 0,
                                id: 0
                            }
                        }
                    ], res)

                    // let adduser = await model.AddData("tblUser", "tblUser", data, res)
                    // res.send({ success: true, data: [], message: "Setup Completed" })
                    res.redirect(307, "/api/master/countryAndPort")
                }
                catch (error) {
                    res.send({ success: false, message: "Something Went Worng....!", data: error.message })
                }
            }
        })

    },
    copyCountryAndPortWithRegion: async (req, res) => {
        const validationRule = {
            clientCode: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(412).send({
                    success: false,
                    message: "Validation failed",
                    data: err
                })
            } else {
                const { clientCode } = req.body
                let fetchCountry = await model.AggregateFetchData("tblCountry", "tblCountry", [
                    {
                        $match: {
                            status: 1,
                            clientCode: req.clientCode,
                        }
                    },
                    { $addFields: { clientCode: clientCode, createdDate: new Date(), updatedDate: new Date(), createdBy: Number(req.userId), updatedBy: Number(req.userId) } }, { $project: { id: 0 } },

                ], res)
                let countryids = []
                for (const item of fetchCountry) {
                    let fetPortData = await model.AggregateFetchData("tblPort", "tblPort", [
                        {
                            $match: {
                                status: 1,
                                clientCode: req.clientCode,
                                countryId: item._id.toString()
                            }
                        },
                        { $addFields: { clientCode: clientCode, createdDate: new Date(), updatedDate: new Date(), createdBy: Number(req.userId), updatedBy: Number(req.userId) } }, { $project: { _id: 0, id: 0 } }
                    ], res)
                    countryids.push(item._id.toString())
                    delete item._id
                    let insertDataCountry = await model.AddData("tblCountry", "tblCountry", [item], res)
                    fetPortData = fetPortData.map(portIem => ({ ...portIem, countryId: insertDataCountry[0]._id.toString() }));
                    let portTypeId = new Set(fetPortData.map(portIem => createObjectId(portIem.portTypeId)))
                    let masterData = await model.AggregateFetchData("tblMasterData", "tblMasterData",
                        [
                            {
                                $match: {
                                    clientCode: req.clientCode,
                                    _id: { $in: Array.from(portTypeId) }
                                }
                            },
                            {
                                $lookup: {
                                    from: "tblMasterData",
                                    let: { name: "$name", code: "$code" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        { $eq: ["$name", "$$name"] },
                                                        { $eq: ["$code", "$$code"] },
                                                        { $eq: ["$clientCode", clientCode] }
                                                    ]
                                                }
                                            }
                                        }
                                    ],

                                    as: "masterData"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$masterData",
                                }
                            }
                        ]
                    )
                    for (let index = 0; index < fetPortData.length; index++) {
                        let data = masterData.find((e) => e._id.toString() == fetPortData[index].portTypeId.toString())
                        fetPortData[index].portTypeId = data?.masterData?._id?.toString() || fetPortData[index].portTypeId
                    }
                    console.log("fetPortData", fetPortData);
                    let insertDataPort = await model.AddData("tblPort", "tblPort", fetPortData, res)
                }
                let portdataofWithOutCountry = await model.AggregateFetchData("tblPort", "tblPort", [
                    {
                        $match: {
                            status: 1,
                            clientCode: req.clientCode,
                            countryId: { $nin: countryids }
                        }
                    },
                    { $addFields: { clientCode: clientCode, createdDate: new Date(), updatedDate: new Date(), createdBy: Number(req.userId), updatedBy: Number(req.userId) } }, { $project: { _id: 0, id: 0 } }
                ], res)
                let portTypeId = new Set(portdataofWithOutCountry.map(portIem => createObjectId(portIem.portTypeId)))
                let masterData = await model.AggregateFetchData("tblMasterData", "tblMasterData",
                    [
                        {
                            $match: {
                                clientCode: req.clientCode,
                                _id: { $in: Array.from(portTypeId) }
                            }
                        },
                        {
                            $lookup: {
                                from: "tblMasterData",
                                let: { name: "$name", code: "$code" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$name", "$$name"] },
                                                    { $eq: ["$code", "$$code"] },
                                                    { $eq: ["$clientCode", clientCode] }
                                                ]
                                            }
                                        }
                                    }
                                ],

                                as: "masterData"
                            }
                        },
                        {
                            $unwind: {
                                path: "$masterData",
                            }
                        }
                    ]
                )
                for (let index = 0; index < portdataofWithOutCountry.length; index++) {
                    let data = masterData.find((e) => e._id.toString() == portdataofWithOutCountry[index].portTypeId.toString())
                    portdataofWithOutCountry[index].portTypeId = data?.masterData?._id?.toString() || portdataofWithOutCountry[index].portTypeId
                }
                await model.AddData("tblPort", "tblPort", portdataofWithOutCountry, res)
                res.send({ success: true, data: [], message: "Setup Completed" })

            }
        })

    },
    sendDocument: async (req, res) => {
        try {
            const { attachments } = req.body
            for (const file of attachments || []) {
                file.path = `./public/${file.path}`
                file.filename = file.path.split("/").pop();
            }

            sendMail(req.body.to, req.body.subject, req.body.text, undefined, req.body.attachments)
            res.send({ success: true, data: [], message: "Mail Sent" })

        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    }

}