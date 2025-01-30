const validate = require('../helper/validate')
const model = require("../models/module")
const functionForCommaSeperated = require('../helper/CommaSeperatedValue')
const mongoose = require('mongoose')
const moment = require('moment')
const { errorLogger } = require('../helper/loggerService')
function isNegative(num) {
    return num < 0;
}

module.exports = {
    secondTry: async (req, res) => {
        const validationRule = {
            companyId: "required",
            companyBranchId: "required",
            finYearId: "required"
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
                    const { companyId, companyBranchId, finYearId } = req.body
                    var next_fin_year_id



                    var end_date = await model.AggregateFetchData("tblFinancialYear", "tblFinancialYear", [{ $match: { id: Number(finYearId) } }])
                    end_date = new Date(`${moment(end_date[0]?.end_date).format("YYYY-MM-DD")} 23:59:59`)
                    var pl_gl_id = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [{ $match: { status: 1, companyId: companyId, companyBranchId: companyBranchId } }])

                    let masterData1 = await model.AggregateFetchData("tblMasterList", "tblMasterList",
                        [
                            {
                                $match: {
                                    oldName: "tbl_gl_definition_mst",
                                },
                            },
                            {
                                $lookup: {
                                    from: "tblMasterData",
                                    let: {
                                        tblMasterListId: { $toString: "$_id" },
                                    },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        {
                                                            $eq: [
                                                                "$tblMasterListId",
                                                                "$$tblMasterListId",
                                                            ],
                                                        },
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
                            }, {
                                $match: {
                                    "masterData.name": {
                                        $regex: "Profit And Loss",
                                        $options: "i"
                                    }
                                }
                            },
                            {
                                $project: {
                                    masterData: 1,
                                    code: "$masterData.code",
                                    name: "$masterData.name",
                                    oldId: "$masterData.oldId",
                                },
                            },
                        ])
//                    // return console.log(masterData1);
                    pl_gl_id = pl_gl_id.filter((e) => e.glDefinitionId == masterData1[0].oldId)

                    if (!pl_gl_id.length > 0) {
                        throw new Error("NO PROFIT AND LOSS ACCOUNT FOUND")
                    }


                    next_fin_year_id = await model.AggregateFetchData("tblFinancialYear", "tblFinancialYear", [{ $match: { end_date: { $gt: end_date } } }, { $sort: { end_date: 1 } }, { $limit: 1 }])

                    let data = await model.AggregateFetchData("tblVoucher", "tblVoucher", [{
                        $match: {
                            accountEffect: "y",
                            companyId: companyId,
                            companyBranchId: companyBranchId,
                            finYearId: finYearId,
                            status: 1
                        }
                    },
                    {
                        $unwind: {
                            path: "$tblVoucherLedger",
                            includeArrayIndex: "string",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            tblVoucherLedger: 1
                        }
                    }

                    ])
                    let fl = new Set()
                    data.forEach(element => {
                        fl.add(element.tblVoucherLedger.glId)
                    });

                    let gldata = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [{ $match: { oldId: { $in: Array.from(fl) } } }])
                    let tbGroup = new Set()
                    gldata.forEach(element => {
                        tbGroup.add(element.tbGroupId)
                    });
                    let tblGroupData = await model.AggregateFetchData("tblTbGroup", "tblTbGroup", [{ $match: { oldId: { $in: Array.from(tbGroup) } } }])
                    let masterData = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                        {
                            $match: {
                                oldName: "tbl_balance_sheet_group_mst",
                            },
                        },
                        {
                            $lookup: {
                                from: "tblMasterData",
                                let: {
                                    tblMasterListId: { $toString: "$_id" },
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $eq: [
                                                            "$tblMasterListId",
                                                            "$$tblMasterListId",
                                                        ],
                                                    },
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
                        }, {
                            $match: {
                                "masterData.name": {
                                    $in: ["Income", "Expense"],
                                }
                            }
                        },
                        {
                            $project: {
                                masterData: 1,
                                code: "$masterData.code",
                                name: "$masterData.name",
                                oldId: "$masterData.oldId",
                            },
                        },
                    ])
                    var condition1 = masterData[0].oldId
                    var condition2 = masterData[1].oldId
//                    console.log(masterData[0].oldId);
//                    console.log(masterData[1].oldId);
                    data.forEach(element => {
                        element["gldata"] = gldata.find((e) => e.oldId == element?.tblVoucherLedger?.glId)
                        element["tbGroupData"] = tblGroupData.find((e) => e.oldId == element?.gldata.tbGroupId)
                    });
                    data = data.filter((e) =>
                        e.tbGroupData.balanceSheetGroupId === condition1 ||
                        e.tbGroupData.balanceSheetGroupId === condition2
                    )
                    let Ledger_balance = data.reduce((accumulator, currentTransaction) => {
                        const debit = currentTransaction?.tblVoucherLedger?.debitAmount || 0; // Treat null as 0
                        const credit = currentTransaction?.tblVoucherLedger?.creditAmount || 0; // Treat null as 0
                        return accumulator + (debit - credit); // Accumulate the differences
                    }, 0);
                    let Ledger_balance_fcs = data.reduce((accumulator, currentTransaction) => {
                        const debit = currentTransaction?.tblVoucherLedger?.debitAmountFc || 0; // Treat null as 0
                        const credit = currentTransaction?.tblVoucherLedger?.creditAmountFc || 0; // Treat null as 0
                        return accumulator + (debit - credit); // Accumulate the differences
                    }, 0);
                    if (Array.isArray(pl_gl_id[0]["tblGlBalance"]) && pl_gl_id[0]["tblGlBalance"].length > 0) {
                        if (pl_gl_id[0]["tblGlBalance"].filter((e) => e.finYearId == finYearId).length > 0) {
                            pl_gl_id[0]["tblGlBalance"].forEach(element => {
                                if (element.finYearId == finYearId) {
                                    element.opBalDr = isNegative(Ledger_balance) ? 0 : Ledger_balance
                                    element.opBalCr = isNegative(Ledger_balance) ? Math.abs(Ledger_balance) : 0
                                    element.partyOpBalDrFc = isNegative(Ledger_balance_fcs) ? 0 : Ledger_balance_fcs
                                    element.partyOpBalCrFc = isNegative(Ledger_balance_fcs) ? Math.abs(Ledger_balance_fcs) : 0
                                }
//                                console.log(element);
                            });
                        }
                        else {
                            pl_gl_id[0]["tblGlBalance"].push({ opBalDr: isNegative(Ledger_balance) ? 0 : Ledger_balance, opBalCr: isNegative(Ledger_balance) ? Math.abs(Ledger_balance) : 0, partyOpBalDrFc: isNegative(Ledger_balance_fcs) ? 0 : Ledger_balance_fcs, partyOpBalCrFc: isNegative(Ledger_balance_fcs) ? Math.abs(Ledger_balance_fcs) : 0, finYearId, companyId, companyBranchId: companyBranchId })
                        }

                    }
                    else {

                        pl_gl_id[0]["tblGlBalance"] = [{ opBalDr: isNegative(Ledger_balance) ? 0 : Ledger_balance, opBalCr: isNegative(Ledger_balance) ? Math.abs(Ledger_balance) : 0, partyOpBalDrFc: isNegative(Ledger_balance_fcs) ? 0 : Ledger_balance_fcs, partyOpBalCrFc: isNegative(Ledger_balance_fcs) ? Math.abs(Ledger_balance_fcs) : 0, finYearId, companyId, companyBranchId: companyBranchId }]
                    }

                    await model.updateIfAvailableElseInsertMasterSP("tblGeneralLedger", "tblGeneralLedger", pl_gl_id[0])
                    res.status(200).send({
                        Ledger_balance,
                        Ledger_balance_fcs,
                        pl_gl_id
                    })

                } catch (error) {
                    errorLogger(error, req)
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