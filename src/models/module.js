const mongoose = require("../config/MongoConnection.js");
const monsgesss = require("mongoose")
const Schema = require("../schema/Newschema.js");
const { idCounter } = require("../helper/counter");
const NodeCache = require('node-cache');
const fs = require('fs');
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const { findFieldInJSON } = require('../helper/keyToFindInJSON.js');
const e = require("connect-flash");
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
function truncateDecimal(value, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.floor(value * factor) / factor;
}
async function getDataFromDynamicCollection(modal, query) {
    // Generate a unique cache key based on collection name and query
    const cacheKey = `${modal.collection.collectionName}-${JSON.stringify(query)}`;

    // Try to fetch cached data
    const cachedData = myCache.get(cacheKey);

    if (cachedData !== undefined) {
        //        console.log('Data fetched from cache');
        return cachedData;
    }

    // If not found in cache, get from MongoDB
    // const dynamicModel = connection.model(collectionName, schema);

    const data = await modal.aggregate(query, { allowDiskUse: true });

    // Cache the fetched data
    myCache.set(cacheKey, data);

    //    console.log('Data fetched from MongoDB');
    return data;
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
        return convertStringToNumberIfNeeded(companyId);
    }
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
async function fetchDataForDropdown(dropdownData, value, res) {
    let dropdownMatch = { status: 1 };
    //     if (typeof dropdownData.dropdownFilter !== "undefined" && dropdownData.dropdownFilter !== null && dropdownData.dropdownFilter !== "") {
    // //        console.log(JSON.parse(fixJsonLikeString(dropdownData.dropdownFilter)));
    //         // let temp = JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"'));
    //         let temp = JSON.parse(fixJsonLikeString(dropdownData.dropdownFilter));
    // //        console.log(typeof temp);
    //         Object.assign(dropdownMatch, temp);
    // //        console.log(dropdownMatch);
    //     }
    //    //    dropdownData.dropdownFilter!==null&&console.log("DropdownFilter",JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"')));
    let dropdownQuery = [{ $match: dropdownMatch }];
    if (dropdownData.referenceTable === "tblMenu") {
        //        console.log("dropdownData.referenceTable", dropdownData.referenceTable);
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
        // let data = await model.AggregateFetchData(dropdownData.referenceTable, dropdownData.referenceTable, dropdownQuery, res);
        // let menuData = data.flatMap(doc => extractMenuNames(doc))
        //        // console.log("menu", menuData.length);
        return []
    } else {


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
        dropdownQuery.push({ $match: { id: createObjectId(value) } });
        let mongoModel = mongoose.model(referenceTable[0], Schema.any)
        return await mongoModel.aggregate(dropdownQuery)
        // await model.AggregateFetchData(referenceTable[0], dropdownData.referenceTable, dropdownQuery, res);
        // return []
    }
}

async function updateActualValue(newData, actualValue, actualValuePrevious, previousChanges, tblFormcontrolData) {
    // Iterate over each key in the newData object
    for (const key of Object?.keys(newData ?? {})) {
        // Check if the current value is an object and not an array
        if (typeof newData[key] === 'object' && !Array.isArray(newData[key])) {
            // Initialize the corresponding key in actualValue as an object if it doesn't exist
            actualValue[key] = actualValue[key] || {};
            actualValuePrevious[key] = actualValuePrevious[key] || {};
            // Recursively update the nested object
            await updateActualValue(newData[key], actualValue[key], actualValuePrevious[key], typeof previousChanges == "object" ? previousChanges[key] : "", tblFormcontrolData);
        } else {
            // For non-object or array values, process the dropdown or copy the value directly
            const formControlValue = findFieldInJSON(tblFormcontrolData, key);
            if (formControlValue && formControlValue.controlname.toLowerCase() === 'dropdown') {
                // If it's a dropdown, fetch the data
                const data = await fetchDataForDropdown(formControlValue, newData[key]);
                //                console.log("previousChanges[key]", typeof previousChanges == "object" ? previousChanges[key] : "");
                // const dataprevious = await fetchDataForDropdown(formControlValue, previousChanges[key]||"");
                const dataprevious = await fetchDataForDropdown(formControlValue, typeof previousChanges == "object" ? previousChanges[key] : "");
                //                console.log("dataprevious", dataprevious[0]);
                actualValue[formControlValue.yourlabel] = data[0]?.value || newData[key]; // Set the fetched or fallback value
                actualValuePrevious[formControlValue.yourlabel] = dataprevious[0]?.value || null; // Set the fetched or fallback value
            } else {
                // If not a dropdown or no formControlValue found, copy the value directly
                actualValue[formControlValue?.yourlabel] = newData[key];
                actualValuePrevious[formControlValue?.yourlabel] = typeof previousChanges == "object" ? previousChanges[key] : null;
            }
        }
    }
}





