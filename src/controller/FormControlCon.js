const validate = require("../helper/validate");
const model = require("../models/module");
const functionForCommaSeperated = require("../helper/CommaSeperatedValue");
const mongoose = require("mongoose");
const { errorLogger, logger } = require("../helper/loggerService");
const viewController = require("./viewController");
const moment = require("moment");
const sql = require("mssql");
const { connectToSql } = require("../config/sqlConfig");
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
function createObjectId(companyId) {
  try {
    if (companyId !== null) {
      return new mongoose.Types.ObjectId(companyId);
    } else {
      return null;
    }
    // Attempt to create a new ObjectId with the provided companyId
  } catch (error) {
    // If an error occurs (e.g., due to an invalid companyId format), return null
    return convertStringToNumberIfNeeded(companyId);
  }
}
// const { assign } = require('nodemailer/lib/shared');
function groupBy(arr, key) {
  return arr.reduce((acc, obj) => {
    const keyValue = obj[key];
    acc[keyValue] = acc[keyValue] || [];
    acc[keyValue].push(obj);
    return acc;
  }, {});
}
function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  //    // console.log(randomString);

  return randomString;
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

  let referenceTable = dropdownData.referenceTable.split(".");
  for (let i = 1; i < referenceTable.length; i++) {
    let path = referenceTable.slice(1, i + 1).join(".");
    dropdownQuery.push({
      $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false },
    });
  }

  if (dropdownData.referenceColumn) {
    const keys = dropdownData.referenceColumn.split(",");
    const regex = /[\s\W]/;
    const fieldsToConcat = keys.map((key) =>
      regex.test(key) ? `${key}` : `$${key.trim()}`
    );

    dropdownQuery.push({
      $project: {
        id:
          referenceTable.length == 1
            ? "$_id"
            : `$${referenceTable.slice(1).join(".")}._id`,
        value: { $concat: fieldsToConcat },
      },
    });
  }
  dropdownQuery.push({ $match: { id: { $in: array || [] } } });
  dropdownQuery.push({
    $addFields: {
      upperValue: { $toUpper: "$value" },
    },
  });

  // Then, sort by the new uppercase field
  dropdownQuery.push({
    $sort: { upperValue: sort || 1 },
  });
  // dropdownQuery.push({ $sort: { value: sort || 1 } });

  return await model.AggregateFetchData(
    referenceTable[0],
    dropdownData.referenceTable,
    dropdownQuery,
    res
  );
  // return []
}
async function processFields(fields, model, res) {
  for (let field of fields) {
    if (
      field.controlname.toLowerCase() === "dropdown" &&
      field.dropDownValues &&
      field.dropDownValues.length == 0
    ) {
      // field.data = await fetchDataForDropdown(field, model, res);
      field.data = [];
    } else if (field.controlname.toLowerCase() === "dropdown") {
      field.data = field.dropDownValues;
    }
  }
  // fields.sort((a, b) => a.ordering - b.ordering);
  fields.sort((a, b) => {
    // First, compare by the primary field 'sectionOrder'
    if (a.sectionOrder !== b.sectionOrder) {
      return a.sectionOrder - b.sectionOrder;
    }

    // If 'sectionOrder' values are the same, compare by the secondary field 'ordering'
    return a.ordering - b.ordering;
  });
}
// function fixJsonLikeString(str) {
//     // Normalize colons by ensuring there's a space after them
//     str = str.replace(/:\s*/g, ': ');

//     // Add quotes to keys and values, supporting spaces in values
//     // This matches a key (with optional periods), followed by a colon, then captures everything until a comma or closing brace
//     str = str.replace(/([{\s,])([\w.]+)(\s*:\s*)([^,}]+)/g, function (match, p1, p2, p3, p4) {
//         // Add quotes around the key
//         let key = `"${p2.trim()}"`;
//         // Add quotes around the value if not already quoted, and trim spaces
//         let value = p4.trim().startsWith('"') ? p4.trim() : `"${p4.trim()}"`;
//         return `${p1}${key}${p3}${value}`;
//     });

//     // Handle nested objects recursively
//     const nestedObjectRegex = /"([\w.]+)":\s*"{([^}]+)}"/;
//     let match = nestedObjectRegex.exec(str);

//     while (match) {
//         const fixedNestedObject = fixJsonLikeString(`{${match[2]}}`);
//         str = str.replace(nestedObjectRegex, `"${match[1]}": ${fixedNestedObject}`);
//         match = nestedObjectRegex.exec(str);
//     }

//     return str;
// }

