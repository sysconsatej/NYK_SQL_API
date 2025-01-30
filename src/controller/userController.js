const md5 = require("md5");
const validate = require("../helper/validate");
const model = require("../models/module");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const SendMail = require("../helper/NodeMailer");
const config = require("../config/auth.config");
const mailTemplate = require("../helper/Mailtemplate");
const Mailtemplate = require("../helper/Mailtemplate");
const { errorLogger } = require("../helper/loggerService");
const mongoose = require("../config/MongoConnection");
const client = require("../redis/redis_client");
// const { config } = require('dotenv')
const Redis_expire_time = process.env.REDIS_EXPIRE_TIME;

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
    return { success: false };
  }
}
function createDecimalValidator(m, n) {
  return function (value) {
    const stringValue = value?.toString() || "0";
    //        console.log(stringValue);
    // Calculate the maximum number of digits allowed before the decimal point
    const maxDigitsBeforeDecimal = m - n;
    const parts = stringValue.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1] || "";

    const integerPartLength = integerPart.replace("-", "").length; // Remove sign for length check
    const decimalPartLength = decimalPart.length;

    return integerPartLength + decimalPartLength <= m;
    // && decimalPartLength <= n;
  };
}
function truncateDecimal(value, decimalPlaces) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.floor(value * factor) / factor;
}
function extractIPv4(ip) {
  // Check if the IP has an IPv6 prefix
  if (ip.includes("::ffff:")) {
    ip = ip.split(":").pop(); // Split by ':' and take the last part
  }
  return ip;
}
const generateOTP = () => {
  // Generate a random number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

const userFindByEmail = async (email) => {
  let userKey = "userWrongPassword";
  let serializedList = await client.lrange(userKey, 0, -1);
  const userFound = serializedList.some((item) => {
    let user = JSON.parse(item);
    return user.email === email;
  });

  return userFound;
};

const loginFailHandler = async (isExits, userData) => {
  let userKey = "userWrongPassword";
  let serializedList = await client.lrange(userKey, 0, -1);
  let userActive = 0;
  if (isExits) {
    const currentDate = new Date();
    const twoHoursAgo = new Date(currentDate.getTime() - 2 * 60 * 60 * 1000);
    const updatedList = [];
    for (let i = 0; i < serializedList.length; i++) {
      let user = JSON.parse(serializedList[i]);
      if (user.id === userData.id) {
        user.count += 1; // Increment count for the user
        userActive = user.count;
        if (user.count === 3) {
          user.date = Date.now();
        }
        if (user.date < twoHoursAgo) {
          user.count = 3;
          userActive = user.count;
          user.date = Date.now();
        }
      }
      updatedList.push(JSON.stringify(user));
    }
    await client.del(userKey);
    await client.rpush(userKey, ...updatedList);
  } else {
    let newUser = JSON.stringify({
      id: userData.id,
      email: userData.email,
      count: 1, // Start count at 1 for new users
    });
    await client.rpush(userKey, newUser);
  }
  return userActive;
};

const userFindByEmailLogin = async (email) => {
  let userKey = "userWrongPassword";
  let wrongPassNum = 0;
  let serializedList = await client.lrange(userKey, 0, -1);
  const userFound = serializedList.find((item) => {
    let user = JSON.parse(item);
    if (user.email === email) {
      wrongPassNum = user.count;
    }
  });

  return wrongPassNum;
};

function isDateOlderThan60Days(dateString) {
  const inputDate = new Date(dateString);
  const currentDate = new Date();
  const timeDifference = currentDate - inputDate;
  const differenceInDays = timeDifference / (1000 * 60 * 60 * 24);
  return differenceInDays > process.env.RESET_PASSWORD_DAYS;
}

module.exports = {
  addUser: async (req, res) => {
    const validationRule = {
      name: "required",
      email: "required",
      password: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(412).send({
          success: false,
          message: "Validation error",
          data: err,
        });
      } else {
        try {
          let insertData = {};
          let { body } = req;
          // insertData.id = req.body.id || ""
          // insertData.name = req.body.name
          // insertData.email = req.body.email
          // insertData.userName = req.body.userName
          // insertData.password = md5(req.body.password)
          // insertData.language = req.body.language
          // insertData.twoStepVerification = req.body.twoStepVerification
          // insertData.dateTimeFormat = req.body.dateTimeFormat
          // insertData.currency = req.body.currency
          // insertData.emailVerification = req.body.emailVerification
          // insertData.smsVerification = req.body.smsVerification
          // insertData.mobile = req.body.mobile
          // insertData.status = req.body.status
          if (Array.isArray(body.menuAccess)) {
            body.menuAccess = body.menuAccess || [];
          } else {
            body.menuAccess = JSON.parse(body.menuAccess) || [];
          }
          body.password = md5(body.password);
          insertData = {
            id: body.id || "",
            twoStepVerification: body.twoStepVerification || false,
            emailVerification: body.emailVerification || false,
            ...body,
          };
          if (req.files && req.files !== null && req.files.profilePhoto) {
            var element = req.files.profilePhoto;
            var image_name = moment().format("YYYYMMDDHHmmss") + element.name;
            element.mv("./public/api/images/" + image_name.trim());
            var doc_data = image_name;
            //                        console.log(doc_data);
            Object.assign(insertData, { profilePhoto: doc_data });
          }
          //                    // console.log(req.files.profilePhoto);
          //                    // console.log(insertData);
          let SchemaCheck = await model.AggregateFetchData(
            "master_schema",
            "master_schema",
            [{ $match: { tableName: "tblUser" } }],
            res
          );
          if (SchemaCheck.length == 0) {
            return res.send({
              success: false,
              message: "Please add schema for tblUser",
              data: SchemaCheck,
            });
          }
          let schemaObj = {
            id: { type: Number, required: true, default: 0 },
            status: { type: Number, required: true, default: 1 },
            createdDate: { type: Date, required: true, default: Date.now() },
            createdBy: { type: String, required: false, default: null },
            updatedDate: { type: Date, required: true, default: Date.now() },
            updatedBy: { type: String, required: false, default: null },
            companyName: { type: String, required: false, default: null },
            brachName: { type: String, required: false, default: null },
            passwordLastUpdateDate: {
              type: String,
              required: false,
              default: new Date().toISOString().split("T")[0],
            },
          };
          for (const field of SchemaCheck[0].fields) {
            let properties = {
              required: field.isRequired,
              default: field.defaultValue,
            };
            field.type.toLowerCase() == "string"
              ? (properties.type = String)
              : null;
            field.type.toLowerCase() == "number"
              ? (properties.type = Number)
              : null;
            field.type.toLowerCase() == "date"
              ? (properties.type = Date)
              : null;
            field.type.toLowerCase() == "file"
              ? (properties.type = String)
              : null;
            if (parseDecimalFormat(field.type).success == true) {
              properties.type = Number;
              properties.set = function (value) {
                // Assuming you want to keep 2 decimal places
                return truncateDecimal(value, parseDecimalFormat(field.type).n);
              };
              properties.validate = {
                validator: (value) => {
                  return createDecimalValidator(
                    parseDecimalFormat(field.type).m,
                    parseDecimalFormat(field.type).n
                  )(value);
                },
                message: `Value of ${field.fieldname} is not valid decimal format.`,
              };
            }
            field.isUnique && field.isUnique
              ? (properties.unique = true)
              : null;
            field.index && field.index == 1 ? (properties.index = "asc") : null;
            if (field.referenceTable !== null) {
              properties.ref = field.referenceTable;
              properties.validate = {
                validator: async (value) => {
                  return await validateReference(field, value, model);

                  // return checkDocumentExists(this[field.fieldname].ref,value)
                },
                message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`,
              };
            }
            schemaObj[field.fieldname] = properties;
          }
          SchemaCheck[0].child.forEach((child) => {
            schemaObj[child.tableName] = [{}];

            child.fields.forEach((field) => {
              let properties = {
                required: field.isRequired,
                default: field.defaultValue,
              };
              field.type.toLowerCase() == "string"
                ? (properties.type = String)
                : null;
              field.type.toLowerCase() == "number"
                ? (properties.type = Number)
                : null;
              field.type.toLowerCase() == "date"
                ? (properties.type = Date)
                : null;
              // field.isUnique && field.isUnique ? properties.unique = true : null
              if (field.referenceTable !== null) {
                properties.ref = field.referenceTable;
                properties.validate = {
                  validator: async (value) => {
                    return await validateReference(field, value, model);

                    // return checkDocumentExists(this[field.fieldname].ref,value)
                  },
                  message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`,
                };
              }
              if (parseDecimalFormat(field.type).success == true) {
                properties.type = Number;
                properties.set = function (value) {
                  // Assuming you want to keep 2 decimal places
                  return truncateDecimal(
                    value,
                    parseDecimalFormat(field.type).n
                  );
                };
                properties.validate = {
                  validator: (value) => {
                    return createDecimalValidator(
                      parseDecimalFormat(field.type).m,
                      parseDecimalFormat(field.type).n
                    )(value);
                  },
                  message: `Value of ${field.fieldname} is not valid decimal format`,
                };
              }
              if (field.isUnique && field.isUnique) {
                properties.validate = {
                  validator: function (value) {
                    //                                        // console.log("this parent",this.parent());
                    // Assuming `this.parent()` refers to the parent array (`fields`)
                    const fieldsArray = this.parent()[child.tableName];
                    // Count occurrences of `value` in `fieldname`s of the `fieldsArray`
                    const occurrences = fieldsArray.filter(
                      (item) => item[field.fieldname] === value
                    ).length;
                    // Validation passes if there's only one occurrence (the current field itself)
                    return occurrences === 1;
                  },
                  message: (props) =>
                    `${props.value} is not unique within the fields array`,
                };
              }
              schemaObj[child.tableName][0][field.fieldname] = properties;
            });
            child.subChild.forEach((subChild) => {
              schemaObj[child.tableName][0][subChild.tableName] = [{}];
              subChild.fields.forEach((field) => {
                let properties = {
                  required: field.isRequired,
                  default: field.defaultValue,
                };

                field.type.toLowerCase() == "string"
                  ? (properties.type = String)
                  : null;
                field.type.toLowerCase() == "number"
                  ? (properties.type = Number)
                  : null;
                field.type.toLowerCase() == "date"
                  ? (properties.type = Date)
                  : null;
                // field.isUnique && field.isUnique ? properties.unique = true : null
                if (field.referenceTable !== null) {
                  properties.ref = field.referenceTable;
                  properties.validate = {
                    validator: async (value) => {
                      return await validateReference(field, value, model);

                      // return checkDocumentExists(this[field.fieldname].ref,value)
                    },
                    message: `Value of ${field.fieldname} is not exist in reference table ${field.referenceTable}`,
                  };
                }
                if (parseDecimalFormat(field.type).success == true) {
                  properties.type = Number;
                  properties.set = function (value) {
                    // Assuming you want to keep 2 decimal places
                    return truncateDecimal(
                      value,
                      parseDecimalFormat(field.type).n
                    );
                  };
                  properties.validate = {
                    validator: (value) => {
                      return createDecimalValidator(
                        parseDecimalFormat(field.type).m,
                        parseDecimalFormat(field.type).n
                      )(value);
                    },
                    message: `Value of ${field.fieldname} is not valid decimal format`,
                  };
                }
                if (field.isUnique && field.isUnique) {
                  properties.validate = {
                    validator: function (value) {
                      //                                            console.log("this parent", this.parent());
                      // return true
                      // Assuming `this.parent()` refers to the parent array (`fields`)
                      const fieldsArray = this.parent()[subChild.tableName];
                      // Count occurrences of `value` in `fieldname`s of the `fieldsArray`
                      const occurrences = fieldsArray.filter(
                        (item) => item[field.fieldname] === value
                      ).length;
                      // Validation passes if there's only one occurrence (the current field itself)
                      return occurrences === 1;
                    },
                    message: (props) =>
                      `${props.value} is not unique within the fields array For ${subChild.tableName}`,
                  };
                }
                schemaObj[child.tableName][0][subChild.tableName][0][
                  field.fieldname
                ] = properties;
                //                                // console.log(insertData[child.tableName][0][subChild.tableName][0]);
              });
            });
            //                        // console.log(insertData[child.tableName][0]);
          });
          //                    // return console.log(schemaObj);
          //                    //   return  console.log(insertData);
          let data = await model.updateIfAvailableElseInsertMaster(
            "tblUser",
            schemaObj,
            insertData,
            { ip: extractIPv4(req.ip || req.connection.remoteAddress) },
            ""
          );
          data
            ? res.send({
                success: true,
                message: "Data inserted successfully....",
                data: data,
              })
            : res.status(500).send({
                success: false,
                message: "Data not inserted Successfully...",
                data: data,
              });
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "Data not inserted Successfully...",
            data: error.message,
          });
        }
      }
    });
  },
  login: async (req, res) => {
    //        console.log(req.body);
    const validationRule = {
      userName: "required",
      password: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(412).send({
          success: false,
          message: "Validation error",
          data: err,
        });
      } else {
        try {
          let _match = {
            status: Number(process.env.ACTIVE_STATUS),
            password: md5(req.body.password),
            $or: [
              // {
              //     userName: req.body.userName,
  
              // },
              {
                email: req.body.userName,
              },
              {
                mobile: req.body.userName,
              },
            ],
          };
          let query = [
            {
              $match: _match,
            },
            {
              $addFields: {
                profilePhoto: {
                  $concat: [
                    process.env.HOST + process.env.PORT + "/api/images/",
                    "$profilePhoto",
                  ],
                },
              },
            },
            {
              $project: {
                password: 0,
                menuAccess: 0,
              },
            },
          ];
          let data = await model.AggregateFetchData(
            "tblUser",
            "tblUser",
            query,
            res
          );
          if (data.length > 0) {
            let userName = data[0].email || data[0].mobile;
            let otp = generateOTP();
  
            if (
              data[0].twoStepVerification == true &&
              data[0].emailVerification == true &&
              data[0].smsVerification == true
            ) {
              //                            console.log("heloo");
              //                            console.log(`Sms sent on your Mobile Number ${data[0].mobile} is your otp for verification ${otp}`);
              SendMail(
                data[0].email,
                "Opt Verification",
                "Your OTP is " + otp,
                ""
              );
              await model.updateIfAvailableElseInsert(
                "tblOtpLog",
                "tblOtpLog",
                { id: "", userID: data[0].id, otp: otp, action: "login" },
                {},
                res
              );
              return res.send({
                success: true,
                message: "OTP Send Successfully",
                data: [],
              });
            } else if (
              data[0].twoStepVerification == true &&
              data[0].emailVerification == true
            ) {
              //                            // console.log(`Sms sent on your Mobile Number ${data[0].mobile} is your otp for verification ${otp}`);
              SendMail(
                data[0].email,
                "Opt Verification",
                "Your OTP is " + otp,
                ""
              );
              await model.updateIfAvailableElseInsert(
                "tblOtpLog",
                "tblOtpLog",
                { id: "", userID: data[0].id, otp: otp, action: "login" },
                {},
                res
              );
              return res.send({
                success: true,
                message: "OTP Send Successfully",
                data: [],
              });
            } else if (
              data[0].twoStepVerification == true &&
              data[0].smsVerification == true
            ) {
              //                            console.log(`Sms sent on your Mobile Number ${data[0].mobile} is your otp for verification ${otp}`);
              await model.updateIfAvailableElseInsert(
                "tblOtpLog",
                "tblOtpLog",
                { id: "", userID: data[0].id, otp: otp, action: "login" },
                {},
                res
              );
              return res.send({
                success: true,
                message: "OTP Send Successfully",
                data: [],
              });
            }
  
            // Define the list of fields that require lookups in tblMasterList
            const fieldsToLookup = [
              "commonFontFamily",
              "commonFontSize",
              "commonFontWeight",
              "navbarFontSize",
              "navbarFontWeight",
              "sidebarFontSize",
              "sidebarFontWeight",
              "tableHeaderFontSize",
              "tableHeaderFontWeight",
              "tableRowFontSize",
              "tableRowFontWeight",
              "accordionChildHeaderFontSize",
              "accordionChildHeaderFontWeight",
              "accordionParentHeaderFontSize",
              "accordionParentHeaderFontWeight",
              "inputFontSize",
              "inputFontWeight",
              "buttonFontSize",
              "buttonFontWeight",
            ];
  
            // Function to dynamically generate $lookup and $unwind stages for each field
            const generateLookupsAndUnwinds = (fields) => {
              return fields.flatMap((field) => [
                {
                  $lookup: {
                    from: "tblMasterList",
                    let: { fieldId: { $toObjectId: `$${field}` } }, // Convert the field to ObjectId
                    pipeline: [
                      { $match: { $expr: { $eq: ["$_id", "$$fieldId"] } } }, // Match _id from tblMasterList
                      { $project: { name: 1 } }, // Only get the 'name' field
                    ],
                    as: `${field}Details`, // Store the result in {field}Details
                  },
                },
                {
                  $unwind: {
                    path: `$${field}Details`,
                    preserveNullAndEmptyArrays: true, // Retain the original document even if no match
                  },
                },
              ]);
            };
  
            // Dynamically generate the lookup and unwind stages
            const lookupStages = generateLookupsAndUnwinds(fieldsToLookup);
  
            // Define the complete aggregation pipeline
            let theamData = await model.AggregateFetchData(
              "tblThemeMaster",
              "tblThemeMaster",
              [
                {
                  $match: {
                    status: Number(process.env.ACTIVE_STATUS),
                    $expr: {
                      $and: [{ $eq: ["$_id", { $toObjectId: data[0].themeId }] }],
                    },
                  },
                },
                // Spread dynamically generated lookup and unwind stages
                ...lookupStages,
                // Dynamically project the fields without hardcoding all field names
                {
                  $project: {
                    // Merge all existing fields with dynamically generated name values
                    mergedFields: {
                      $mergeObjects: [
                        "$$ROOT", // Includes all original fields from the document
                        fieldsToLookup.reduce((acc, field) => {
                          acc[field] = `$${field}Details.name`; // Replace ObjectId with the corresponding name
                          return acc;
                        }, {}),
                      ],
                    },
                  },
                },
                // Remove the unwanted detail fields
                {
                  $replaceRoot: { newRoot: "$mergedFields" },
                },
                {
                  $unset: fieldsToLookup.map((field) => `${field}Details`), // Unset all detail fields (e.g., commonFontFamilyDetails)
                },
              ],
              res
            );
  
            if (theamData.length == 0) {
              theamData = await model.AggregateFetchData(
                "tblThemeMaster",
                "tblThemeMaster",
                [
                  {
                    $match: {
                      status: Number(process.env.ACTIVE_STATUS),
                      $expr: {
                        $and: [{ $eq: ["$themeName", "New Default"] }],
                      },
                    },
                  },
                  {
                    $project: {
                      clientCode: 0,
                    },
                  },
                ]
              );
            }
            
            // theamData[0].clientCode=data[0].clientCode
            data[0] = {  ...theamData[0] , ...data[0] };
            // data[0].twoStepVerification?:null
            let token = jwt.sign(
              {
                id: data[0].id,
                userName: data[0].email,
                iat: Date.now(),
                numberFormat: data[0].numberFormat,
                clientCode: data[0].clientCode || "NCLP",
              },
              config.secret,
              { expiresIn: 7200000 }
            );
            //                        console.log(token);
            try {
              const checkWrongPass = await userFindByEmailLogin(data[0].email);
              if (checkWrongPass > 2) {
                return res.status(400).send({
                  success: false,
                  message: "User is Inactive",
                  data: [],
                });
              } else {
                const sessionExpiry = Redis_expire_time; // 2 days
                const sessionKey = `user:${data[0].email}:session`;
                // Check if user already exists
                let userExists = await client.exists(sessionKey);
                // Store session data with expiration
                await client.hmset(sessionKey, {
                  email: data[0].email,
                  token: token,
                });
                await client.expire(sessionKey, sessionExpiry);
                if (isDateOlderThan60Days(data[0].passwordLastUpdateDate)) {
                  return res.status(200).send({
                    success: "60DaysResetPassword",
                    message: "60DaysResetPassword",
                    token: token,
                    data: data,
                  });
                } else if (userExists) {
                  return res.status(200).send({
                    success: "active",
                    message: "User already exists and is active!",
                    token: token,
                    data: data,
                  });
                } else {
                  return res.send({
                    success: true,
                    message: "User Login Successfully.",
                    token: token,
                    data: data,
                  });
                }
              }
            } catch (error) {
              console.error("Error setting value in Redis:", error);
              return res.status(500).send({
                success: false,
                message: "Internal Server Error",
              });
            }
          } else {
            let query = [
              {
                $match: {
                  status: Number(process.env.ACTIVE_STATUS),
                  $or: [
                    // {
                    //     userName: req.body.userName,
  
                    // },
                    {
                      email: req.body.userName,
                    },
                    {
                      mobile: req.body.userName,
                    },
                  ],
                },
              },
              {
                $addFields: {
                  profilePhoto: {
                    $concat: [
                      process.env.HOST + process.env.PORT + "/api/images/",
                      "$profilePhoto",
                    ],
                  },
                },
              },
              // {
              //     $project: {
              //         userName: 1,
              //         name: 1,
              //         email: 1,
              //         profilePhoto: 1
              //     }
              // }
            ];
            //                        console.log("else");
  
            let data = await model.AggregateFetchData(
              "tblUser",
              "tblUser",
              query,
              res
            );
            if (data.length > 0) {
              let findUser = await userFindByEmail(data[0].email);
              let userActive = await loginFailHandler(findUser, data[0]);
  
              if (userActive === 3) {
                res.status(403).send({
                  success: false,
                  message:
                    "Your account status is disabled. We have sent you an activation email. Kindly click on the activation link to activate your account.",
                  data: data[0].email,
                });
                return; // Exit the function after sending the response
              }
  
              if (userActive >= 3) {
                res.status(403).send({
                  success: false,
                  message: "Email can only be sent once every 2 hours.",
                  data: data[0].email,
                });
                return; // Exit the function after sending the response
              }
              res.status(403).send({
                success: false,
                message: "Invalid Password",
                data: [],
              });
            } else {
              res.status(403).send({
                success: false,
                message: "Invalid UserName",
                data: [],
              });
            }
          }
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  VerifyOtp: async (req, res) => {
    const validationRule = {
      otp: "required",
      userName: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "Validation error",
          data: err,
        });
      } else {
        try {
          let query = [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                // otp: Number(req.body.otp),
                $or: [
                  {
                    userName: req.body.userName,
                  },
                  {
                    email: req.body.userName,
                  },
                  {
                    mobile: req.body.userName,
                  },
                ],
              },
            },
            {
              $addFields: {
                profilePhoto: {
                  $concat: [
                    process.env.HOST + process.env.PORT + "/api/images/",
                    "$profilePhoto",
                  ],
                },
              },
            },
            {
              $project: {
                password: 0,
                menuAccess: 0,
              },
            },
          ];
          let data = await model.AggregateFetchData(
            "tblUser",
            "tblUser",
            query,
            res
          );
          if (data.length > 0) {
            let userName = data[0].userName;
            let otpdata = await model.AggregateFetchData(
              "tblOtpLog",
              "tblOtpLog",
              [
                {
                  $match: {
                    userID: data[0].id,
                    otp: req.body.otp,
                    isUseable: 1,
                  },
                },
              ],
              res
            );
            if (otpdata.length > 0) {
              // let token = jwt.sign({ id: data[0].id ,userName: data[0].email, iat: Date.now(), companyName: data[0].defaultCompanyId, brachName: data[0].defaultBranchId,defaultFinYearId:data[0].defaultFinYear,numberFormat:data[0].numberFormat  }, config.secret, { expiresIn: 7200000 });
              let token = jwt.sign(
                {
                  id: data[0].id,
                  userName: data[0].email,
                  iat: Date.now(),
                  numberFormat: data[0].numberFormat,
                },
                config.secret,
                { expiresIn: 7200000 }
              );
              // await model.updateIfAvailableElseInsert("tblOtpLog", "tblOtpLog", { id: otpdata[0].id, isUseable: 0 }, {}, res)
              await model.Update(
                "tblOtpLog",
                "tblOtpLog",
                { userID: data[0].id },
                { isUseable: 0 },
                {},
                res
              );
              res.send({
                success: true,
                message: "OTP Verified Successfully",
                data: data,
                token: token,
              });
            } else {
              res.status(403).send({
                success: false,
                message: "Invalid OTP",
                data: [],
              });
            }
          } else {
            res.status(403).send({
              success: false,
              message: "Invalid OTP",
              data: [],
            });
          }
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  forgotPassword: async (req, res) => {
    const validationRule = {
      userName: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "Validation error",
          data: err,
        });
      } else {
        try {
          let query = [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  {
                    userName: req.body.userName,
                  },
                  {
                    email: req.body.userName,
                  },
                  {
                    mobile: req.body.userName,
                  },
                ],
              },
            },
          ];
          let otp = generateOTP();
          let data = await model.AggregateFetchData(
            "tblUser",
            "tblUser",
            query,
            res
          );
          if (data.length > 0) {
            await model.updateIfAvailableElseInsert(
              "tblOtpLog",
              "tblOtpLog",
              { id: "", userID: data[0].id, otp: otp, action: "forgot" },
              {},
              res
            );
            let templete = Mailtemplate.mailOtp(otp);
            //                        console.log(templete);
            SendMail(data[0].email, "Forgot Password", "", templete);
            res.send({
              success: true,
              message: "OTP sent to your mail",
              data: data,
            });
          } else {
            res.status(403).send({
              success: false,
              message: "user not found",
              data: data,
            });
          }
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  changePassword: async (req, res) => {
    let validationRule = {
      userName: "required",
      newPassword: "required",
    };
    if (req.body.forgotPassword) {
      if (
        req.body.forgotPassword &&
        (req.body.forgotPassword == true || req.body.forgotPassword == "true")
      ) {
        validationRule = {
          userName: "required",
          newPassword: "required",
          forgotPassword: "required",
        };
      } else {
        validationRule = {
          userName: "required",
          oldPassword: "required",
          newPassword: "required",
        };
      }
    } else {
      validationRule = {
        userName: "required",
        newPassword: "required",
        forgotPassword: "required",
      };
    }
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "Validation error",
          data: err,
        });
      } else {
        try {
          if (
            req.body.forgotPassword &&
            (req.body.forgotPassword == true ||
              req.body.forgotPassword == "true")
          ) {
            // let data = await model.Update("tblUser", "tblUser", { userName: req.body.userName, status: Number(process.env.ACTIVE_STATUS) }, { password: md5(req.body.newPassword) }, {}, res)
            let data = await model.Update(
              "tblUser",
              "tblUser",
              {
                $or: [
                  {
                    userName: req.body.userName,
                  },
                  {
                    email: req.body.userName,
                  },
                  {
                    mobile: req.body.userName,
                  },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
              {
                password: md5(req.body.newPassword),
                passwordLastUpdateDate: new Date().toISOString().split("T")[0],
              },
              {},
              res
            );
            if (data) {
              res.send({
                success: true,
                message: "Password Changed Successfully",
                data: data,
              });
            } else {
              res.status(400).send({
                success: false,
                message: "Password Not Changed",
                data: data,
              });
            }
          } else {
            //                        console.log("hello");
            // let data = await model.Update("tblUser", "tblUser", { userName: req.body.userName, status: Number(process.env.ACTIVE_STATUS), password: md5(req.body.oldPassword) }, { password: md5(req.body.newPassword) }, {}, res)
            let data = await model.Update(
              "tblUser",
              "tblUser",
              {
                $or: [
                  {
                    userName: req.body.userName,
                  },
                  {
                    email: req.body.userName,
                  },
                  {
                    mobile: req.body.userName,
                  },
                ],
                status: Number(process.env.ACTIVE_STATUS),
                password: md5(req.body.oldPassword),
              },
              {
                password: md5(req.body.newPassword),
                passwordLastUpdateDate: new Date().toISOString().split("T")[0],
              },
              {},
              ""
            );
            if (data.matchedCount > 0) {
              res.send({
                success: true,
                message: "Password Changed Successfully",
                data: data,
              });
            } else {
              res.status(400).send({
                success: false,
                message: "Invalid old password",
                data: [],
              });
            }
          }
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  verifyEmail: async (req, res) => {
    const tableName = "tblUser";
    const emailVal = req.body.email;
    try {
      const collection = mongoose.connection.collection(tableName);
      const email = emailVal;
      const user = await collection.findOne({ email: email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found!",
        });
      }
      const emailData = {
        from: "aakashvishwakarmarm4001@gmail.com",
        to: user.email,
        subject: "Verification Otp",
        name: user.name,
        OTP: generateOTP(),
      };
      return res.status(200).json({
        success: true,
        data: emailData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  },
  logout: async (req, res) => {
    const { token } = req.body;
    const decoded = jwt.decode(token);
    try {
      const sessionKey = `user:${decoded.userName}:session`;
      await client.del(sessionKey);
      return res.send({
        success: true,
        message: "User Logout Successfully.",
      });
    } catch (error) {
      console.error("Error setting value in Redis:", error);
      return res.status(500).send({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
  verifyRedisToken: async (req, res) => {
    const token = req.query.token;
    if (!token) {
      res.status(400).json({ success: false, message: "Token is required" });
    }
    const decoded = jwt.decode(token);
    try {
      const sessionKey = `user:${decoded.userName}:session`;
      // const exists = await client.exists(sessionKey);
      const storedToken = await client.hget(sessionKey, "token");
      let tokenValid = storedToken.trim() === token.trim();
      if (tokenValid) {
        await client.expire(sessionKey,Redis_expire_time);
        return res.status(200).json({ success: true });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Token not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: `server error ${error.message}` });
    }
  },
};