exports.AggregateFetchData = async (collectionName, schema, query, res) => {

    return new Promise(function (resolve, reject) {
        let Schemavar = Schema[schema] || Schema.any
        let model
        if (mongoose.models[collectionName]) {
            delete mongoose.models[collectionName];
        }

        model = mongoose.model(collectionName, Schemavar);
        //        console.log(model);
        //        console.log('model.....................123');

        model.aggregate(query).allowDiskUse(true).then((result) => {
            //            // console.log(result);
            resolve(result);
        })
            .catch((err) => {
                //                console.log(err);
                reject(err);
            })
    });
};

exports.validateBeforeSubmit = async (requestedJson) => {
    // write your won validation logic
    //    //console.log(requstedJson);
    //return {validation:true,msg:"ashfk"};
    try {
        // Example custom validation logic

        if (requestedJson.roleName) {
            return {
                validation: true,
                msg: 'Role name is required.',
            };
        }

        // Add more custom validation logic as needed

        //        console.log(requestedJson);
        return {
            validation: true,
            msg: 'Validation successful.',
        };
    } catch (error) {
        console.error(error);
        return {
            validation: false,
            msg: 'Internal server error during validation.',
        };
    }
};



exports.SearchAggregateFetchData = async (collectionName, schema, query, res) => {

    return new Promise(function (resolve, reject) {
        let Schemavar = Schema[schema] || Schema.any
        let model = mongoose.model(collectionName, Schemavar);
        //        console.log(model);
        //        console.log('model.....................123');

        model.find(query).allowDiskUse(true).then((result) => {
            //            console.log(result);
            resolve(result);
        })
            .catch((err) => {
                //                console.log(err);
                reject(err);
            })
    });
};

exports.AggregateFetchDatady = async (collectionName, schema, query, res) => {
    return new Promise(function (resolve, reject) {


        let model = mongoose.model(collectionName, Schema[schema]);

        //        console.log(model.schema.obj);
        //        console.log('model.....................');

        // Analyze the schema to find fields with fk = 'yes'
        // This might involve fetching the schema or having it predefined
        // For each such field, add a $lookup stage to your query
        for (let fieldname in model.schema.obj) {
            let field = model.schema.obj[fieldname];
            //            console.log(field);
            //            console.log('field.....................');
            if (field.options.fk === 'yes') {
                const lookupStage = {
                    $lookup: {
                        from: 'tbl_voucher_ledger', // This should be dynamic based on your schema
                        localField: field.voucher_ledger_id, // The field in the current collection
                        foreignField: 'voucher_ledger_id', // The field in the foreign collection
                        as: field.name + 'GL_account' // The name for the output array
                    }
                };
                query.push(lookupStage);
            }
        }

        //        console.log(model);
        //        console.log('model.....................');

        model.aggregate(query).allowDiskUse(true).then((result) => {
            //            console.log(result);
            resolve(result);
        })
            .catch((err) => {
                //                console.log(err);
                reject(err);
            })
    });
};


exports.AddData = async (collectionName, schema, data, res) => {

    return new Promise(async function (resolve, reject) {
        //        // console.log(query);
        let Schemavar = Schema[schema] || Schema.any
        let model = mongoose.model(collectionName, Schemavar);
        if (Array.isArray(data)) {
            // data.map(async (item, idx) => {
            //     idx === 0 ? item.id = await idCounter(model, 'id') : item.id = data[idx - 1].id + 1;
            // })
            for (let i = 0; i < data.length; i++) {

                data[i];
                if (i === 0) {
                    //                    console.log(await idCounter(model, 'id'));

                }
                i === 0 ? data[i].id = await idCounter(model, 'id') : data[i].id = data[i - 1].id + 1

            }
            //            console.log(data);
            model.insertMany(data).then((result) => {
                resolve(result);
            })
                .catch((err) => {
                    //                    console.log(err);
                    reject(err);
                })
        } else {
            data.ids = await idCounter(model, 'ids');
            //            console.log(data);
            model.insertMany([data]).then((result) => {
                resolve(result);
            })
                .catch((err) => {
                    //                    console.log(err);
                    reject(err);
                })

        }
    });

};

