const validate = require('../helper/validate')
const model = require("../models/module")
const functionForCommaSeperated = require('../helper/CommaSeperatedValue')
const mongoose = require('mongoose')
const moment = require('moment')
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
    return companyId;
  }
}

// myModule.js
module.exports = {
  generateIRN: async (req, res) => {
    const validationRule = {
      companyId: "required",
      companyBranchId: "required",
      finYearId: "required",
      accountInvoiceId: "required"

    }
    validate(req.body, validationRule, {}, async (errr, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation error",
          data: errr
        })
      }
      else {

        try {
          const { companyId, companyBranchId, finYearId, accountInvoiceId } = req.body
          var next_fin_year_id
          var clientCode = req.clientCode;

          console.log(clientCode);
          var userName;
          var password;
          var einvoiceLink;

          if (clientCode == "NCLP") {

            // Fetch usernames where companybranchid is 8331
            // userName = await tblCompanyBranchParameter.find({ companybranchid: companyBranchId}, { projection: { _id: 0, username: 1 } }).toArray();
            userName = await model.AggregateFetchData("tblCompanyBranchParameter", "tblCompanyBranchParameter", [{ $match: { companyBranchId: companyBranchId } }], res)
            // console.log(userName);
            // return  res.status(200).send({
            //     success: true,
            //     message: "username fetched successfully",
            //     data: userName
            // })

            let userNameDetails = await model.AggregateFetchData("tblInvoice", "tblInvoice", [
              {
                $match: {
                  _id: createObjectId(accountInvoiceId)
                }

              },
              {
                $lookup: {
                  from: "tblCompanyBranchParameter",
                  let: { branchId: "$companyBranchId" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{
                            $eq: ["$companyBranchId", "$$branchId"]
                          }]
                        }
                      }
                    }
                  ],
                  as: "companyBranchParameterData"
                }
              }
            ]



            )
            res.send(userNameDetails);

          }
          else if (clientCode == "SSL") {
            next_fin_year_id = finYearId
          }
          else if (clientCode == "COSCO") {
            next_fin_year_id = finYearId
          }
          else {
            throw new Error("CLIENT CODE NOT FOUND")
          }

        }
        catch (error) {
          errorLogger(error, req)
          res.status(500).send({
            success: false,
            message: "something went wrong",
            data: error.message
          })
        }
      }


    })


  },
  eInvoicingGSTHero: async (req, res) => {
    const validationRule = {
      invoiceId: "required"
    }
    validate(req.body, validationRule, {}, async (errr, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation error",
          data: errr
        })
      }
      else {
        try {
          const { invoiceId } = req.body
          const invoiceData = await model.AggregateFetchData("tblInvoice", "tblInvoice", [
            { $match: { _id: createObjectId(invoiceId), clientCode: req.clientCode } },
            {
              $lookup: {
                from: "tblVoucherType",
                let: {
                  id: "$voucherTypeId"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$_id",
                              { $toObjectId: "$$id" }
                            ]
                          }
                        ]
                      }
                    }
                  }
                ],
                as: "voucherType"
              }
            },
            {
              $unwind: {
                path: "$voucherType",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: "tblMasterData",
                let: { sez: "$sez" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$clientCode", req.clientCode] },
                          {
                            $eq: [
                              "$_id",
                              { $toObjectId: "$$sez" }
                            ]
                          }
                        ]
                      }
                    }
                  }
                ],
                as: "sez"
              }
            },
            {
              $unwind: {
                path: "$sez",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: "tblCompany",
                let: { id: "$loginCompany", branchId: "$loginBranch" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", { $toObjectId: "$$id" }] }] } } },
                {
                  $addFields: {
                    tblCompanyBranch: {
                      $filter: {
                        input: "$tblCompanyBranch",
                        as: "branch",
                        cond: {
                          $eq: ["$$branch._id", { $toObjectId: "$$branchId" }]
                        }
                      }
                    }
                  }
                },
                {
                  $unwind: {
                    path: "$tblCompanyBranch",
                    includeArrayIndex: "string",
                    preserveNullAndEmptyArrays: false
                  }
                },
                {
                  $lookup: {
                    from: "tblCountry",
                    let: {
                      stateId: "$tblCompanyBranch.stateId",
                      cityId: "$tblCompanyBranch.cityId"
                    },
                    pipeline: [
                      {
                        $match: {
                          clientCode: "NCLP"
                        }
                      },
                      {
                        $unwind: {
                          path: "$tblState"
                        }
                      },
                      {
                        $match: {
                          $expr: {
                            $and: [
                              {
                                $eq: [
                                  "$tblState._id",
                                  { $toObjectId: "$$stateId" }
                                ]
                              }
                            ]
                          }
                        }
                      },
                      {
                        $addFields: {
                          tblCity: {
                            $filter: {
                              input: "$tblCity",
                              as: "city",
                              cond: {
                                $eq: [
                                  "$$city._id",
                                  { $toObjectId: "$$cityId" }
                                ]
                              }
                            }
                          }
                        }
                      },
                      { $unwind: { path: "$tblCity" } }
                    ],
                    as: "country"
                  }
                },
                {
                  $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true
                  }
                }
                ],
                as: "OwncompanyData"
              },

            },
            {
              $unwind: {
                path: "$OwncompanyData",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: "tblGeneralLedger",
                let: { id: "$billingPartyId", gstId: "$billingPartyGstinNoId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$_id",
                              { $toObjectId: "$$id" }
                            ]
                          }
                        ]
                      }
                    }
                  },
                  {
                    $addFields: {
                      tblGlGst: {
                        $filter: {
                          input: "$tblGlGst",
                          as: "branch",
                          cond: {
                            $eq: ["$$branch._id", { $toObjectId: "$$gstId" }]
                          }
                        }
                      }
                    }
                  },
                  {
                    $unwind: {
                      path: "$tblGlGst",
                      includeArrayIndex: "string",
                      preserveNullAndEmptyArrays: false
                    }
                  },
                  {
                    $lookup: {
                      from: "tblCountry",
                      let: {
                        stateId: "$tblGlGst.stateId",
                        cityId: "$tblGlGst.cityId"
                      },
                      pipeline: [
                        {
                          $match: {
                            clientCode: "NCLP"
                          }
                        },
                        {
                          $unwind: {
                            path: "$tblState"
                          }
                        },
                        {
                          $match: {
                            $expr: {
                              $and: [
                                {
                                  $eq: [
                                    "$tblState._id",
                                    { $toObjectId: "$$stateId" }
                                  ]
                                }
                              ]
                            }
                          }
                        },
                        {
                          $addFields: {
                            tblCity: {
                              $filter: {
                                input: "$tblCity",
                                as: "city",
                                cond: {
                                  $eq: [
                                    "$$city._id",
                                    { $toObjectId: "$$cityId" }
                                  ]
                                }
                              }
                            }
                          }
                        },
                        { $unwind: { path: "$tblCity" } }
                      ],
                      as: "country"
                    }
                  },
                  {
                    $unwind: {
                      path: "$country",
                      preserveNullAndEmptyArrays: true
                    }
                  }
                ],
                as: "custGL"
              }
            },
            {
              $unwind: {
                path: "$custGL",
                preserveNullAndEmptyArrays: true

              }
            },
            {
              $lookup: {
                from: "tblCountry",
                let: { id: "$placeOfSupplyStateId" },
                pipeline: [
                  {
                    $match: {
                      clientCode: "NCLP"
                    }
                  },
                  {
                    $unwind: {
                      path: "$tblState"
                    }
                  },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$tblState._id", { $toObjectId: "$$id" }]
                      }
                    }
                  },
                  {
                    $project: {
                      tblState: 1
                    }
                  }
                ],
                as: "placeOfSupplyStateData"

              }
            },
            {
              $unwind: {
                path: "$placeOfSupplyStateData",
                // preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: "tblInvoice",
                let: { id: "$parentInvoiceId", voucherTypeId: "$voucherTypeId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: [
                              "$_id",
                              { $toObjectId: "$$id" }
                            ]
                          }
                        ]
                      }
                    }
                  },
                  {
                    $lookup: {
                      from: "tblVoucherType",
                      let: {
                        id: {
                          $ifNull: [
                            "$voucherTypeId",
                            "$$voucherTypeId"
                          ]
                        }
                      },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [
                                {
                                  $eq: [
                                    "$_id",
                                    { $toObjectId: "$$id" }
                                  ]
                                }
                              ]
                            }
                          }
                        }
                      ],
                      as: "voucherType"
                    }
                  }
                ],
                as: "parent_invoice"
              }
            },
            {
              $project: {
                action: { $literal: "GENERATEIRN" },
                "data.version": { $literal: "1.01" },
                "data.tranDtls.supTyp": {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$sez.code", "Y"] },
                        then: "SEZWP"
                      },
                      {
                        case: { $eq: ["$sez.code", "E"] },
                        then: "SEZWOP"
                      },
                      {
                        case: {
                          $and: [
                            { $eq: ["$custGL.country.tblState.name", "OTHER TERRITORY"] },
                            {
                              $or: [
                                { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, ""] },
                                { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, "NA"] }
                              ]
                            },
                            { $ne: [{ $ifNull: ["$taxAmount", 0] }, 0] }
                          ]
                        },
                        then: "EXPWP"
                      },
                      {
                        case: {
                          $and: [
                            { $eq: ["$custGL.country.tblState.name", "OTHER TERRITORY"] },
                            {
                              $or: [
                                { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, ""] },
                                { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, "NA"] }
                              ]
                            },
                            { $eq: [{ $ifNull: ["$taxAmount", 0] }, 0] }
                          ]
                        },
                        then: "EXPWOP"
                      }
                    ],
                    default: "B2B"
                  }
                },
                "data.tranDtls.regRev": { $literal: "N" },
                "data.tranDtls.igstOnIntra": { $literal: "N" },
                "data.docDtls.typ": {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: [{ $trim: { input: "$voucherType.code" } }, "BSE"] },
                        then: "BOS"
                      },
                      {
                        case: { $eq: [{ $trim: { input: "$voucherType.code" } }, "CN"] },
                        then: "CRN"
                      },
                      {
                        case: { $eq: [{ $trim: { input: "$voucherType.code" } }, "CRN"] },
                        then: "CRN"
                      },
                      {
                        case: { $eq: [{ $trim: { input: "$voucherType.code" } }, "DN"] },
                        then: "DBN"
                      },
                      {
                        case: { $eq: [{ $trim: { input: "$voucherType.code" } }, "DRN"] },
                        then: "DBN"
                      }
                    ],
                    default: "INV"
                  }
                },
                "data.docDtls.no": "$invoiceNo",
                "data.docDtls.dt": {
                  $dateToString: { format: "%d/%m/%Y", date: "$invoiceDate" }
                },
                "data.sellerDtls.gstin": "$OwncompanyData.gstinNo",
                "data.sellerDtls.lglNm": "$OwncompanyData.name",
                "data.sellerDtls.trdNm": "$OwncompanyData.name",
                "data.sellerDtls.addr1": {
                  $cond: {
                    if: {
                      $and: [
                        { $gt: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 50] },
                        { $lt: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 53] }
                      ]
                    },
                    then: { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 0, 5] },
                    else: {
                      $cond: {
                        if: { $lte: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 50] },
                        then: { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 0, 5] },
                        else: { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 0, 50] }
                      }
                    }
                  }
                },
                "data.sellerDtls.addr2": {
                  $cond: [
                    {
                      $and: [
                        { $gt: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 50] },
                        { $lt: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 53] }
                      ]
                    },
                    { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 5, 55] }, // 0-based index
                    {
                      $cond: [
                        { $lte: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 50] },
                        { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 5, 50] }, // Extract from position 6 up to length 50
                        { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 50, 100] } // Extract from position 51 up to length 100
                      ]
                    }
                  ]
                },
                "data.sellerDtls.loc": "$OwncompanyData.country.tblCity.name",       // Maps ownbrcity.city_name to data.sellerDtls.loc
                "data.sellerDtls.pin": "$OwncompanyData.tblCompanyBranch.pincode",        // Maps owncompbr.pin_code to data.sellerDtls.pin
                "data.sellerDtls.stcd": {                            // Extracts the first two characters of ownbrstate.state_code_sb_file
                  $substrCP: ["$OwncompanyData.country.tblState.code", 0, 2]
                },
                "data.sellerDtls.ph": null,                          // Null value for data.sellerDtls.ph
                "data.sellerDtls.em": null,
                "data.buyerDtls.gstin": {
                  $cond: [
                    { $eq: [{ $strLenCP: "$custGL.tblGlGst.gstinNo" }, 15] },      // Check if length of gstin_no is 15
                    "$custGL.tblGlGst.gstinNo",                                    // Return gstin_no if true
                    {
                      $cond: [
                        {
                          $or: [
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, ""] }, // Check if gstin_no is null or empty
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, "NA"] } // Check if gstin_no is 'NA'
                          ]
                        },
                        "URP",                                              // Return 'URP' if gstin_no is null or 'NA'
                        ""                                                  // Return empty string otherwise
                      ]
                    }
                  ]
                },
                "data.buyerDtls.lglNm": "$custGL.name",  // Maps custGL.name to data.buyerDtls.lglNm
                "data.buyerDtls.trdNm": "$custGL.name",
                "data.buyerDtls.pos": {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$custGL.country.tblState.name", "OTHER TERRITORY"] },            // Check if custstate.state_name is 'OTHER TERRITORY'
                        {
                          $or: [
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, ""] },         // Check if gstin_no is null or empty
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, "NA"] }        // Check if gstin_no is 'NA'
                          ]
                        },
                        { $eq: [{ $ifNull: ["$taxAmount", 0] }, 0] }                   // Check if tax_amount is 0 or null
                      ]
                    },
                    "96",                                                                 // Return '96' if the above conditions are true
                    {                                                                     // Else block
                      $ifNull: [
                        { $substrCP: ["$placeOfSupplyStateData.tblState.code", 0, 2] },             // Try to get the first 2 characters from posstate.state_code_sb_file
                        { $substrCP: ["$custGL.country.tblState.code", 0, 2] }            // Fallback to the first 2 characters from custstate.state_code_sb_file if posstate is null
                      ]
                    }
                  ]
                },
                "data.buyerDtls.addr1": {
                  $cond: [
                    {
                      $and: [
                        { $gt: [{ $strLenCP: "$address" }, 50] },
                        { $lt: [{ $strLenCP: "$address" }, 53] }
                      ]
                    },
                    { $substrCP: ["$address", 0, 5] }, // Extracts first 5 characters
                    {
                      $cond: [
                        { $lte: [{ $strLenCP: "$address" }, 50] },
                        { $substrCP: ["$address", 0, 5] }, // Extracts first 5 characters if length <= 50
                        { $substrCP: ["$address", 0, 50] } // Extracts first 50 characters if length > 53
                      ]
                    }
                  ]
                },
                "data.buyerDtls.addr2": {
                  $cond: [
                    {
                      $and: [
                        { $gt: [{ $strLenCP: "$address" }, 50] },
                        { $lt: [{ $strLenCP: "$address" }, 53] }
                      ]
                    },
                    { $substrCP: ["$address", 5, 55] }, // Extracts 55 characters starting from position 6 (index 5 in MongoDB)
                    {
                      $cond: [
                        { $lte: [{ $strLenCP: "$address" }, 50] },
                        { $substrCP: ["$address", 5, 50] }, // Extracts 50 characters starting from position 6 (index 5) if length <= 50
                        { $substrCP: ["$address", 50, 100] } // Extracts 100 characters starting from position 51 (index 50) if length > 50
                      ]
                    }
                  ]
                },
                "data.buyerDtls.loc": {
                  $cond: [
                    { $eq: ["$custGL.country.tblState.name", "Other Territory"] },  // Check if state_name is 'Other Territory'
                    "Other Country",                                        // Return 'Other Country' if true
                    "$custGL.country.tblCity.name"                                   // Else return custcity.city_name
                  ]
                },
                "data.buyerDtls.pin": {
                  $cond: [
                    { $eq: ["$custGL.country.tblState.name", "Other Territory"] },  // Check if state_name is 'Other Territory'
                    "999999",                                               // Return '999999' if true
                    "$custGL.tblGlGst.pincode"                                      // Else return custgst.pincode
                  ]
                },
                "data.buyerDtls.stcd": {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$custGL.country.tblState.name", "Other Territory"] },   // Check if custstate.state_name is 'Other Territory'
                        {
                          $or: [
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, ""] },  // Check if gstin_no is null or empty
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, "NA"] } // Check if gstin_no is 'NA'
                          ]
                        }
                      ]
                    },
                    96,                                                           // Return 96 if the above conditions are true
                    { $substrCP: ["$custGL.country.tblState.code", 0, 2] }         // Else return the first 2 characters of state_code_sb_file
                  ]
                },
                "data.buyerDtls.ph": null,       // Null value for data.buyerDtls.ph
                "data.buyerDtls.em": null,       // Null value for data.buyerDtls.em
                "data.dispDtls.nm": "$OwncompanyData.name",
                "data.dispDtls.addr1": {
                  $cond: [
                    {
                      $and: [
                        { $gt: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 50] },  // Check if length of address is greater than 50
                        { $lt: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 53] }   // Check if length of address is less than 53
                      ]
                    },
                    { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 0, 5] },  // Extract first 5 characters if length is between 51 and 52
                    {
                      $cond: [
                        { $lte: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 50] }, // Check if length of address is less than or equal to 50
                        { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 0, 5] },         // Extract first 5 characters if true
                        { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 0, 50] }         // Extract first 50 characters if length is greater than 52
                      ]
                    }
                  ]
                },
                "data.dispDtls.addr2": {
                  $cond: [
                    {
                      $and: [
                        { $gt: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 50] },  // Check if length of address is greater than 50
                        { $lt: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 53] }   // Check if length of address is less than 53
                      ]
                    },
                    { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 5, 55] },  // Extract substring starting from position 6 (index 5) for 55 characters
                    {
                      $cond: [
                        { $lte: [{ $strLenCP: "$OwncompanyData.tblCompanyBranch.address" }, 50] }, // Check if length of address is less than or equal to 50
                        { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 5, 50] },         // Extract substring starting from position 6 (index 5) for 50 characters
                        { $substrCP: ["$OwncompanyData.tblCompanyBranch.address", 50, 100] }        // Extract substring starting from position 51 (index 50) for 100 characters
                      ]
                    }
                  ]
                },
                "data.dispDtls.loc": "$OwncompanyData.country.tblCity.name",                          // Map ownbrcity.city_name to data.dispDtls.loc
                "data.dispDtls.pin": "$OwncompanyData.tblCompanyBranch.pincode",                         // Map owncompbr.pin_code to data.dispDtls.pin
                "data.dispDtls.stcd": { $substrCP: ["$OwncompanyData.country.tblState.code", 0, 2] }, // Extract first 2 characters from state_code_sb_file
                "data.shipDtls.gstin": {
                  $cond: [
                    { $eq: [{ $strLenCP: "$custGL.tblGlGst.gstinNo" }, 15] },  // Check if gstin_no length is 15
                    "$custGL.tblGlGst.gstinNo",                                   // Return gstin_no if true
                    {
                      $cond: [
                        {
                          $or: [
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, ""] }, // Check if gstin_no is null or empty
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, "NA"] } // Check if gstin_no is 'NA'
                          ]
                        },
                        "URP",                                                // Return 'URP' if true
                        ""                                                   // Return empty string otherwise
                      ]
                    }
                  ]
                },
                "data.shipDtls.lglNm": "$custGL.name",               // Map custGL.gl_desc to data.shipDtls.lglNm
                "data.shipDtls.trdNm": "$custGL.name",
                "data.shipDtls.addr1": {
                  $cond: [
                    {
                      $and: [
                        { $gt: [{ $strLenCP: "$address" }, 50] },  // Check if length of address is greater than 50
                        { $lt: [{ $strLenCP: "$address" }, 53] }   // Check if length of address is less than 53
                      ]
                    },
                    { $substrCP: ["$address", 0, 5] },          // Extract first 5 characters if length is between 51 and 52
                    {
                      $cond: [
                        { $lte: [{ $strLenCP: "$address" }, 50] }, // Check if length of address is less than or equal to 50
                        { $substrCP: ["$address", 0, 5] },         // Extract first 5 characters if true
                        { $substrCP: ["$address", 0, 50] }         // Extract first 50 characters if length is greater than 52
                      ]
                    }
                  ]
                },
                "data.shipDtls.addr2": {
                  $cond: [
                    {
                      $and: [
                        { $gt: [{ $strLenCP: "$address" }, 50] },  // Check if length of address is greater than 50
                        { $lt: [{ $strLenCP: "$address" }, 53] }   // Check if length of address is less than 53
                      ]
                    },
                    { $substrCP: ["$address", 5, 55] },          // Extract substring starting from position 6 for 55 characters
                    {
                      $cond: [
                        { $lte: [{ $strLenCP: "$address" }, 50] }, // Check if length of address is less than or equal to 50
                        { $substrCP: ["$address", 5, 50] },         // Extract substring starting from position 6 for 50 characters
                        { $substrCP: ["$address", 50, 100] }        // Extract substring starting from position 51 for 100 characters
                      ]
                    }
                  ]
                },
                "data.shipDtls.loc": {
                  $cond: [
                    { $eq: ["$custGL.country.tblState.name", "Other Territory"] },  // Check if state_name is 'Other Territory'
                    "Other Country",                                       // Return 'Other Country' if true
                    "$custGL.country.tblState.name"                                 // Otherwise, return city_name
                  ]
                },
                "data.shipDtls.pin": {
                  $cond: [
                    { $eq: ["$custGL.country.tblState.name", "Other Territory"] },  // Check if state_name is 'Other Territory'
                    "999999",                                            // Return '999999' if true
                    "$custGL.tblGlGst.pincode"                                  // Otherwise, return pincode
                  ]
                },
                "data.shipDtls.stcd": {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$custGL.country.tblState.name", "Other Territory"] }, // Check if state_name is 'Other Territory'
                        {
                          $or: [
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, ""] }, // Check if gstin_no is null or empty
                            { $eq: [{ $ifNull: ["$custGL.tblGlGst.gstinNo", ""] }, "NA"] } // Check if gstin_no is 'NA'
                          ]
                        }
                      ]
                    },
                    96,                                                   // Return 96 if both conditions are true
                    { $substrCP: ["$custGL.country.tblState.code", 0, 2] } // Otherwise, return the first 2 characters of state_code_sb_file
                  ]
                },
                "data.itemList": {
                  $map: {
                    input: "$tblInvoiceCharge",
                    as: "ip",
                    in: {
                      slNo: {
                        $substr: [
                          { $toString: "$$ip.jobId" },
                          { $subtract: [{ $strLenCP: { $toString: "$$ip.jobId" } }, 3] }, 0
                        ]
                      },
                      prdDesc: "$$ip.description",
                      isServc: 'Y',
                      hsnCd: { $ifNull: ["$$ip.sacId", "$$ip.hsnId"] },
                      barcde: null,
                      qty: {
                        $toString: {
                          $round: [
                            { $convert: { input: "$$ip.qty", to: "decimal", onError: null, onNull: null } },
                            2
                          ]
                        }
                      },
                      freeQty: null,
                      unit: null,
                      unitPrice: {
                        $toString: {
                          $round: [
                            { $convert: { input: "$$ip.rate", to: "decimal", onError: null, onNull: null } },
                            2
                          ]
                        }
                      },
                      totAmt: {
                        $toString: {
                          $round: [
                            { $convert: { input: "$$ip.totalAmount", to: "decimal", onError: null, onNull: null } },
                            2
                          ]
                        }
                      },
                      discount: null,
                      preTaxVal: null,
                      assAmt: {
                        $toString: {
                          $round: [
                            {
                              $convert: {
                                input: { $ifNull: ["$$ip.totalAmountHc", 0] },
                                to: "decimal",
                                onError: 0,
                                onNull: 0
                              }
                            }
                          ]
                        }
                      },
                      gstRt: { $sum: "$$ip.tblInvoiceChargeTax.taxPercentage" },
                      discount: null,
                      preTaxVal: null,
                      cesRt: null,
                      cesAmt: null,
                      cesNonAdvlAmt: null,
                      stateCesRt: null,
                      stateCesAmt: null,
                      stateCesNonAdvlAmt: null,
                      othChrg: null,
                      totItemVal: { $sum: ["$$ip.totalAmountHc", { $sum: "$$ip.tblInvoiceChargeTax.taxAmountHc" }] },
                      taxArray: "$$ip.tblInvoiceChargeTax",
                      orgCntry: null,
                      prdSlNo: null

                    }
                  }
                },
                "data.valDtls.assVal": {
                  $toString: {
                    $round: [
                      {
                        $convert: {
                          input: { $ifNull: ["$invoiceAmount", 0] },
                          to: "decimal"
                        }
                      },
                      2
                    ]
                  }
                },
                "data.valDtls.cesVal": null,
                "data.valDtls.stCesVal": null,
                "data.valDtls.totInvVal": {
                  $toString: {
                    $round: [
                      {
                        $convert: {
                          input: { $ifNull: ["$totalInvoiceAmount", 0] },
                          to: "decimal"
                        }
                      },
                      2
                    ]
                  }
                },
                "data.valDtls.rndOffAmt": {
                  $toString: {
                    $round: [
                      {
                        $convert: {
                          input: { $ifNull: ["$roundOffAmount", 0] },
                          to: "decimal"
                        }
                      },
                      2
                    ]
                  }
                },
                "data.valDtls.totInvValFc": null

              }
            }
          ]
          )

          let taxArray = new Set()
          let hncIds = new Set()
          invoiceData[0].data.itemList?.map((item) => {
            hncIds.add(createObjectId(item.hsnCd))
            item.taxArray.map((tax) => {
              taxArray.add(createObjectId(tax.taxId))
            })

          })
          let findTaxData = await model.AggregateFetchData("tblTax", "tblTax", [{ $match: { _id: { $in: Array.from(taxArray) }, clientCode: req.clientCode } }], res)
          let findHncData = await model.AggregateFetchData("tblSacHsn", "tblSacHsn", [{ $match: { _id: { $in: Array.from(hncIds) }, clientCode: req.clientCode } }], res)
          invoiceData[0].data.valDtls.igstVal = 0
          invoiceData[0].data.valDtls.sgstVal = 0
          invoiceData[0].data.valDtls.cgstVal = 0
          invoiceData[0].data.itemList = invoiceData[0].data.itemList.map((item) => {
            item.hsnCd = findHncData.find((data) => data._id.toString() == item.hsnCd)?.code
            item.igstAmt = 0
            item.cgstAmt = 0
            item.sgstAmt = 0
            item.taxArray = item.taxArray.map((tax) => {
              let findData = findTaxData.find((data) => data._id.toString() == tax.taxId)

              if (findData?.code == "IGST") {
                item.igstAmt = item.igstAmt + tax.taxAmountHc
                invoiceData[0].data.valDtls.igstVal = invoiceData[0].data.valDtls.igstVal + tax.taxAmountHc
              } else if (findData?.code == "CGST") {
                item.cgstAmt = item.cgstAmt + tax.taxAmountHc
                invoiceData[0].data.valDtls.cgstVal = invoiceData[0].data.valDtls.cgstVal + tax.taxAmountHc
              }
              else if (findData?.code == "SGST") {
                item.sgstAmt = item.sgstAmt + tax.taxAmountHc
                invoiceData[0].data.valDtls.sgstVal = invoiceData[0].data.valDtls.sgstVal + tax.taxAmountHc
              }
              tax.taxCode = findData?.code
              return tax
            })
            delete item.taxArray

            return item
          })

          if (invoiceData.length == 0) return res.status(403).send({
            success: false,
            message: "invoice not found",
            data: []
          })
          res.send({
            success: true,
            message: "invoice fetched successfully",
            data: invoiceData[0]
          })
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "something went wrong",
            data: error.message
          })
        }

      }
    })
  }
} 