function fixJsonLikeString(str) {
  // Normalize colons by ensuring there's a space after them
  str = str.replace(/:\s*/g, ": ");

  // Add quotes to keys and values, supporting spaces in values
  // This matches a key (with optional periods), followed by a colon, then captures everything until a comma or closing brace
  str = str.replace(
    /([{\s,])([\w.]+)(\s*:\s*)([^,}]+)/g,
    function (match, p1, p2, p3, p4) {
      // Add quotes around the key
      let newRegex = new RegExp("^{");
      console.log(p3);
      console.log(p4);
      let key = `"${p2.trim()}"`;
      // Add quotes around the value if not already quoted, and trim spaces
      let value = p4.trim().startsWith('"')
        ? p4.trim()
        : newRegex.test(p4.trim())
        ? p4.trim()
        : `"${p4.trim()}"`;
      console.log(value);
      return `${p1}${key}${p3}${value}`;
    }
  );

  // Handle $in arrays
  str = str.replace(/\$in\s*:\s*\[([^\]]+)\]/g, function (match, p1) {
    let arrayValues = p1
      .split(",")
      .map((val) => {
        val = val.trim();
        return val.startsWith('"') ? val : `"${val}"`;
      })
      .join(", ");
    return `"$in": [${arrayValues}]`;
  });

  // Handle $nin arrays
  str = str.replace(/\$nin\s*:\s*\[([^\]]+)\]/g, function (match, p1) {
    let arrayValues = p1
      .split(",")
      .map((val) => {
        val = val.trim();
        return val.startsWith('"') ? val : `"${val}"`;
      })
      .join(", ");
    return `"$nin": [${arrayValues}]`;
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

function groupAndSortFields(fields) {
  // Group fields by 'sectionHeader'
  const groupedFields = fields.reduce((acc, field) => {
    const section = field.sectionHeader || "default"; // Use 'default' or any other value for fields without sectionHeader
    acc[section] = acc[section] || [];
    acc[section].push(field);
    return acc;
  }, {});

  // Sort each group by 'sectionOrder'
  Object.keys(groupedFields).forEach((section) => {
    groupedFields[section].sort(
      (a, b) => (a.sectionOrder || 0) - (b.sectionOrder || 0)
    );
  });

  return groupedFields;
}

function extractIPv4(ip) {
  // Check if the IP has an IPv6 prefix
  if (ip.includes("::ffff:")) {
    ip = ip.split(":").pop(); // Split by ':' and take the last part
  }
  return ip;
}

async function processAggregateFields(fields, model, req) {
  for (const field of fields) {
    if (
      ["date.now()", "Date.now()", "date.now", "Date.now"].includes(
        field.controlDefaultValue
      )
    ) {
      field.controlDefaultValue = moment().format("YYYY-MM-DD");
    }

    if (
      field.controlname.toLowerCase() === "dropdown" &&
      field.controlDefaultValue !== null &&
      typeof field.controlDefaultValue !== "object"
    ) {
      const datadafind = await fetchDataForDropdownSchema(field, model, req);
      if (datadafind.length > 0) {
        field.controlDefaultValue = datadafind[0];
      }
    }
  }
}
async function fetchDataForDropdownSchema(dropdownData, model, req) {
  let dropdownMatch = { status: 1, clientCode: req.clientCode };
  // if (dropdownData.controlDefaultValue !== null && dropdownData.referenceTable.split('.').length > 1) {
  //   dropdownMatch[`${dropdownData.referenceColumn.replace("$","")}`] = dropdownData.controlDefaultValue

  // }
  // else if (dropdownData.controlDefaultValue !== null) {
  //   dropdownMatch[dropdownData.referenceColumn] = dropdownData.controlDefaultValue
  // }
  //  console.log(dropdownMatch);
  if (
    typeof dropdownData.controlDefaultValue !== "undefined" &&
    dropdownData.controlDefaultValue !== null &&
    dropdownData.controlDefaultValue !== ""
  ) {
    //    console.log(fixJsonLikeString(dropdownData.controlDefaultValue));
    // let temp = JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"'));
    let temp = JSON.parse(fixJsonLikeString(dropdownData.controlDefaultValue));
    //    console.log(typeof temp);
    Object.assign(dropdownMatch, temp);
    //    console.log(dropdownMatch);
  }
  //  //    dropdownData.dropdownFilter!==null&&console.log("DropdownFilter",JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"')));
  let dropdownQuery = [{ $match: dropdownMatch }];

  let referenceTable =
    dropdownData.referenceTable !== null
      ? dropdownData.referenceTable.split(".")
      : [];
  for (let i = 1; i < referenceTable.length; i++) {
    let path = referenceTable.slice(1, i + 1).join(".");
    dropdownQuery.push({
      $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false },
    });
  }

  if (dropdownData.referenceColumn) {
    const keys = dropdownData.referenceColumn.split(",");
    const regex = /[\s\W]/;
    const fieldsToConcat = keys.map((key) =>
      regex.test(key) ? `${key}` : `$${key.trim()}`
    );
    dropdownQuery.push({
      $project: {
        value:
          referenceTable.length == 1
            ? "$_id"
            : `$${referenceTable.slice(1).join(".")}._id`,
        oldId:
          referenceTable.length == 1
            ? "$oldId"
            : `$${referenceTable.slice(1).join(".")}.oldId`,
        label: { $concat: fieldsToConcat },
      },
    });
  }

  return await model.AggregateFetchData(
    referenceTable[0],
    dropdownData.referenceTable,
    dropdownQuery
  );
}