exports.updateIfAvailableElseInsertMaster = async (collectionName, schema, data, req, menuID,) => {
    // return console.log(data);

    let tblAuditLog = Schema.tblAuditLog;

    const Log = mongoose.model('tblAuditLog', tblAuditLog);
    //    console.log("menuID", createObjectId(menuID));
    //    console.log(data);
    //    console.log("req", req);

    return new Promise(async function (resolve, reject) {
        if (mongoose.models[collectionName]) {
            delete mongoose.models[collectionName];
            // delete mongoose.modelSchemas[collectionName];
        }
        let model
        if (typeof schema == "object") {
            model = mongoose.model(collectionName, mongoose.Schema(schema));
            // console.log("schema", model);
        }
        else {

            let finalschema = Schema[schema] || Schema["any"];
            model = mongoose.model(collectionName, finalschema);
        }

        // const writeLogToFile = (logEntry) => {
        //     fs.appendFile('log.txt', JSON.stringify(logEntry) + '\n', (err) => {
        //         if (err) throw err;
        //     });
        // };
        let tblFormcontrolmodel
        if (mongoose.models['tblFormcontrol']) {
            tblFormcontrolmodel = mongoose.models['tblFormcontrol'];

        }
        else {
            tblFormcontrolmodel = mongoose.model('tblFormcontrol', Schema.mainTableSchema);
        }
        let tblFormcontrolData = await tblFormcontrolmodel.aggregate([
            { $match: { $or: [{ _id: createObjectId(menuID) }, { menuID: menuID }], clientCode: data.clientCode } },
            // {$project: {_id: 0}}
        ]);
        tblFormcontrolData = tblFormcontrolData[0];
        const logAction = async (action, table, documentId, previousChanges, newData, ipAddress, createdBy, updatedBy, clientCode) => {
            //            console.log("newData", newData);
            let actualValue = {};
            let actualPreviousValue = {};
            if (menuID !== "CreateFormcontrol" && action !== "delete") {

                await updateActualValue(newData, actualValue, actualPreviousValue, previousChanges, tblFormcontrolData);
            }

            //            // console.log("actualPreviousValue", actualPreviousValue);



            //            // console.log("actualValue", actualValue);
            //            // console.log("data", data);
            let logEntry = new Log({
                id: await idCounter(Log, 'id'),
                action: action,
                tableName: req?.tableName || table,
                documentId: documentId,
                previousField: previousChanges,
                previousFieldsForReport: actualPreviousValue,
                updateFields: newData,
                updatedValuesForReport: actualValue,
                createdDate: new Date(),
                updatedDate: new Date(),
                createdBy: createdBy,
                updatedBy: updatedBy,
                clientCode: clientCode,
                ipAddress: ipAddress,
                AuditKey: tblFormcontrolData?.fields.find((field) => field.isAuditLog == true)?.yourlabel || null,
                AuditValue: data[tblFormcontrolData?.fields.find((field) => field.isAuditLog == true)?.fieldname] || null
            });
            await logEntry.save();

        };

        var isUpdate = data.id != null && data.id != '';
        let originalData = null;

        if (isUpdate) {
            originalData = await model.findOne({ id: data.id }).lean();
            if (!originalData) {
                isUpdate = false;
            }
        }

        //        // console.log("tblFormcontrolData", tblFormcontrolData);

        const detectChanges = (original, updated) => {
            let changes = {};
            Object.keys(updated).forEach(key => {
                if (!original.hasOwnProperty(key) || original[key] !== updated[key]) {
                    if (typeof updated[key] === 'object' && updated[key] !== null) {
                        const subChanges = detectChanges(original[key] || {}, updated[key]);
                        if (Object.keys(subChanges).length > 0) {
                            changes[key] = subChanges;
                        }
                    } else {
                        changes[key] = updated[key];
                    }
                }
            });

            // Check if 'tableName' has changed
            if (original.tableName !== updated.tableName) {
                changes.tableName = {

                    tableName: updated.tableName,
                };
            }

            return changes;
        };



        if (isUpdate) {

            // Check if it's a delete operation
            if (data.status === 2 && data.id) {
                // Log the "delete" action and include the document ID
                // const ipAddress = "10.20.0.161";
                const documentId = data.id;
                model.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).then((result) => {
                    const ipAddress = req.ip || req.connection.remoteAddress || "10.20.0.161";
                    data = result
                    logAction('delete', data.tableName, documentId, {}, {}, ipAddress, result?.createdBy, result?.updatedBy, result?.clientCode);
                    resolve(result);
                }).catch((err) => {
                    //                    console.log(err);
                    reject(err);
                });

                // resolve({ message: 'Document deleted' });
            } else {
                // It's an update operation
                model.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).then((result) => {
                    //const ipAddress = req.ip || req.connection.remoteAddress;
                    // const ipAddress = "13.12.0.16";
                    const ipAddress = req.ip || req.connection.remoteAddress || "10.20.0.161";
                    const updatedData = result.toObject();
                    const changes = detectChanges(originalData, updatedData);

                    // Filter and keep only the updated fields in previousChanges
                    let previousFields = {};

                    // Iterate through updated fields and check if they were changed
                    for (let key in data) {
                        if (originalData[key] !== data[key]) {
                            previousFields[key] = originalData[key];
                        }
                    }

                    const fieldsToExclude = ['createdDate', 'updatedDate', 'createdBy', 'updatedBy', 'clientCode'];
                    fieldsToExclude.forEach(field => {
                        delete previousFields[field];
                        delete changes[field];
                    });


                    logAction('update', collectionName, data.id, previousFields, changes, ipAddress, result?.createdBy, result?.updatedBy, result?.clientCode);
                    resolve(result);
                }).catch((err) => {
                    //                    console.log(err);
                    reject(err);
                });
            }
        }
        else {
            data.id == "" ? data.id = await idCounter(model, 'id') : "";
            let newData = new model(data);
            //    try {
            //  let data=await model.findOneAndUpdate({ id: data.id ,status:Number(process.env.ACTIVE_STATUS)}, data, { new: true, upsert: true })
            //  const ipAddress = "122222222222";
            //  //const ipAddress = "122222222222"
            //            //  console.log(savedData);
            //            //  console.log('savedata');

            //  // Since it's an insert, previousChanges should be an empty object
            //  let previousChanges = {};

            //   await logAction('insert', savedData.tableName, savedData.id, previousChanges, {}, ipAddress);
            //     if (data) {
            //         resolve(data);
            //     }
            //    } catch (error) {
            //     resolve(error);
            //    }


            newData.save().then(async (savedData) => {
                // const ipAddress = "122222222222";
                //const ipAddress = "122222222222"
                const ipAddress = req.ip || req.connection.remoteAddress || "10.20.0.161";
                //                console.log(savedData);
                //                console.log('savedata');

                // Since it's an insert, previousChanges should be an empty object
                let previousChanges = {};

                await logAction('insert', collectionName, savedData.id, previousChanges, {}, ipAddress, savedData?.createdBy, savedData?.updatedBy, savedData?.clientCode);

                resolve(savedData);
            }).catch((err) => {
                //                console.log(err);
                reject(err);
            });
        }
    });
};
exports.updateIfAvailableElseInsertMasterBulk = async (collectionName, schema, dataArray, req) => {
    const Log = mongoose.model('tblAuditLog', Schema.tblAuditLog);
    if (mongoose.models[collectionName]) {
        delete mongoose.models[collectionName];
        // delete mongoose.modelSchemas[collectionName];
    }
    // const model = mongoose.models[collectionName] || mongoose.model(collectionName, mongoose.Schema(schema))|| mongoose.model(collectionName, Schema.any);
    let model
    if (typeof schema == "object") {
        model = mongoose.model(collectionName, mongoose.Schema(schema));
        // console.log("schema", model);
    }
    else {

        let finalschema = Schema["any"];
        model = mongoose.model(collectionName, finalschema);
    }
    let id = await idCounter(model, 'id')
    let bulkOps = [];
    let logBulkOps = [];
    // const writeLogToFile = (logEntry) => {
    //     fs.appendFile('log.txt', JSON.stringify(logEntry) + '\n', (err) => {
    //         if (err) throw err;
    //     });
    // };
    const detectChanges = (original, updated) => {
        let changes = {};
        Object.keys(updated).forEach(key => {
            if (!original.hasOwnProperty(key) || original[key] !== updated[key]) {
                if (typeof updated[key] === 'object' && updated[key] !== null) {
                    const subChanges = detectChanges(original[key] || {}, updated[key]);
                    if (Object.keys(subChanges).length > 0) {
                        changes[key] = subChanges;
                    }
                } else {
                    changes[key] = updated[key];
                }
            }
        });

        // Check if 'tableName' has changed
        if (original.tableName !== updated.tableName) {
            changes.tableName = {

                tableName: updated.tableName,
            };
        }

        return changes;
    };
    const logAction = async (action, table, documentId, previousChanges, newData, ipAddress) => {
        let logEntry = new Log({
            action: action,
            tableName: table,
            documentId: documentId,
            previousField: previousChanges,
            updateFields: newData,
            ipAdress: ipAddress
        });
        // await logEntry.save();
        // writeLogToFile(logEntry);
    };
    const prepareLogEntry = (action, table, documentId, previousChanges, newData, ipAddress) => {
        return {
            action,
            tableName: table,
            documentId,
            previousField: previousChanges,
            updateFields: newData,
            ipadress: ipAddress,
            timestamp: new Date()
        };
    };

    for (let idx = 0; idx < dataArray.length; idx++) {
        let data = dataArray[idx]
        var isUpdate = data.id != null && data.id != '';
        let originalData = null;

        if (isUpdate) {
            originalData = await model.findOne({ id: data.id }).lean();
            if (!originalData) {
                isUpdate = false;
            }
        }

        if (isUpdate) {
            // Log the 'update' action
            if (data.isDelete === 2 && data.id) {
                // Log the "delete" action and include the document ID
                // const ipAddress = "10.20.0.161";
                const ipAddress = req.ip || req.connection.remoteAddress || "10.20.0.161";
                const documentId = data.id;

                // logAction('delete', data.tableName, documentId, {}, {}, ipAddress);
                let logEntry = prepareLogEntry('delete', data.tableName, documentId, {}, {}, ipAddress);
                logBulkOps.push({ insertOne: { document: logEntry } });
                resolve({ message: 'Document deleted' });
            } else {
                // It's an update operation
                //const ipAddress = req.ip || req.connection.remoteAddress;
                // const ipAddress = "13.12.0.16";
                const ipAddress = req.ip || req.connection.remoteAddress || "10.20.0.161";
                const updatedData = data;
                const changes = detectChanges(originalData, updatedData);

                // Filter and keep only the updated fields in previousChanges
                let previousFields = {};

                // Iterate through updated fields and check if they were changed
                for (let key in data) {
                    if (originalData[key] !== data[key]) {
                        previousFields[key] = originalData[key];
                    }
                }

                const fieldsToExclude = ['createdDate', 'updatedDate'];
                fieldsToExclude.forEach(field => {
                    delete previousFields[field];
                    delete changes[field];
                });


                // logAction('update', data.tableName, data.id, previousFields, changes, ipAddress);
                let logEntry = prepareLogEntry('update', data.tableName, data.id, previousFields, changes, ipAddress);
                logBulkOps.push({ insertOne: { document: logEntry } });

            }
            // Add to bulk operation
            bulkOps.push({
                updateOne: {
                    filter: { id: data.id },
                    update: data,
                    upsert: true
                }
            });
        } else {
            if (idx == 0 && (data.id == "" || data.id == null)) {
                //                console.log("id Generation")
                //                console.log(id);
                data.id = id
                // finalarray.push(data)
            }

            else {
                //                console.log("Id Increment");
                //                console.log(idx);
                //                console.log("ID", id);
                //                console.log(dataArray[idx - 1]);
                //                console.log(Number(dataArray[idx - 1].id));
                //                console.log(Number(dataArray[idx - 1].id) + 1);
                data.id = Number(dataArray[idx - 1].id) + 1
                // id++
            }
            data.createdDate = new Date(),

                // data.tableName= req.body.tableName,

                data.status = Number(data.status) || Number(process.env.ACTIVE_STATUS),
                data.updatedDate = new Date(),
                data.updatedBy = data.updatedBy || null
                ,
                // logAction('insert', data.tableName, data.id, {}, {}, req.ip);

                bulkOps.push({
                    insertOne: {
                        document: data
                    }
                });
            let logEntry = prepareLogEntry('insert', data.tableName, data.id, {}, {}, req.ip);
            logBulkOps.push({ insertOne: { document: logEntry } });
        }
    }

    try {
        //        console.log('Starting bulk operation');
        // const result = await model.bulkWrite(bulkOps, { ordered: false });
        //        // console.log('Bulk operation completed', result);
        // const reseults = Promise.all([model.bulkWrite(bulkOps, { ordered: false }), Log.bulkWrite(logBulkOps, { ordered: false })]);
        // const reseults = await model.bulkWrite(bulkOps, { ordered: false });
        const result = await model.bulkWrite(bulkOps, { ordered: false });
        //        console.log(result);
        if (result.insertedCount > 0) {
            let errordata = []
            if (result?.mongoose?.validationErrors) {
                result.mongoose.validationErrors.forEach(element => {
                    errordata.push({ errorMessage: element.error.message, data: dataArray[element.index] })
                })
                //                console.log("Error", errordata)
            }
            // Log.bulkWrite(logBulkOps, { ordered: false })
            return { success: errordata.length == 0, message: errordata.length == 0 ? 'Data Inserted SuccessFully' : 'Data Partially Inserted SuccessFully and fatal Documents are in error section', data: result, error: errordata };
        }
        else if (result.insertedCount == 0) {
            //            console.log("hello");
            let data = await model.insertMany(dataArray)
            // return { success:false ,message: 'Data not Inserted SuccessFully',data:[],error:[] };
        }
        else {
            throw Error("Data Not Inserted SuccessFully")
        }


    } catch (err) {
        console.error('Error during bulk operation', err);
        throw err;
    }
};


