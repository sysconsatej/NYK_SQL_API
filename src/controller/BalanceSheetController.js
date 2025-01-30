const validate = require('../helper/validate')
const model = require("../models/module")
const functionForCommaSeperated = require('../helper/CommaSeperatedValue')
const mongoose = require('mongoose')
const moment = require('moment')
const { errorLogger } = require('../helper/loggerService')
const { log } = require('winston')
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
function Isnull(value, defaultValue) {
    return value === null || value === undefined || value === '' ? defaultValue : value;
}

module.exports = {
    BlanceSheetSp: async (req, res) => {
        try {
            const { fromDate, toDate, branchId } = req.body
            let query = [
                {
                    $match: {
                        oldName: "tbl_balance_sheet_group_mst",
                        clientCode: req.clientCode
                    }
                },
                {
                    $lookup: {
                        from: "tblMasterData",
                        let: { id: { $toString: "$_id" } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$tblMasterListId",
                                                    "$$id"
                                                ]
                                            }
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
                        includeArrayIndex: "string",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $lookup: {
                        from: "tblTbGroup",
                        let: {
                            id: { $toString: "$masterData._id" }
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$clientCode", req.clientCode] },
                                            {
                                                $eq: [
                                                    "$balanceSheetGroupId",
                                                    "$$id"
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "tb1"
                    }
                },
                {
                    $unwind: {
                        path: "$tb1",
                        includeArrayIndex: "string",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "tblTbGroup",
                        let: {
                            id: { $toString: "$tb1._id" }
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$clientCode", req.clientCode] },
                                            {
                                                $eq: ["$parentGroupId", "$$id"]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "tb2"
                    }
                },
                {
                    $unwind: {
                        path: "$tb2",
                        includeArrayIndex: "string",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "tblTbGroup",
                        let: {
                            id: { $toString: "$tb2._id" }
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$clientCode", req.clientCode] },
                                            {
                                                $eq: ["$parentGroupId", "$$id"]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "tb3"
                    }
                },
                {
                    $unwind: {
                        path: "$tb3",
                        includeArrayIndex: "string",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "tblTbGroup",
                        let: {
                            id: { $toString: "$tb3._id" }
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$clientCode", req.clientCode] },
                                            {
                                                $eq: ["$parentGroupId", "$$id"]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "tb4"
                    }
                },
                {
                    $unwind: {
                        path: "$tb4",
                        includeArrayIndex: "string",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        "tbId1": "$tb1._id",
                        "tbId2": "$tb1._id",
                        "tbId3": "$tb1._id",
                        "tbId4": "$tb1._id",
                        BalanceSheetName: {
                            $replaceAll: {
                                input: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: {
                                                            $ifNull: ["$masterData.name", ""]
                                                        },
                                                        find: ":",
                                                        replacement: ""
                                                    }
                                                },
                                                find: "\r",
                                                replacement: ""
                                            }
                                        },
                                        find: "&",
                                        replacement: ""
                                    }
                                },
                                find: "\uFEFF",  // 0xEFBBBF represents the Byte Order Mark (BOM) in UTF-8
                                replacement: ""
                            }
                        },
                        tb1GroupName: {
                            $replaceAll: {
                                input: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: {
                                                            $ifNull: ["$tb1.tbGroupName", ""]
                                                        },
                                                        find: ":",
                                                        replacement: ""
                                                    }
                                                },
                                                find: "\r",
                                                replacement: ""
                                            }
                                        },
                                        find: "&",
                                        replacement: ""
                                    }
                                },
                                find: "\uFEFF",  // 0xEFBBBF (Byte Order Mark - BOM) in UTF-8
                                replacement: ""
                            }
                        },
                        tb2GroupName: {
                            $replaceAll: {
                                input: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: {
                                                            $ifNull: ["$tb2.tbGroupName", ""]
                                                        },
                                                        find: ":",
                                                        replacement: ""
                                                    }
                                                },
                                                find: "\r",
                                                replacement: ""
                                            }
                                        },
                                        find: "&",
                                        replacement: ""
                                    }
                                },
                                find: "\uFEFF",  // 0xEFBBBF (Byte Order Mark - BOM) in UTF-8
                                replacement: ""
                            }
                        },
                        tb3GroupName: {
                            $replaceAll: {
                                input: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: {
                                                            $ifNull: ["$tb3.tbGroupName", ""]
                                                        },
                                                        find: ":",
                                                        replacement: ""
                                                    }
                                                },
                                                find: "\r",
                                                replacement: ""
                                            }
                                        },
                                        find: "&",
                                        replacement: ""
                                    }
                                },
                                find: "\uFEFF",  // 0xEFBBBF (Byte Order Mark - BOM) in UTF-8
                                replacement: ""
                            }
                        },
                        tb4GroupName: {
                            $replaceAll: {
                                input: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: {
                                                            $ifNull: ["$tb4.tbGroupName", ""]
                                                        },
                                                        find: ":",
                                                        replacement: ""
                                                    }
                                                },
                                                find: "\r",
                                                replacement: ""
                                            }
                                        },
                                        find: "&",
                                        replacement: ""
                                    }
                                },
                                find: "\uFEFF",  // 0xEFBBBF (Byte Order Mark - BOM) in UTF-8
                                replacement: ""
                            }
                        }
                    }
                },
            ]
            let Data = await model.AggregateFetchData("tblMasterList", "tblMasterList", query, res)
            let tb1 = [];
            let tb2 = [];
            let tb3 = [];
            let tb4 = [];
            let tbArray = new Set();
            Data.map((item) => {
                // tb1.push(item.tb1.toString())
                // tb2.push(item.tb2.toString())
                // tb3.push(item.tb3.toString())
                // tb4.push(item.tb4.toString())
                tbArray.add(item.tbId1.toString())
                tbArray.add(item.tbId2.toString())
                tbArray.add(item.tbId3.toString())
                tbArray.add(item.tbId4.toString())
            })
            console.log(tb1.length, tb2.length, tb3.length, tb4.length);

            tb1 = [...tb1, ...tb2, ...tb3, ...tb4]
            console.log(tb1.length);

            if (Data.length == 0) return res.send({ success: false, message: "No data found", data: [] })
            let queryforGl = [
                {
                    $match: {
                        $expr: {
                            $in: [
                                "$tbGroupId",
                                Array.from(tbArray)
                            ]
                        }
                    }
                },
                {
                    $lookup: {
                        from: "tblVoucher",
                        let: { id: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            // { $eq: ["$clientCode", req.clientCode] },
                                            { $eq: ["$accountEffect", "y"] },
                                            { $gte: ["$voucherDate", { $toDate: fromDate }] },
                                            { $lte: ["$voucherDate", { $toDate: toDate }] },
                                        ]
                                    }
                                }
                            },
                            {
                                $unwind: {
                                    path: "$tblVoucherLedger",
                                    preserveNullAndEmptyArrays: false
                                }
                            },
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$tblVoucherLedger.glId", { $toString: "$$id" }] },
                                            // { $eq: ["$tblVoucherLedger.glId",{$toString:"$$id"}] }
                                        ]
                                    }
                                }
                            },
                            {
                                $addFields: {
                                    totalAmount: {
                                        $sum: {
                                            $subtract: [
                                                { $ifNull: ["$tblVoucherLedger.debitAmount", 0] }, // Replaces null debit with 0
                                                { $ifNull: ["$tblVoucherLedger.creditAmount", 0] } // Replaces null credit with 0
                                            ]
                                        }
                                    }
                                }
                            }

                        ],
                        as: "tblVoucher"
                    }
                },
                {
                    $addFields: {
                        glName: {
                            $replaceAll: {
                                input: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: {
                                                            $ifNull: ["$name", ""]
                                                        },
                                                        find: ":",
                                                        replacement: ""
                                                    }
                                                },
                                                find: "\r",
                                                replacement: ""
                                            }
                                        },
                                        find: "&",
                                        replacement: ""
                                    }
                                },
                                find: "\uFEFF",  // 0xEFBBBF (Byte Order Mark - BOM) in UTF-8
                                replacement: ""
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        balance: {
                            $sum: "$tblVoucher.totalAmount"
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        glName: 1,
                        totalAmount: 1,
                        tbGroupId: 1,
                        balance: 1

                    }
                }

            ]

            let glData = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", queryforGl, res)
            glData = glData.map((item) => {
                return {

                    ...Data.find((data) => (data.tbId1.toString() == item.tbGroupId.toString() || data.tbId2.toString() == item.tbGroupId.toString() || data.tbId3.toString() == item.tbGroupId.toString() || data.tbId4.toString() == item.tbGroupId.toString())),
                    ...item
                }
            })
            res.send({ success: true, message: "Data fetched successfully....!", glData: glData })

        } catch (error) {
            res.status(500).send({ success: false, message: error.message, data: [] })
        }
    }

}