module.exports = {
  // Code for Form Controler.....................................................................................................
  FormControl: async (req, res) => {
    try {
      // Define validation rules for the incoming data
      const validationRule = {
        tableName: "required",
        menuID: "required",
      };

      // Validate the request body against the validation rules
      validate(req.body, validationRule, {}, async (err, status) => {
        if (!status) {
          // If validation fails, return an error response
          res.status(403).send({
            success: false,
            message: "Validation Error....! ",
            data: err,
          });
        } else {
          // Prepare the data to be inserted or updated in the FormControl table
          try {
            let insertData = {
              id: req.body.id || "",
              tableName: req.body.tableName,
              menuID: req.body.menuID,
              fields: req.body.fields,
              isCopyForSameTable: req.body.isCopyForSameTable,
              isNoGenerate: req.body.isNoGenerate,
              isRequiredAttachment: req.body.isRequiredAttachment,
              clientCode: req.body.clientCode,
              functionOnLoad: req.body.functionOnLoad,
              functionOnSubmit: req.body.functionOnSubmit,
              functionOnEdit: req.body.functionOnEdit,
              functionOnDelete: req.body.functionOnDelete,
              viewId: req.body.viewId,
              viewFilterField: req.body.viewFilterField,

              // Set updated date and updated by if id exists and is not empty
              ...(req.body.id &&
                req.body.id !== "" && {
                  updatedDate: new Date(),
                  updatedby: req.body.updatedby,
                }),
              // Set created by if id is empty
              ...(req.body.id &&
                req.body.id === "" && {
                  createdBy: req.body.createdBy,
                }),
            };
            insertData.buttons = Array.isArray(req.body.buttons)
              ? req.body.buttons
              : [];
            // Ensure that child are an array, if not, set to an empty array
            insertData.child = Array.isArray(req.body.child)
              ? req.body.child
              : [];
            insertData.searchArray = Array.isArray(req.body.searchArray)
              ? req.body.searchArray
              : [];
            insertData.viewFields = Array.isArray(req.body.viewFields)
              ? req.body.viewFields
              : [];

            // Perform the database operation to update or insert data
            let data = await model.updateIfAvailableElseInsertMaster(
              "tblFormcontrol",
              "mainTableSchema",
              insertData,
              { ip: extractIPv4(req.ip || req.connection.remoteAddress) },
              "CreateFormcontrol",
              res
            );

            // Send response based on the result of the database operation
            data
              ? res.send({
                  success: true,
                  message: "Data inserted successfully....",
                  data: data,
                })
              : res.status(500).send({
                  success: false,
                  message: "Data not inserted Successfully...",
                });
          } catch (error) {
            errorLogger(error, req);
            res.status(500).send({
              success: false,
              message: "Something went wrong",
              data: error.message,
            });
          }
        }
      });
    } catch (error) {
      // Handle any errors during the process and send an error response
      errorLogger(error, req);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error,
      });
    }
  },
  listControlToDrawScreen: async (req, res) => {
    try {
      // Initialize a match object for MongoDB query
      let _matchData = { status: { $in: [1, 3] } };

      // Define the initial query structure for MongoDB aggregation
      let query = [
        {
          $match: _matchData,
        },
      ];

      // If a menuID is provided in the query, add it to the match criteria
      if (req.query.menuID) {
        // _matchData.menuID = req.query.menuID;

        _matchData["$expr"] = {
          $and: [
            {
              $or: [
                { $eq: ["$_id", createObjectId(req.query.menuID)] },
                { $eq: ["$menuID", req.query.menuID] },
              ],
            },
            {
              $or: [
                { $eq: ["$clientCode", req.clientCode] },
                { $eq: ["$clientCode", "SYSADMIN"] },
              ],
            },
          ],
        };
      }

      // Fetch form control data from the database using the model's AggregateFetchData method
      let formControllerData = await model.AggregateFetchData(
        "tblFormcontrol",
        "mainTableSchema",
        query,
        res
      );

      // Process each form control data and its child elements
      await Promise.all(
        formControllerData.map(async (data) => {
          await processFields(data.fields, model, res);
          for (let ch of data.child) {
            await processFields(ch.fields, model, res);
            for (let subChild of ch.subChild) {
              await processFields(subChild.fields, model, res);
              for (const iterator of subChild["4thchild"] || []) {
                await processFields(iterator.fields, model, res);
              }
            }
          }
        })
      );

      // Default Value code to setting defalut values moved here from the newSchema because the client filter was not working their
      for (const object of formControllerData) {
        // Process fields in the main document
        if (object.fields) {
          await processAggregateFields(object.fields, model, req);
        }

        // Process fields in child and subChild
        for (const child of object.child || []) {
          if (child.fields) {
            await processAggregateFields(child.fields, model, req);
          }
          for (const subChild of child.subChild || []) {
            if (subChild.fields) {
              await processAggregateFields(subChild.fields, model, req);
            }

            for (const iterator of subChild["4thchild"] || []) {
              if (iterator.fields) {
                //              console.log("4thchild", iterator);
                await processAggregateFields(iterator.fields, model, req);
              }
            }
          }
        }
      }

      //            // console.log(formControllerData.length);
      //            // console.log(groupAndSortFields(formControllerData));
      // return  res.send({ success: true, message: "Data Found", data: formControllerData })
      // Send a response with the form control data if found, otherwise send a 'data not found' message
      formControllerData.length > 0 &&
        formControllerData[0].child.sort((a, b) => a.childOrder - b.childOrder);
      formControllerData.length > 0
        ? res.send({
            success: true,
            message: "Data Found",
            data: formControllerData,
          })
        : res.send({ success: false, message: "Data Not Found", data: [] });
    } catch (error) {
      // Handle any errors during the process and send an error response
      errorLogger(error, req);
      res.send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  ForControlList: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      if (body.id && body.id !== "" && body.id !== "undefined") {
        matchData["id"] = Number(body.id);
      }
      matchData["clientCode"] = req.clientCode;
      let pageNo = parseInt(req.body.pageNo, 10) || 1; // Default to page 1 if not specified
      let limit = parseInt(req.body.limit, 10) || 10;
      if (
        req.body.keyName &&
        req.body.keyValue &&
        req.body.keyValue !== "" &&
        req.body.keyValue !== ""
      ) {
        let isDate = !isNaN(Date.parse(req.body.keyValue));
        if (isDate) {
          // If it's a valid date string, search for it in date fields
          // const [year, month, day] = req.body.keyValue.split('-').map(Number);
          // const startDate = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0, 0)); // Months are 0-indexed in JavaScript Date
          // const endDate = new Date(Date.UTC(year, month - 1, day - 1, 23, 59, 59, 999));

          const [year, month, day] = req.body.keyValue.split("-").map(Number);
          const startDate = new Date(
            Date.UTC(year, month - 1, day, 0, 0, 0, 0)
          ); // Correct day start
          // const startDate = new Date(moment(`${year}-${month}-${day} 00:00:00`)); // Correct day start
          const endDate = new Date(
            Date.UTC(year, month - 1, day, 23, 59, 59, 999)
          ); // Correct day end
          // const endDate = new Date(moment(`${year}-${month}-${day} 23:59:59`)); // Correct day end

          matchData["$or"] = [
            {
              [req.body.keyName]: { $gte: startDate, $lte: endDate },
            },
          ];
        } else {
          // If it's not a valid date string, perform regex search in other fields
          matchData["$or"] = [
            {
              [req.body.keyName]: {
                $regex: `^${req.body.keyValue}`,
                $options: "i",
              },
            },
          ];
        }
      }
      let query = [
        {
          $match: matchData,
        },
      ];

      if (
        req.body.label &&
        req.body.label != "undefined" &&
        req.body.label !== "" &&
        req.body.order &&
        req.body.order !== "" &&
        req.body.order !== "undefined"
      ) {
        query.push({ $sort: { [`${req.body.label}`]: req.body.order } });
      }
      query.push(
        { $skip: (Number(pageNo) - 1) * Number(limit) },
        { $limit: Number(limit) }
      );
      let data = await model.AggregateFetchData(
        "tblFormcontrol",
        "tblFormcontrol",
        query,
        res
      );
      let Count = 0;
      if (pageNo == 1) {
        let temp = await model.AggregateFetchData(
          "tblFormcontrol",
          "tblFormcontrol",
          [
            { $match: matchData },
            {
              $count: "count",
            },
          ],
          res
        );
        Count = temp.length > 0 ? temp[0].count : 0;
      }
      data.length > 0
        ? res.send({
            success: true,
            message: "Data fetched successfully....!",
            data: data,
            Count: Count,
          })
        : res.send({
            success: false,
            message: "No data Found",
            data: data,
            Count: Count,
          });
    } catch (error) {
      errorLogger(error, req);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  delete: async (req, res) => {
    const validationRule = {
      id: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation Error",
          data: err,
        });
      } else {
        try {
          let matchData = {
            id: Number(req.body.id),
            status: 2,
          };
          let data = await model.updateIfAvailableElseInsertMaster(
            "tblFormcontrol",
            "mainTableSchema",
            matchData,
            {
              tableName: "tblFormcontrol",
              ip: extractIPv4(req.ip || req.connection.remoteAddress),
            }
          );
          data
            ? res.send({
                success: true,
                message: "Data deleted successfully....",
                data: data,
              })
            : res.status(500).send({
                success: false,
                message: "Data not deleted successfully....",
                data: data,
              });
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "Something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  filterdDropDown: async (req, res) => {
    const validationRule = {
      onfilterkey: "required",
      referenceTable: "required",
      onfiltervalue: "required",
      referenceColumn: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation Error",
          data: err,
        });
      } else {
        try {
          let dropdownData = req.body;
          let dropdownMatch = {
            status: 1,
            [dropdownData.onfilterkey]:
              dropdownData.onfilterkey.split(".")[
                dropdownData.onfilterkey.split(".").length - 1
              ] == "_id"
                ? new mongoose.Types.ObjectId(dropdownData.onfiltervalue)
                : dropdownData.onfiltervalue,
          };
          let excludetable = [
            "master_schema",
            "master_schema.fields",
            "master_schema.child.fields",
            "master_schema.child.subChild.fields",
            "master_schema.child",
            "master_schema.child.subChild",
          ];
          if (!excludetable.includes(dropdownData.referenceTable))
            dropdownMatch.clientCode = req.clientCode;
          let dropdownQuery = [{ $match: dropdownMatch }];
          let pageNo = parseInt(req.body.pageNo, 10) || 1; // Default to page 1 if not specified
          let limit = parseInt(req.body.limit, 10) || 1001;

          if (
            dropdownData.referenceView &&
            dropdownData.referenceView !== "" &&
            typeof viewController[dropdownData.referenceView] == "function"
          ) {
            let ViewData = await viewController[dropdownData.referenceView](
              req,
              res
            );
            if (ViewData.length > 0) {
              return res.send({
                success: true,
                data: ViewData,
                message: "View Data Fetched Successfully",
              });
            }
          }

          if (dropdownData.referenceTable === "tblMenu") {
            //                        console.log("dropdownData.referenceTable", dropdownData.referenceTable);
            function extractMenuNames(item) {
              const items = [{ value: item._id, label: item.menuName }]; // Start with the current level

              // Recursively extract menu names and ids from 'options' array
              if (item.options && item.options.length) {
                item.options.forEach((option) => {
                  items.push(...extractMenuNames(option)); // Flatten and combine the results
                });
              }

              // Recursively extract menu names and ids from 'child' array
              if (item.child && item.child.length) {
                item.child.forEach((childItem) => {
                  items.push(...extractMenuNames(childItem)); // Flatten and combine the results
                });
              }

              return items;
            }
            let data = await model.AggregateFetchData(
              dropdownData.referenceTable,
              dropdownData.referenceTable,
              dropdownQuery,
              res
            );
            let menuData = data.flatMap((doc) => extractMenuNames(doc));
            //                        console.log("menu", menuData.length);
            return res.send({
              success: true,
              message: "Data fetched successfully....!",
              data: menuData,
              nextPage: null,
            });
          }
          let referenceTable = dropdownData.referenceTable.split(".");
          for (let i = 1; i < referenceTable.length; i++) {
            let path = referenceTable.slice(1, i + 1).join(".");
            dropdownQuery.push({
              $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false },
            });
          }
          if (
            typeof dropdownData.dropdownFilter !== "undefined" &&
            dropdownData.dropdownFilter !== null &&
            dropdownData.dropdownFilter !== ""
          ) {
            //                        console.log(JSON.parse(fixJsonLikeString(dropdownData.dropdownFilter)));
            // let temp = JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"'));
            let temp = JSON.parse(
              fixJsonLikeString(dropdownData.dropdownFilter)
            );
            // let temp = JSON.parse(`{"ownCompany": {"$in": ["y"]}}`);
            console.log(temp);
            for (let key of Object.keys(temp)) {
              //                            console.log(key.split("."));
              if (temp[key] === "false") {
                temp[key] = false;
              }

              if (temp[key] === "true") {
                temp[key] = true;
              }
              if (key.split(".")[key.split(".").length - 1] == "_id") {
                temp[key] = createObjectId(temp[key]);
              }
              if (new RegExp(":", "g").test(temp[key])) {
                let tableName = temp[key].split(".");
                let matchData = `{${temp[key]
                  .split(".")
                  .slice(1)
                  .join(".")},clientCode:"${req.clientCode}"}`;
                // console.log(matchData);s
                matchData = JSON.parse(fixJsonLikeString(matchData));
                console.log(matchData);
                const refQuery = [];
                // console.log(matchData);
                for (let i = 1; i < tableName.length; i++) {
                  let path;
                  if (i !== tableName.length - 1) {
                    path = tableName.slice(1, i + 1).join(".");
                    let project = {};
                    project[`${path}`] = `$${path}`;
                    refQuery.push({
                      $unwind: {
                        path: `$${path}`,
                        preserveNullAndEmptyArrays: false,
                      },
                    });
                  }
                }
                refQuery.push({ $match: matchData });
                console.log(refQuery);

                // console.log( typeof JSON.parse(matchData));
                let data = await model.AggregateFetchData(
                  tableName[0],
                  tableName[0],
                  refQuery,
                  res
                );
                console.log(data);
                function getNestedObjectValue(params) {
                  let path = data[0];
                  for (let i = 1; i < params.length; i++) {
                    if (i !== params.length - 1) {
                      path = path?.[params.slice(i, i + 1).join(".")];

                      // refQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });
                    }
                  }
                  return path;
                }

                let nestedData = getNestedObjectValue(tableName);
                console.log(nestedData);
                if (data.length > 0) {
                  temp[key] =
                    key.split(".")[key.split(".").length - 1] == "_id"
                      ? nestedData._id
                      : nestedData._id.toString();
                }
                // console.log(data);
              }
            }
            dropdownQuery.push({ $match: temp });
            //                        // console.log(typeof temp);
            // Object.assign(dropdownMatch, temp);
            //                        // console.log(dropdownMatch);
          }

          if (dropdownData.referenceColumn) {
            const keys = dropdownData.referenceColumn.split(",");
            const regex = /[\s\W]/;
            const fieldsToConcat = keys.map((key) =>
              regex.test(key) ? `${key}` : `$${key.trim()}`
            );
            dropdownQuery.push({
              $project: {
                value:
                  referenceTable.length == 1
                    ? "$_id"
                    : `$${referenceTable.slice(1).join(".")}._id`,
                oldId:
                  referenceTable.length == 1
                    ? "$oldId"
                    : `$${referenceTable.slice(1).join(".")}.oldId`,
                label: { $concat: fieldsToConcat },
              },
            });
          }

          dropdownQuery.push({ $sort: { label: 1 } });
          // if (req.body.search && req.body.search !== "" && req.body.search !== "undefined") {

          //     dropdownQuery.push({ $match: { value: { $regex: req.body.search, $options: "i" } } })
          // }
          if (req.body.search !== undefined && req.body.search !== "") {
            dropdownQuery.push({
              $match: {
                label: { $regex: `^${req.body.search}`, $options: "i" },
              },
            });
          }

          dropdownQuery.push(
            { $skip: (Number(pageNo) - 1) * Number(1000) },
            { $limit: Number(limit) }
          );
          let data = await model.AggregateFetchData(
            referenceTable[0],
            dropdownData.referenceTable,
            dropdownQuery,
            res
          );
          let nextPage = data.length < 1001 ? null : pageNo + 1;
          if (
            req.body.value &&
            req.body.value !== "" &&
            req.body.value !== "undefined"
          ) {
            let filteron_id =
              dropdownData.referenceTable.split(".").length > 1
                ? `${dropdownData.referenceTable
                    .split(".")
                    .slice(1)
                    .join(".")}._id`
                : "_id";
            let filteronoldId =
              dropdownData.referenceTable.split(".").length > 1
                ? `${dropdownData.referenceTable
                    .split(".")
                    .slice(1)
                    .join(".")}.oldId`
                : "oldId";
            let value =
              typeof req.body.value == "string"
                ? req.body.value.split(",")
                : [req.body.value];
            let valuset = new Set(value.map((e) => createObjectId(e)));

            dropdownQuery[dropdownQuery.length - 1] = {
              $match: {
                $or: [
                  { [filteron_id]: { $in: Array.from(valuset) } },
                  { [filteronoldId]: { $in: value } },
                  { value: { $in: Array.from(valuset) } },
                ],
              },
            };

            let dataforUnshift = await model.AggregateFetchData(
              referenceTable[0],
              dropdownData.referenceTable,
              dropdownQuery,
              res
            );

            //                        console.log(dataforUnshift);
            if (dataforUnshift.length > 0) {
              //                            console.log(data.filter((e) => e?.value === dataforUnshift[0]?.value));
              if (
                data.filter(
                  (e) =>
                    e.value.toString() === dataforUnshift[0].value.toString()
                ).length === 0
              ) {
                data.unshift(dataforUnshift[0]);
              }
            }
          }
          //                    console.log(data.length);
          data.length > 0
            ? res.send({
                success: true,
                message: "Data fetched successfully....",
                data: data.length >= 1001 ? data.slice(0, -1) : data,
                nextPage: nextPage,
                prePage: pageNo - 1,
              })
            : res.status(200).send({
                success: false,
                message: "No records Found..",
                data: data,
              });
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: error.message,
            data: error.message,
          });
        }
      }
    });
  },
  copyTableMaping: async (req, res) => {
    const validationRule = {
      fromTableName: "required",
      fieldsMaping: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation Error",
          data: err,
        });
      } else {
        try {
          let insterData = {
            id: req.body.id || 0,
            fromTableName: req.body.fromTableName,
            filterOn: req.body.filterOn,
            clientCode: req.body.clientCode,
          };
          if (Array.isArray(req.body.fieldsMaping)) {
            insterData.fieldsMaping = req.body.fieldsMaping;
          } else {
            insterData.fieldsMaping = JSON.parse(req.body.fieldsMaping);
          }
          let data = await model.updateIfAvailableElseInsert(
            "CopyTableMapingSchema",
            "CopyTableMapingSchema",
            insterData,
            {},
            res
          );
          data
            ? res.send({
                success: true,
                message: "Data inserted successfully....",
                data: data,
              })
            : res.send({
                success: false,
                message: "Data not inserted successfully....",
                data: data,
              });
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "Something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  getCopyData: async (req, res) => {
    try {
      let dataofcopy = await model.AggregateFetchData(
        "CopyTableMapingSchema",
        "CopyTableMapingSchema",
        [{ $match: { mappingName: req.body.id } }],
        res
      );
      if (dataofcopy.length > 0) {
        let query = [];
        let keys = dataofcopy[0].filterOn.split(".");
        console.log(keys);
        for (let index = 0; index < keys.length; index++) {
          // console.log(keys.splice(index, 1).join("."));
          query.push({
            $unwind: { path: `$${keys.splice(index, 1).join(".")}` },
          });
        }

        //                console.log("dataofcopy[0].filterOn", dataofcopy[0]);
        let matchData = {
          clientCode: req.clientCode,
          status: Number(process.env.ACTIVE_STATUS),
          [`${dataofcopy[0].filterOn}`]: Array.isArray(req.body.filterValue)
            ? {
                $in: req.body.filterValue.map((e) =>
                  dataofcopy[0].filterOn?.split(".")[
                    dataofcopy[0].filterOn?.split(".").length - 1
                  ] == "_id"
                    ? createObjectId(e)
                    : e
                ),
              }
            : dataofcopy[0].filterOn?.split(".")[
                dataofcopy[0].filterOn?.split(".").length - 1
              ] == "_id"
            ? createObjectId(req.body.filterValue)
            : req.body.filterValue,
        };
        query.push({ $match: matchData });
        let project = {};
        for (const iterator of dataofcopy[0].fieldsMaping) {
          if (
            typeof iterator.parentValue == "string" &&
            typeof iterator.keyToSetParent == "string" &&
            iterator?.parentValue !== null &&
            iterator?.keyToSetParent !== null
          ) {
            let temp = {
              $addFields: {
                [iterator.FromColmunName]: {
                  $map: {
                    input: `$${iterator.FromColmunName}`,
                    as: "detail",
                    in: {
                      $mergeObjects: [
                        "$$detail",
                        {
                          [iterator.keyToSetParent]: `$${iterator.parentValue}`,
                        }, // Set the value for prid as needed
                      ],
                    },
                  },
                },
              },
            };
            query.push(temp);
          }
          project[iterator.ToColmunName] = `$${iterator.FromColmunName}`;
        }
        if (Object.keys(project).length > 0) {
          query.push({ $project: project });
        }
        let prosimeAll = await Promise.all([
          model.AggregateFetchData(
            dataofcopy[0].fromTableName,
            dataofcopy[0].fromTableName,
            query,
            res
          ),
          model.AggregateFetchData(
            "tblFormcontrol",
            "mainTableSchema",
            [
              {
                $match: {
                  _id: createObjectId(req.body.menuID),
                  status: Number(process.env.ACTIVE_STATUS),
                },
              },
            ],
            res
          ),
        ]);
        // let data = await model.AggregateFetchData(dataofcopy[0].fromTableName, dataofcopy[0].fromTableName, query, res)
        let data = prosimeAll[0];
        if (data.length > 0) {
          // let FetchRules = await model.AggregateFetchData("tblFormcontrol", "mainTableSchema", [{ $match: { _id: createObjectId(req.body.menuID), status: Number(process.env.ACTIVE_STATUS) } }], res)
          let FetchRules = prosimeAll[1];
          let DropDownObj = [];
          for (const object of FetchRules) {
            for (const child of object.child) {
              let tempobject = {};
              tempobject["tableName"] = child.tableName;
              tempobject["fields"] = child.fields.filter(
                (x) => x.controlname.toLowerCase() == "dropdown"
              );
              tempobject["subChild"] = [];
              for (const subChild of child.subChild) {
                let tempobjectForChild = {};
                tempobjectForChild["tableName"] = subChild.tableName;
                tempobjectForChild["fields"] = subChild.fields.filter(
                  (x) => x.controlname.toLowerCase() == "dropdown"
                );
                tempobject["subChild"].push(tempobjectForChild);
              }
              DropDownObj.push(tempobject);
            }
          }
          for (const dropdown of DropDownObj) {
            const values = new Set();
            dropdown["values"] = {};
            data.forEach((element) => {
              (element[dropdown.tableName] || []).map((x) => {
                (dropdown.fields || []).map((y) => {
                  if (typeof dropdown["values"][y.fieldname] == "undefined") {
                    dropdown["values"][y.fieldname] = [
                      createObjectId(x[y.fieldname]),
                    ];
                  } else {
                    dropdown["values"][y.fieldname].push(
                      createObjectId(x[y.fieldname])
                    );
                  }
                });
              });
              // dropdown["values"] = Array.from(values);
              //                                console.log(Array.from(dropdown["values"]));
            });
            for (const subchild of dropdown.subChild) {
              subchild["values"] = {};
              data.forEach((element) => {
                (element[dropdown.tableName] || []).map((x) => {
                  (x[subchild.tableName] || []).map((z) => {
                    (subchild.fields || []).map((y) => {
                      if (
                        typeof subchild["values"][y.fieldname] == "undefined"
                      ) {
                        subchild["values"][y.fieldname] = [
                          createObjectId(z[y.fieldname]),
                        ];
                      } else {
                        subchild["values"][y.fieldname].push(
                          createObjectId(z[y.fieldname])
                        );
                      }
                    });
                  });
                });
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
              dropdown["values"][element.fieldname] =
                await fetchDataForDropdown(
                  element,
                  model,
                  dropdown.values[element.fieldname],
                  "req"
                );
              for (const singleData of data) {
                for (const child of singleData[dropdown.tableName] || []) {
                  //                                        console.log("Values", dropdown["values"][element.fieldname].find(x => x.id.toString() == child[`${element.fieldname}`])?.value);
                  child[`${element.fieldname}Dropdown`] =
                    dropdown["values"][element.fieldname].find(
                      (x) => x.id.toString() == child[`${element.fieldname}`]
                    )?.value || null;
                }
              }
            }

            for (const subchild of dropdown.subChild) {
              // Fetch data for subchild dropdown
              // subchild["values"] = {};
              for (const subElement of subchild.fields) {
                // console.log(subElement, model, subchild.values[subElement.fieldname]);
                subchild["values"][subElement.fieldname] =
                  await fetchDataForDropdown(
                    subElement,
                    model,
                    subchild.values[subElement.fieldname],
                    "req"
                  );
              }

              // Assign subchild dropdown values to corresponding fields in child
              for (const singleData of data) {
                for (const child of singleData[dropdown.tableName] || []) {
                  for (const subChild of child[subchild.tableName] || []) {
                    for (const subElement of subchild.fields || []) {
                      subChild[`${subElement.fieldname}Dropdown`] =
                        subchild["values"][subElement.fieldname].find(
                          (x) =>
                            x.id.toString() ==
                            subChild[`${subElement.fieldname}`]
                        )?.value || null;
                    }
                  }
                }
              }
            }
          }
        }
        res.send({
          success: true,
          message: "Data fetched successfully....",
          data: data,
          keyToValidate: dataofcopy[0],
        });
      } else {
        throw new Error("No Maping Found");
      }
    } catch (error) {
      errorLogger(error, req);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  copyFormControl: async (req, res) => {
    const ValidationRule = {
      // formClientCode: "required",
      toClientCode: "required",
      formControlId: "required",
    };
    validate(req.body, ValidationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation Error",
          data: err,
        });
      } else {
        try {
          let formcontrolData = await model.AggregateFetchData(
            "tblFormcontrol",
            "mainTableSchema",
            [
              {
                $match: {
                  _id: createObjectId(req.body.formControlId),
                  clientCode: req.clientCode,
                },
              },
              {
                $addFields: {
                  clientCode: req.body.toClientCode,
                },
              },
            ]
          );
          let menuData = await model.AggregateFetchData(
            "tblMenu1",
            "tblMenu1",
            [
              {
                $match: {
                  formControlId: formcontrolData[0]._id.toString(),
                  clientCode: req.clientCode,
                },
              },
              {
                $addFields: {
                  clientCode: req.body.toClientCode,
                },
              },
            ]
          );
          delete formcontrolData[0]._id;
          delete formcontrolData[0].id;
          delete formcontrolData[0].createdDate;
          delete formcontrolData[0].updatedDate;
          if (
            req.body.toFormControlId &&
            req.body.toFormControlId !== "" &&
            req.body.toFormControlId !== "undefined"
          ) {
            let toFormControlData = await model.AggregateFetchData(
              "tblFormcontrol",
              "mainTableSchema",
              [{ $match: { _id: createObjectId(req.body.toFormControlId) } }]
            );
            toFormControlData[0]._id.toString();
            // delete toFormControlData[0].id
            // delete toFormControlData[0].createdDate
            // delete toFormControlData[0].updatedDate

            formcontrolData[0] = {
              ...toFormControlData[0],
              ...formcontrolData[0],
            };
          }
          if (
            req.body.toFormControlName &&
            req.body.toFormControlName !== "" &&
            req.body.toFormControlName !== "undefined"
          ) {
            formcontrolData[0].menuID = req.body.toFormControlName;
          }
          console.log(formcontrolData[0]);

          // return res.send({ success: true, message: "Form Control Copied Successfully", data: formcontrolData[0] })
          let inserFormControl = await model.updateIfAvailableElseInsert(
            "tblFormcontrol",
            "mainTableSchema",
            formcontrolData[0]
          );
          if (inserFormControl) {
            let checkMenuExist = await model.AggregateFetchData(
              "tblMenu1",
              "tblMenu1",
              [
                {
                  $match: {
                    clientCode: req.body.toClientCode,
                    menuName: menuData[0].menuName,
                  },
                },
              ]
            );
            if (checkMenuExist.length > 0) {
              checkMenuExist[0].formControlId = inserFormControl._id.toString();
              await model.updateIfAvailableElseInsert(
                "tblMenu1",
                "tblMenu1",
                checkMenuExist[0]
              );
            } else {
              menuData[0].formControlId = inserFormControl._id.toString();
              delete menuData[0]._id;
              delete menuData[0].id;
              delete menuData[0].createdDate;
              delete menuData[0].updatedDate;

              await model.updateIfAvailableElseInsert(
                "tblMenu1",
                "tblMenu1",
                menuData[0]
              );
            }
          }

          res.send({
            success: true,
            message: "Form Control Copied Successfully",
            menuData,
            formcontrolData,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  toClientFormcontrolList: async (req, res) => {
    const validationRule = {
      // clientCode: "required"
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation Error",
          data: err,
        });
      } else {
        try {
          let formcontrolList = await model.AggregateFetchData(
            "tblFormcontrol",
            "mainTableSchema",
            [
              { $match: { clientCode: req.body.clientCode } },
              { $project: { value: "$_id", label: "$menuID" } },
            ]
          );
          res.send({
            success: true,
            message: "Form Control List",
            data: formcontrolList,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  clientCodeDropDown: async (req, res) => {
    try {
      let data = await model.AggregateFetchData(
        "tblFormcontrol",
        "mainTableSchema",
        [
          {
            $group: {
              _id: "$clientCode",
            },
          },
          {
            $project: {
              label: "$_id",
              value: "$_id",
            },
          },
        ],
        res
      );
      res.send({
        success: true,
        message: "Data fetched successfully....",
        data,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  dynamicDataFetch: async (req, res) => {
    try {
      const { tableName, columns, filterColumn, filterValue, clientId } =
        req.body; // Expecting parameters from the request body

      // Validate required fields
      if (!tableName || !columns) {
        return res.status(400).send({
          success: false,
          message: "tableName and columns are required.",
        });
      }

      // Construct the stored procedure call dynamically
      const pool = await connectToSql();
      const request = pool.request();

      request.input("clientId", sql.Int, clientId || null); // Assuming the first parameter is always 0
      request.input("tableName", sql.VarChar, tableName);
      request.input("columnName", sql.VarChar, columns);
      request.input("filterCondition", sql.VarChar, filterColumn || null);
      request.input("sortingOrder", sql.VarChar, filterValue || null);

      const result = await request.execute("dynamicDataFetch"); // Execute the stored procedure

      // Parse the JSON result if the structure matches the provided example
      let parsedData = [];
      if (
        result.recordset &&
        result.recordset[0] &&
        result.recordset[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"]
      ) {
        parsedData = JSON.parse(
          result.recordset[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"]
        );
      }

      res.send({
        success: true,
        message: "Data fetched successfully....",
        data: parsedData, // Return the result set
      });
    } catch (error) {
      console.error("Error executing dynamicDataFetch:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
};