exports.Update_If_Avilable_Else = async (collectionName, schemaName, data, res) => {
    return new Promise(async (resolve, reject) => {
        // Retrieve the schema based on the provided name, default to a generic schema if not found
        let finalSchema = Schema[schemaName] || Schema["any"];
        let model = mongoose.model(collectionName, finalSchema);

        // Check if the data is an array (bulk insert) or a single object (upsert)
        if (Array.isArray(data)) {
            // Insert multiple documents
            model.insertMany(data)
                .then(result => resolve(result))
                .catch(err => {
                    //                    console.log(err);
                    reject(err);
                });
        } else {
            // Upsert a single document
            // If _id is provided, use it for update, otherwise, MongoDB generates a new _id
            let query = data._id ? { _id: data._id, status: 1 } : { status: 1 };
            model.findOneAndUpdate(query, data, { new: true, upsert: true })
                .then(result => resolve(result))
                .catch(err => {
                    //                    console.log(err);
                    reject(err);
                });
        }
    });
};



exports.updateIfAvailableElseInsert = async (collectionName, schema, data, indexes, res) => {

    return new Promise(async function (resolve, reject) {
        let finalschema = Schema[schema] || Schema.any
        let model
        if (mongoose.models[collectionName]) {
            delete mongoose.models[collectionName];
        }

        model = mongoose.model(collectionName, finalschema);
        // model.createIndexes([indexes])
        //        //     .then(() => console.log('Indexes created'))
        //     .catch((err) => console.error(err))
        indexes && indexes !== null ? finalschema.index(indexes) : finalschema.index({});
        if (Array.isArray(data)) {
            data.map(async (item, idx) => {
                idx === 0 ? item.id = await idCounter(model, 'id') : item.id = data[idx - 1].id + 1;
            })

            model.insertMany(data).then((result) => {
                resolve(result);
            })
                .catch((err) => {
                    //                    console.log(err);
                    reject(err);
                })
        } else {
            data.id == "" || typeof data.id == "undefined" ? data.id = await idCounter(model, 'id') : "";
            model.findOneAndUpdate({ id: data.id, status: 1 }, data, { new: true, upsert: true }).then((result) => {
                resolve(result);
            })
                .catch((err) => {
                    //                    console.log(err);
                    reject(err);
                })

        }
    });
};
exports.Update = async (collectionName, schema, condition, data, filter, res) => {
    //    console.log(collectionName)
    //    console.log(schema);
    //    console.log(JSON.stringify(condition))
    //    console.log(JSON.stringify(data));
    let arrayfilter = filter || {}
    return new Promise(function (resolve, reject) {
        if (mongoose.models[collectionName]) {
            delete mongoose.models[collectionName];
        }
        //        // console.log(query);
        let model = mongoose.model(collectionName, Schema.any);
        model.updateMany(condition, data, arrayfilter).then((result) => {
            resolve(result);
        })
            .catch((err) => {
                //                console.log(err);
                reject(err);
            })

    });
};
exports.CheckUniqueData = async (collectionName, schema, KEY, value, res) => {

    return new Promise(function (resolve, reject) {

        let model = monsgesss.model(collectionName, Schema[schema]);
        model.aggregate([{ $match: { [KEY]: value, status: 1 } }]).then((result) => {
            result.length > 0 ? resolve(false) : resolve(true);
            // resolve(result);
        })
            .catch((err) => {
                //                console.log(err);
                reject(err);
            })
    });
};
exports.updateIfAvailableElseInsertMasterSP = async (collectionName, schema, data, req,) => {
    let masterSchemaModal = mongoose.model("master_schema", Schema.master_schema)// Fethching the data from master schema
    let dataForValidation = await masterSchemaModal.find({ status: 1, tableName: schema })
    if (dataForValidation.length == 0) {
        // Creating Dynamic Validation Rules according to master schema data
        throw new Error("No schema Found")
    }
    let insertData = {
        id: { type: Number, required: true, default: 0 },
        status: { type: Number, required: true, default: 1 },
        createdDate: { type: Date, required: true, default: Date.now() },
        createdBy: { type: String, required: false, default: null },
        updatedDate: { type: Date, required: true, default: Date.now() },
        updatedBy: { type: String, required: false, default: null },
        companyId: { type: String, required: false, default: null },
        brachId: { type: String, required: false, default: null },
        defaultFinYearId: { type: String, required: false, default: null },
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
                        //                        // console.log("this parent",this.parent());
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
                // field.isUnique && field.isUnique ? properties.unique = true : null
                if (field.isUnique && field.isUnique) {
                    properties.validate = {
                        validator: function (value) {
                            //                            console.log("this parent", this.parent());
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
                //                // console.log(insertData[child.tableName][0][subChild.tableName][0]);
            })
        })
        //        // console.log(insertData[child.tableName][0]);
    });

    let tblAuditLog = Schema.tblAuditLog;

    const Log = mongoose.model('tblAuditLog', tblAuditLog);

    // return new Promise(async function (resolve, reject) {
    //        //    return console.log(insertData.tblVoucherLedger[0].tblVoucherLedgerDetails);
    if (mongoose.models[collectionName]) {
        delete mongoose.models[collectionName];
        // delete mongoose.modelSchemas[collectionName];
    }
    let model
    // if (typeof schema == "object") {
    model = mongoose.model(collectionName, mongoose.Schema(insertData));
    // }
    // else {

    //     let finalschema = Schema[schema] || Schema["any"];
    //     model = mongoose.model(collectionName, finalschema);
    // }

    // const writeLogToFile = (logEntry) => {
    //     fs.appendFile('log.txt', JSON.stringify(logEntry) + '\n', (err) => {
    //         if (err) throw err;
    //     });
    // };

    const logAction = async (action, table, documentId, previousChanges, newData, ipAddress) => {
        let logEntry = new Log({
            id: await idCounter(Log, 'id'),
            action: action,
            tableName: req?.tableName || table,
            documentId: documentId,
            previousField: previousChanges,
            updateFields: newData,
            ipAdress: ipAddress
        });
        await logEntry.save();
        // writeLogToFile(logEntry);
    };

    var isUpdate = data.id != null && data.id != '';
    let originalData = null;

    if (isUpdate) {
        originalData = await model.findOne({ id: data.id }).lean();
        if (!originalData) {
            isUpdate = false;
        }
    }


    const detectChanges = (original, updated) => {
        let changes = {};
        Object.keys(updated).forEach(key => {
            if (!original.hasOwnProperty(key) || original[key] !== updated[key]) {
                if (typeof updated[key] === 'object' && updated[key] !== null) {
                    const subChanges = detectChanges(original[key] || {}, updated[key]);
                    if (Object.keys(subChanges).length > 0) {
                        changes[key] = subChanges;
                    }
                } else {
                    changes[key] = updated[key];
                }
            }
        });

        // Check if 'tableName' has changed
        if (original.tableName !== updated.tableName) {
            changes.tableName = {

                tableName: updated.tableName,
            };
        }

        return changes;
    };



    if (isUpdate) {

        // Check if it's a delete operation
        if (data.status === 2 && data.id) {
            // Log the "delete" action and include the document ID
            const ipAddress = "10.20.0.161";
            const documentId = data.id;
            model.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).then((result) => {
                //const ipAddress = req.ip || req.connection.remoteAddress;

                logAction('delete', data.tableName, documentId, {}, {}, ipAddress);
                return result;
            }).catch((err) => {
                //                    console.log(err);
                throw new Error(err);
            });

            // resolve({ message: 'Document deleted' });
        } else {
            // It's an update operation

            let condition = { id: data.id }
            model.findOneAndUpdate(condition, data, { new: true, upsert: true }).then((result) => {
                //const ipAddress = req.ip || req.connection.remoteAddress;
                const ipAddress = "13.12.0.16";
                const updatedData = result.toObject();
                const changes = detectChanges(originalData, updatedData);

                // Filter and keep only the updated fields in previousChanges
                let previousFields = {};

                // Iterate through updated fields and check if they were changed
                for (let key in data) {
                    if (originalData[key] !== data[key]) {
                        previousFields[key] = originalData[key];
                    }
                }

                const fieldsToExclude = ['createdDate', 'updatedDate'];
                fieldsToExclude.forEach(field => {
                    delete previousFields[field];
                    delete changes[field];
                });


                logAction('update', collectionName, data.id, previousFields, changes, ipAddress);
                resolve(result);
            }).catch((err) => {
                //                    console.log(err);
                reject(err);
            });
        }
    }
    else {
        typeof data.id == "undefined" || data.id == null ? data.id = await idCounter(model, 'id') : "";
        let newData = new model(data);
        try {
            let savedData= await newData.save()
            const ipAddress = "122222222222";
            //const ipAddress = "122222222222"
            //                console.log(savedData);
            //                console.log('savedata');
            
            // Since it's an insert, previousChanges should be an empty object
            let previousChanges = {};
            
            await logAction('insert', collectionName, savedData.id, previousChanges, {}, ipAddress);
            return savedData;
            if (data) {

                // return data
            }
        } catch (error) {
           throw new Error(error);
        }


       
    }
    // });
};

// Example model method for combined post-insertion validation and deletion
exports.validateAfterInsert = async (tableName, clientName, insertedData) => {
    try {


        //        console.log(insertedData);
        //        console.log("data11111111111111111111");
        // Implement your custom validation logic here
        // If validation fails, throw an error to indicate deletion
        // if (insertedData.code && insertedData.code <= 18) {
        //     throw new Error("code should be greater than 18"); 
        // }

        // Insert your additional validation logic here

        // If validation passes, return additional information or handle accordingly
        return { success: true, message: "Post-insert validation passed" };
        // throw new Error("Post-insert validation failed");
    } catch (error) {
        // Handle the error thrown during post-insert validation
        console.error("Post-insert validation error:", error.message);

        // If validation fails, delete the inserted record

        let collection = mongoose.model(tableName, Schema.tableName);
        await collection.updateOne({ id: insertedData.id }, { status: 2 });

        // await tableName.deleteOne({ id: insertedData.id });

        // await this.deleteRecord(tableName, { id: insertedData.id });

        // Return the specific validation error message in the response
        return { success: false, message: error.message, data: null };
    }
};

exports.validateDelete = async (tableName, clientName, insertedData, session) => {
    try {
        // Implement your custom validation logic here
        // If validation fails, throw an error to indicate a rollback
        // In this example, we check if the age is greater than 18

        //        console.log(insertedData.code)
        //        console.log("888888888888888888888888888888888")
        if (insertedData.code && insertedData.code <= 18) {
            throw new Error("code should be greater than 18");
        }

        // You can add more validation checks here...

        // If validation passes, return additional information or handle accordingly
        return { success: true, message: "Post-insert validation passed", data: null };
    } catch (error) {
        // Handle the error thrown during post-insert validation
        console.error("Post-insert validation error:", error.message);

        // If validation fails, the transaction will be rolled back automatically
        // No need to delete the inserted record explicitly

        // Return the specific validation error message in the response
        return { success: false, message: error.message, data: null };
    }
};

exports.DeleteDataFromTable = async (collectionName, data) => {
    return new Promise(async function (resolve, reject) {
        if (mongoose.models[collectionName]) {
            delete mongoose.models[collectionName];
            // delete mongoose.modelSchemas[collectionName];
        }
        let finalschema = Schema[collectionName] || Schema["any"];
        let model = mongoose.model(collectionName, finalschema);
        model.deleteMany(data).then((result) => {
            resolve(result)
        }).catch((err) => {
            reject(err)
        })

    })

}



function postInsertValidationLogic(insertedData) {
    // Implement your custom post-insert validation logic
    // Check if the "age" field is present and greater than 18
    if (insertedData.age && insertedData.age <= 18) {
        throw new Error("Age should be greater than 18");
    }

    // Add more custom validation logic as needed

    // Return true if all validation passes
    return true;
}
