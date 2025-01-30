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
function isDateBetweenGivenDates(givenDate, json) {
    const date = new Date(givenDate);

    // Iterate through tblTaxDetails array to find the effective and validity dates
    for (const taxDetail of json.taxData.tblTaxDetails) {
        const startDate = new Date(taxDetail.effectiveDate);
        const endDate = new Date(taxDetail.validityDate);

        // Check if the given date is between the start and end dates
        if (date >= startDate && date <= endDate) {
            return json;
        }
    }

    return false;
}




module.exports = {
    invoicePosting: async (req, res) => {
        const validationRule = {
            InvoiceId: "required",//req.body.InvoiceId
            // recordStatus: "required",//req.body.recordStatus
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error....!",
                    data: err
                })
            } else {
                const { InvoiceId, recordStatus } = req.body
                try {
                    // Varaibles Declaration
                    let moduleTemplateId
                    let invoiceDate
                    let voucherCode
                    let voucherTypeId
                    let accountEffect

                    // Fetching Data form Invoice
                    let InvoiceData = await model.AggregateFetchData("tblInvoice", "tblInvoice", [{ $match: { _id: createObjectId(InvoiceId), status: Number(process.env.ACTIVE_STATUS) } }, {
                        $lookup: {
                            from: "tblMasterList",
                            let: { oldname: "tbl_currency_mst" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: ["$oldName", "$$oldname"],
                                                },
                                                {
                                                    $eq: ["$clientCode", req.clientCode],
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: "MasterList",
                        },
                    },
                    {
                        $unwind: {
                            path: "$MasterList",
                            includeArrayIndex: "string",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: "tblMasterData",
                            let: { tblId: { $toString: "$MasterList._id" }, currencyId: "$currencyId" },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$clientCode", req.clientCode] },
                                            { $eq: ["$tblMasterListId", "$$tblId"] },
                                            { $eq: ["$_id", { $toObjectId: "$$currencyId" }] }
                                        ]
                                    }
                                }
                            }],
                            as: "masterData"
                        }
                    }], res)
                    if (InvoiceData.length == 0) throw new Error("Invoice Not Found")
                    moduleTemplateId = InvoiceData[0].moduleTemplateId || 0,
                        invoiceDate = InvoiceData[0].invoiceDate
                    voucherTypeId = InvoiceData[0].voucherTypeId

                    // Fetching Data form VoucherType
                    let VoucherTypeData = await model.AggregateFetchData("tblVoucherType", "tblVoucherType", [{ $match: { _id: createObjectId(voucherTypeId), status: Number(process.env.ACTIVE_STATUS) } }], res)
                    if (VoucherTypeData.length == 0) throw new Error("Voucher Type Not Found")
                    voucherCode = VoucherTypeData[0].code
                    accountEffect = VoucherTypeData[0].accountEffect
                    let voucherID; let voucherLeadgerId
                    voucherID = await model.AggregateFetchData("tblVoucher", "tblVoucher", [{ $match: { invoiceIds: InvoiceId, status: Number(process.env.ACTIVE_STATUS) } }], res)
                    voucherID = voucherID.length > 0 ? voucherID[0]._id : 0
                    // Condition Of account Effect
                    if (Isnull(accountEffect, "") == "y") {

                        // condition of recordStatus
                        if (Isnull(recordStatus, "") == "c") {
                            // Field transactionStatus in not in tblVoucher
                            await model.updateIfAvailableElseInsertMasterSP("tblVoucher", "tblVoucher", { id: voucherID, status: Number(process.env.INACTIVE_STATUS) })

                        }
                        else {

                            // Variables Declaration if Invoice in not Cancelled
                            let parentInvoiceOutstandingId = null;
                            let parentInvoiceId = null;
                            let billing_code_id;
                            let total_invoice_amount;
                            let total_invoice_amount_fc;
                            let companyid;
                            let branchid;
                            let finyear;
                            let userid;
                            let invoicecurr;
                            let vouchercurr;
                            let exchangerate;
                            let round_off_amt;
                            let memo_id;
                            let narration;
                            let voucherNarration;
                            let voucherType;
                            let voucherPrefix;
                            let voucherNo;
                            let voucherSuffix;
                            let generatedVoucherNo;
                            let voucherDate;
                            let month;
                            let year;
                            let vouchergroup;
                            let costcentreID;
                            let voucherExists;
                            let taxAmount;
                            let taxSales;
                            let taxSalesType;
                            let voucherLedgerID;
                            let billingCodeGlType;
                            let salesTaxAmt;
                            let mbl_id;
                            let jobnos_blnos = "";
                            let narration_qry;
                            let discount_amt;
                            // let accountEffect;
                            let taxRoundOff;
                            let chargeVoucherGroup;
                            let glDesc
                            let salesVoucherExist

                            // Setting taxRoundOff

                            taxRoundOff = Isnull(VoucherTypeData[0].tblRoundOffSetting.find(x => x.companyId?.toString() == InvoiceData[0].companyId?.toString())?.invoiceRoundOff, "n")
                            parentInvoiceId = InvoiceData[0]?.parentInvoiceId
                            parentInvoiceOutstandingId = InvoiceData[0]?.parentInvoiceOutstandingId
                            total_invoice_amount = InvoiceData[0]?.totalInvoiceAmount
                            total_invoice_amount_fc = InvoiceData[0]?.totalInvoiceAmountFc
                            invoicecurr = InvoiceData[0]?.masterData[0]?.code
                            exchangerate = InvoiceData[0]?.exchangeRate
                            round_off_amt = InvoiceData[0]?.roundOffAmount
                            // Fetching Data form tblVoucherGroup
                            let tblVoucherGroupData = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                                {
                                    $match: {
                                        oldName: "tbl_voucher_group_mst",
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "tblMasterData",
                                        let: { tblList: { $toString: "$_id" } },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            {
                                                                $eq: [
                                                                    "$tblMasterListId",
                                                                    "$$tblList",
                                                                ],
                                                            },
                                                            {
                                                                $eq: ["$oldId", Isnull(VoucherTypeData[0].tblVoucherGroupId, "2")
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
                                },
                                {
                                    $project: {
                                        oldId: "$masterData.oldId",
                                        code: "$masterData.code",
                                        name: "$masterData.name",
                                    },
                                },
                            ], res)
                            vouchergroup = tblVoucherGroupData[0]?.name
                            if (recordStatus == "REV" || parentInvoiceId !== null) {
                                let arraOfJobId = InvoiceData[0].jobId?.split(",")
                                let arraOfBl = InvoiceData[0].blId?.split(",")
                                arraOfJobId = arraOfJobId?.map(x => createObjectId(x))
                                arraOfBl = arraOfBl?.map(x => createObjectId(x))
                                console.log("arraOfJobId", arraOfJobId);
                                let JobData = await model.AggregateFetchData("tblJob", "tblJob", [{ $match: { _id: { $in: arraOfJobId || [] }, status: Number(process.env.ACTIVE_STATUS) } }], res)
                                let blData = await model.AggregateFetchData("tblBl", "tblBl", [{ $match: { _id: { $in: arraOfBl || [] }, status: Number(process.env.ACTIVE_STATUS) } }], res)
                                jobnos_blnos += "Job No:"
                                JobData.map((x) => {
                                    jobnos_blnos += x.jobNo + ","
                                })
                                jobnos_blnos += " BL No:"
                                blData.map((x) => {
                                    jobnos_blnos += Isnull(x.hblNo, x.mblNo) + ","
                                })
                                jobnos_blnos += Isnull(InvoiceData[0].vendorInvoiceNo, "")
                                jobnos_blnos += Isnull(InvoiceData[0].vendorInvoiceDate, "")
                                voucherDate = InvoiceData[0].invoiceDate
                                narration = Isnull(jobnos_blnos, "") + Isnull(InvoiceData[0].remarks, "")
                                voucherNarration = Isnull(jobnos_blnos, "") + Isnull(InvoiceData[0].remarks, "")
                                generatedVoucherNo = InvoiceData[0].invoiceNo
                                console.log("InvoiceId");
                                // mbl_id = Isnull(arraOfBl[0].toString(), "")
                                mbl_id = Array.isArray(arraOfBl) ? arraOfBl[0].toString() : ""
                                billing_code_id = createObjectId(InvoiceData[0].billingPartyId)
                                let DataFromGL = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                                    {
                                        $match: {
                                            _id: billing_code_id,
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMasterList",
                                            let: { oldName: "tbl_gl_type_mst" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                {
                                                                    $eq: ["$oldName", "$$oldName"],
                                                                },
                                                            ],
                                                        },
                                                    },
                                                },
                                            ],
                                            as: "masterListData",
                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: "$masterListData",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: true,
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMasterData",
                                            let: {
                                                tblId: {
                                                    $toString: "$masterListData._id",
                                                },
                                                glTypeId: "$glTypeId",
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                {
                                                                    $eq: [
                                                                        "$tblMasterListId",
                                                                        "$$tblId",
                                                                    ],
                                                                },
                                                                { $eq: ["$oldId", "$$glTypeId"] },
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
                                            includeArrayIndex: 'string',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    }
                                ], res)
                                glDesc = DataFromGL[0].name
                                billingCodeGlType = DataFromGL[0]?.masterData?._id
                                let existVoucherData = await model.AggregateFetchData("tblVoucher", "tblVoucher", [{ $match: { voucherNo: generatedVoucherNo, accountEffect: accountEffect, companyId: InvoiceData[0].companyId, companyBranchId: InvoiceData[0].companyBranchId, status: Number(process.env.ACTIVE_STATUS) } }], res)
                                salesVoucherExist = Isnull(existVoucherData[0]?._id, null)
                                if (existVoucherData.length > 0) {
                                    existVoucherData[0].tblVoucherLedger = []
                                    existVoucherData[0].tblVoucherOutstanding = []
                                    existVoucherData[0].voucherDate = voucherDate
                                    existVoucherData[0].narration = narration
                                    existVoucherData[0].paidByParty = billing_code_id
                                    await model.updateIfAvailableElseInsertMasterSP("tblVoucher", "tblVoucher", existVoucherData[0], res)

                                }
                                let DataOfCostcenter = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                                    {
                                        $match: {
                                            oldName: "tbl_cost_centre_mst",
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
                                                            $and: [
                                                                {
                                                                    $eq: [
                                                                        "$tblMasterListId",
                                                                        "$$tblId",
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
                                    },
                                    {
                                        $project: {
                                            _id: "$masterData._id",
                                            code: "$masterData.code",
                                            name: "$masterData.name",
                                            oldId: "$masterData.oldId"
                                        },
                                    },
                                ], res)
                                let voucherLedgerDataArray = []
                                // let voucherCostProfitDataArray = []
                                // Party Posting------------------------------------------------------
                                let invoiceamt_dr = 0
                                let invoiceamt_cr = 0
                                let invoiceamt_cr_fc = 0
                                let invoiceamt_dr_fc = 0
                                total_invoice_amount > 0 ? (invoiceamt_dr = Math.abs(total_invoice_amount), invoiceamt_cr = 0) : (invoiceamt_cr = Math.abs(total_invoice_amount), invoiceamt_dr = 0)
                                invoicecurr.toLowerCase() !== "inr" && (total_invoice_amount > 0 ? (invoiceamt_dr_fc = Math.abs(total_invoice_amount), invoiceamt_cr_fc = 0) : (invoiceamt_cr_fc = Math.abs(total_invoice_amount), invoiceamt_dr_fc = 0))
                                let LedgerDataofparty = { glId: billing_code_id, debitAmount: vouchergroup.toLowerCase() == "sales" ? InvoiceData[0].totalInvoiceAmount : 0, creditAmount: vouchergroup.toLowerCase() == "purchase" ? InvoiceData[0].totalInvoiceAmount : 0, glType: billingCodeGlType, debitAmountFc: invoiceamt_dr_fc, creditAmountFc: invoiceamt_cr_fc, narration, currencyId: InvoiceData[0].currencyId, exchangeRate: exchangerate, adjustDebitAmount: 0, adjustCreditAmount: 0, tblVoucherLedgerDetails: [] }
                                // Posting of Ledger of party
                                voucherLedgerDataArray.push(LedgerDataofparty)
                                // Posting of Cost profit

                                //----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                                //posting of Round Of Amount

                                let arraofGlIdforDiffrentPosting = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                                    {
                                        $match: {
                                            oldName: "tbl_gl_definition_mst",
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
                                                            $and: [
                                                                {
                                                                    $eq: [
                                                                        "$tblMasterListId",
                                                                        "$$tblId",
                                                                    ],
                                                                },
                                                                // {
                                                                //     $in: [
                                                                //         "$name",
                                                                //         ["Round Off", "Discount", "Charge"],
                                                                //     ],
                                                                // },
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
                                            preserveNullAndEmptyArrays: false,
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: "tblGeneralLedger",
                                            let: { glId: { $toString: "$masterData._id" } },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                {
                                                                    $eq: [
                                                                        "$glDefinitionId",
                                                                        "$$glId",
                                                                    ],

                                                                }
                                                            ],
                                                        },
                                                    },
                                                },
                                            ],

                                            as: "glData",
                                        },
                                    },
                                ], res)
                                // let arraofGlIdforDiffrentPosting= await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                                //     {
                                //         $match: {
                                //             $expr: {
                                //                 $and: [
                                //                     {
                                //                         $eq: [
                                //                             "$_id",
                                //                             DataFromGL[0]._id,
                                //                         ],
                                //                     },
                                //                 ],
                                //             },
                                //         },
                                //     },
                                //     {$lookup: {
                                //         from: "tblMasterData",
                                //         let: { glId: "$glDefinitionId" },
                                //         pipeline: [
                                //             {
                                //                 $match: {
                                //                     $expr: {
                                //                         $and: [
                                //                             {
                                //                                 $eq: [
                                //                                     "$oldId",
                                //                                     "$$glId",
                                //                                 ],
                                //                             },
                                //                         ],
                                //                     },
                                //                 },
                                //             },
                                //         ],
                                //         as: "masterData",
                                //     }},
                                //     // }}
                                // ], res)
                                let roundOfAmountcr = 0
                                let roundOfAmountdr = 0
                                let roundOfAmountcr_fc = 0
                                let roundOfAmountdr_fc = 0
                                round_off_amt > 0 ? (roundOfAmountdr = Math.abs(round_off_amt), roundOfAmountcr = 0) : (roundOfAmountcr = Math.abs(round_off_amt), roundOfAmountdr = 0)
                                invoicecurr.toLowerCase() !== "inr" && (round_off_amt > 0 ? (roundOfAmountdr_fc = Math.abs(round_off_amt), roundOfAmountcr_fc = 0) : (roundOfAmountcr_fc = Math.abs(round_off_amt), roundOfAmountdr_fc = 0))

                                // Inserting of Posting into tblVoucher

                                let VoucherInsertionData = {
                                    // id:"",s
                                    voucherDate: InvoiceData[0].vendorInvoiceDate !== null || "" ? InvoiceData[0].vendorInvoiceDate : invoiceDate,
                                    narration: narration,
                                    chargeId: InvoiceData[0].chargeId,
                                    // invoiceIds:InvoiceId,
                                    voucherNo: InvoiceData[0].vendorInvoiceNo !== null || "" ? InvoiceData[0].vendorInvoiceNo : generatedVoucherNo,
                                    accountEffect: "y",
                                    voucherTypeId: voucherTypeId,
                                    exchangeRate: 1,
                                    companyId: InvoiceData[0].companyId,
                                    companyBranchId: InvoiceData[0].companyBranchId,
                                    finYearId: InvoiceData[0].finYearId,
                                    tblVoucherLedger: voucherLedgerDataArray,
                                }
                                // let finalVoucherInsertionData= {
                                //     "id": 1001,
                                //     "status": 1,
                                //     "createdDate": "2024-06-28T05:46:07.433Z",
                                //     "createdBy": null,
                                //     "updatedDate": "2024-06-28T05:46:07.433Z",
                                //     "updatedBy": null,
                                //     "companyId": "65e1d2b23d6a65b7b7dda6e5",
                                //     "brachId": null,
                                //     "defaultFinYearId": null,
                                //     "voucherTypeId": "65d3112d0cba1122785576ba",
                                //     "srNo": null,
                                //     "voucherDate": "2024-06-24T00:00:00.000Z",
                                //     "narration": "Job No:QUA00000313WATAN, BL No:",
                                //     "chequeNo": null,
                                //     "chequeDate": null,
                                //     "chequeType": null,
                                //     "chequeBank": null,
                                //     "chequeBankBranch": null,
                                //     "companyBranchId": null,
                                //     "finYearId": "65c5db5b80d60ac576ac59ed",
                                //     "invoiceIds": null,
                                //     "voucherNo": null,
                                //     "paidByParty": null,
                                //     "reconciledVal": null,
                                //     "reconciledDate": null,
                                //     "currencyId": null,
                                //     "exchangeRate": 1,
                                //     "accountEffect": "y",
                                //     "remarks": null,
                                //     "createdByCompanyId": null,
                                //     "createdByCompanyBranchId": null,
                                //     "oldId": null,
                                //     "tblVoucherLedger": [
                                //       {
                                //         "glId": "65d08d88fe12b796aa4b81f0",
                                //         "debitAmount": 0,
                                //         "creditAmount": 9999999,
                                //         "narration": "Job No:QUA00000313WATAN, BL No:",
                                //         "adjustDebitAmount": 0,
                                //         "adjustCreditAmount": 0,
                                //         "glTypeId": null,
                                //         "currencyId": "65c5ff932d23ea709e432af2",
                                //         "debitAmountFc": 0,
                                //         "creditAmountFc": 0,
                                //         "exchangeRate": 4000,
                                //         "oldId": null,
                                //         "tblVoucherLedgerDetails": [],
                                //         "_id": "667e4e1f04b893b3febf2c59"
                                //       }
                                //     ],
                                //     "_id": "667e4e1f04b893b3febf2c58",
                                //     "tblVoucherOutstanding": [],
                                //     "__v": 0
                                //   }

                                let finalVoucherInsertionData = await model.updateIfAvailableElseInsertMasterSP("tblVoucher", "tblVoucher", VoucherInsertionData, req)

                                // Round off Posting  
                                let regex = new RegExp("^Round Off", "i")
                                let glOfRoundOff = arraofGlIdforDiffrentPosting.filter((item) => regex.test(item.masterData.code))
                                finalVoucherInsertionData.tblVoucherLedger.push({ glId: glOfRoundOff[0].glData[0]._id, debitAmount: vouchergroup.toLowerCase() == "sale" ? InvoiceData[0].roundOffAmount : 0, creditAmount: vouchergroup.toLowerCase() == "purchase" ? InvoiceData[0].roundOffAmount : 0, narration, currencyId: InvoiceData[0].currencyId, exchangeRate: exchangerate, adjustDebitAmount: 0, adjustCreditAmount: 0, tblVoucherLedgerDetails: [] })
                                // TDS Posting 
                                let regexTds = new RegExp("^TDS Receivable", "i")
                                let glOfTds = arraofGlIdforDiffrentPosting.filter((item) => regexTds.test(item.masterData.code))
                                finalVoucherInsertionData.tblVoucherLedger.push({ glId: glOfTds[0].glData[0]._id, debitAmount: vouchergroup.toLowerCase() == "purchase" ? InvoiceData[0].tdsAmount : 0, creditAmount: vouchergroup.toLowerCase() == "sale" ? InvoiceData[0].tdsAmount : 0, narration, currencyId: InvoiceData[0].currencyId, exchangeRate: exchangerate, adjustDebitAmount: 0, adjustCreditAmount: 0, tblVoucherLedgerDetails: [] })
                                // Discount Posting
                                let regexDiscount = new RegExp("^Discount", "i")
                                let glOfDiscount = arraofGlIdforDiffrentPosting.filter((item) => regexDiscount.test(item.masterData.code))
                                finalVoucherInsertionData.tblVoucherLedger.push({ glId: glOfDiscount[0].glData[0]._id, debitAmount: vouchergroup.toLowerCase() == "purchase" ? InvoiceData[0].tdsAmount : 0, creditAmount: vouchergroup.toLowerCase() == "sale" ? InvoiceData[0].tdsAmount : 0, narration, currencyId: InvoiceData[0].currencyId, exchangeRate: exchangerate, adjustDebitAmount: 0, adjustCreditAmount: 0, tblVoucherLedgerDetails: [] })
                                // Charge Posting
                                let TempInvoiceData = { ...InvoiceData[0] }
                                let GSTsGlId = {}
                                for (const iterator of TempInvoiceData.tblInvoiceCharge) {
                                    console.log("iterator", iterator);
                                    finalVoucherInsertionData.tblVoucherLedger.push({ glId: iterator.chargeGlId, debitAmount: vouchergroup.toLowerCase() == "purchase" ? iterator.totalAmount : 0, creditAmount: vouchergroup.toLowerCase() == "sale" ? iterator.totalAmount : 0, narration, currencyId: iterator.currencyId, exchangeRate: iterator.exchangeRate, adjustDebitAmount: 0, adjustCreditAmount: 0, tblVoucherLedgerDetails: [] })
                                    let taxDetailsId = new Set(iterator.tblInvoiceChargeTax.map(x => createObjectId(x.taxDetailId)))
                                    let findingGlData = await model.AggregateFetchData("tblTax", "tblTax", [
                                        {
                                            $unwind: {
                                                path: "$tblTaxDetails",
                                                includeArrayIndex: "string",
                                                preserveNullAndEmptyArrays: false
                                            }
                                        },
                                        {
                                            $match: {
                                                "tblTaxDetails._id": { $in: Array.from(taxDetailsId) }
                                            }
                                        }
                                    ], res)

                                    for (const items of iterator.tblInvoiceChargeTax) {
                                        let temData = findingGlData.find((item) => item.tblTaxDetails?._id.toString() == items.taxDetailId?.toString());
                                        console.log(temData.tblTaxDetails?.glId)
                                        if (typeof temData !== "undefined" && Object.keys(GSTsGlId).includes(temData.tblTaxDetails.glId)) {
                                            items.taxAmountHc += GSTsGlId[temData?.tblTaxDetails?.glId].reduce((acc, curr) => acc + curr.taxAmountHc, 0)
                                            items.taxAmountFc += GSTsGlId[temData?.tblTaxDetails?.glId].reduce((acc, curr) => acc + curr.taxAmountFc, 0)
                                        }
                                        // else {
                                        //     GSTsGlId[temData?.tblTaxDetails?.glId] = [items]
                                        // }

                                        GSTsGlId[temData?.tblTaxDetails?.glId] = [{ ...items, currencyId: iterator.currencyId }]
                                    }
                                }
                                // posting of GST 
                                for (const glID of Object.keys(GSTsGlId)) {
                                    finalVoucherInsertionData.tblVoucherLedger.push({ glId: glID, debitAmount: vouchergroup.toLowerCase() == "purchase" ? GSTsGlId[glID][0].taxAmountHc : 0, creditAmount: vouchergroup.toLowerCase() == "sale" ? GSTsGlId[glID][0].taxAmountHc : 0, narration, currencyId: GSTsGlId[glID][0].currencyId, exchangeRate: exchangerate, adjustDebitAmount: 0, adjustCreditAmount: 0, tblVoucherLedgerDetails: [] })
                                }

                                // return res.send(GSTsGlId)
                                let finaData = await model.updateIfAvailableElseInsertMasterSP("tblVoucher", "tblVoucher", finalVoucherInsertionData, req)
                                // console.log("TempInvoiceData",);

                                return res.send({
                                    success: true,
                                    message: "Data Inserted Successfully",
                                    data: finalVoucherInsertionData
                                })
                            }


                        }
                    }

                    res.send({
                        moduleTemplateId,
                        voucherCode,
                        invoiceDate,
                        voucherTypeId,
                        accountEffect,
                        InvoiceData,
                        voucherID
                    })
                } catch (error) {
                    // await model.DeleteDataFromTable("tblInvoice", { _id: createObjectId(req.body.InvoiceId) })
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
    gettingTaxDetails: async (req, res) => {
        console.log("req.body", req.body);
        const validationRule = {
            // ownStateId: "required",
            glId: "required",
            invoiceDate: "required",
            // customerId: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "validation error....",
                    data: err
                })
            } else {
                try {
                    // Parameters to be passed
                    var { chargeId, totalAmount, jobType, jobCategory, formControlId, voucherType, invoiceDate, totalAmtInvoiceCurr, customerId, reverseTaxApplicable, chargeType, glId, companywiseCharge, principalwiseCharge, companyId, branchId, finYearId, userId, clientName, calledFromSP, billingPartyBranch, billingPartyState, taxType, hsnCodeId, sacCodeId, ownStateId, sez, SelectedParentInvId, departmentId, trasnportMode = 0, placeOfSupply_state, selfInvoice, totalAmountFc } = req.body
                    sez = await model.AggregateFetchData("tblMasterData", "tblMasterData", [
                        {
                            $match: {
                                _id: createObjectId(sez),
                                clientCode: req.clientCode
                            }
                        }
                    ], res)
                    sez = sez[0]?.code
                    console.log(sez);
                    if (sez == "Y") {
                        billingPartyState = 0
                    }
                    if (sez == "E") {
                        return res.send({ success: true, message: "TAX not applicable", data: [] })
                    }

                    // Variables Declaration
                    let chargeTaxApplicability,
                        chargeTaxJobType,
                        isigstonfreight,
                        igstflag,
                        modeoftransportid,
                        overseas, overseasParty = "n", rcm, composite_vendor, voucherCode, voucherGroup, typeOfCompanyDesc, tblTax = [], tblRooundOffDetails, ownStateTypeUT = 'n', billingStateTypeUT = 'n';

                    // Getting Mode of Transport
                    modeoftransportid = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                        {
                            $match: {
                                oldName: "tbl_mode_mst",
                                clientCode: req.clientCode
                            },
                        },
                        {
                            $lookup: {
                                from: "tblMasterData",
                                let: { tblObjecTid: { $toString: "$_id" } },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $eq: [
                                                            "$tblMasterListId",
                                                            "$$tblObjecTid",
                                                        ],
                                                    },
                                                    { $eq: ["$name", "Sea"] },
                                                    { $eq: ["$clientCode", req.clientCode] }
                                                ],
                                            },
                                        },
                                    },
                                ],
                                as: "masterData",
                            },
                        },
                    ], res)
                    // return res.send(modeoftransportid)
                    modeoftransportid = modeoftransportid[0].masterData[0]._id

                    // Getting IGST Flag
                    igstflag = await model.AggregateFetchData("tblCharge", "tblCharge", [
                        {
                            $match: {
                                _id: createObjectId(chargeId),
                                clientCode: req.clientCode
                            }
                        },
                        {
                            $unwind: {
                                path: "$tblChargeDetails",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $limit: 1
                        },
                        {
                            $project: {
                                igstflag: "$tblChargeDetails"
                            }
                        }
                    ], res)
                    igstflag = Isnull(igstflag[0]?.igstflag?.igstflag, "N")

                    // Setting isigstonfreight Flag
                    // console.log(new Date(invoiceDate));
                    isigstonfreight = (new Date(invoiceDate) >= new Date("2022-10-01") && igstflag === "Y") ? "Y" : "N";
                    if (Number.isInteger(parseInt(jobType)) && parseInt(jobType) !== 0) {
                        chargeTaxJobType = "To DO"
                    }
                    else {
                        chargeTaxJobType = 0
                    }
                    chargeTaxApplicability = chargeTaxJobType > 0 ? "n" : "y"
                    if (chargeTaxApplicability === "y") {
                        if (trasnportMode == 0) {
                            if (departmentId !== "" && departmentId !== 0 && typeof departmentId !== "undefined") {
                                trasnportMode = await model.AggregateFetchData("tblBusinessSegment", "tblBusinessSegment", [{
                                    $match: { _id: createObjectId(departmentId), clientCode: req.clientCode }
                                }], res)
                            }
                            else {
                                trasnportMode = await model.AggregateFetchData("tblBusinessSegment", "tblBusinessSegment", [
                                    {
                                        $match: {
                                            jobTypeId: jobType,
                                            jobCategoryId: jobCategory,
                                            clientCode: req.clientCode
                                        }
                                    }
                                ], res)
                            }
                            trasnportMode = trasnportMode[0]?.modeId
                        }
                        billingPartyState = sez?.toLowerCase() === "y" ? 0 : billingPartyState;
                        overseas = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                            {
                                $match: {
                                    oldName: "tbl_gst_party_type_mst",
                                    clientCode: req.clientCode

                                },
                            },
                            {
                                $lookup: {
                                    from: "tblMasterData",
                                    let: { tableId: { $toString: "$_id" } },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        {
                                                            $eq: ["$tblMasterListId", "$$tableId"],
                                                        },
                                                        {
                                                            $in: ["$name", ["Overseas Company", "Composition"]],
                                                        },
                                                        { $eq: ["$clientCode", req.clientCode] },
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
                                    includeArrayIndex: "index",
                                    preserveNullAndEmptyArrays: false,
                                },
                            },
                            {
                                $lookup: {
                                    from: "tblGeneralLedger",
                                    let: { partyTypeID: { $toString: "$masterData._id" } },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    // $eq: ["$gstPartyTypeId", "$$partyTypeID"],
                                                    $and: [{ $eq: ["$clientCode", req.clientCode] }, { $eq: ["$gstPartyTypeId", "$$partyTypeID"] },],
                                                },
                                            },
                                        },
                                    ],
                                    as: "gl",
                                },
                            }
                        ]
                            , res)
                        console.log("hello");
                        overseas = overseas.reduce((acc, val) => {
                            acc += val.gl.length
                            return acc
                        }, 0)
                        console.log("OverSea", overseas);

                        overseasParty = overseas > 0 ? "y" : "n";
                        companywiseCharge = companywiseCharge ? companywiseCharge : null;
                        principalwiseCharge = principalwiseCharge ? principalwiseCharge : null;
                        taxType = taxType ? taxType : 'V';
                        placeOfSupply_state = placeOfSupply_state == 0 ? null : placeOfSupply_state
                        if (SelectedParentInvId !== 0 && SelectedParentInvId !== null) {
                            voucherCode = await model.AggregateFetchData("tblInvoice", "tblInvoice", [
                                {
                                    $match: {
                                        _id: createObjectId(SelectedParentInvId),
                                        clientCode: req.clientCode
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "tblVoucherType",
                                        let: { id: "$voucherTypeId" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$_id", { $toObjectId: "$$id" }] },
                                                            { $eq: ["$clientCode", req.clientCode] }
                                                        ]
                                                    }
                                                },
                                            },
                                        ],
                                        as: "vt",
                                    },
                                },
                                {
                                    $unwind: {
                                        path: "$vt",
                                        includeArrayIndex: 'string',
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $project: {
                                        code: "$vt.code",
                                        id: "$vt.tblVoucherGroupId"
                                    }
                                }
                            ], res)
                            voucherGroup = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                                {
                                    $match: {
                                        oldName: "tbl_voucher_group_mst",
                                        clientCode: req.clientCode
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "tblMasterData",
                                        let: { tableID: { $toString: "$_id" } },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            {
                                                                $eq: [
                                                                    "$tblMasterListId",
                                                                    "$$tableID",
                                                                ],
                                                            },
                                                            {
                                                                $eq: [
                                                                    "$_id",
                                                                    {
                                                                        $toObjectId:
                                                                            voucherCode[0].id,
                                                                    },
                                                                ],
                                                            },
                                                            { $eq: ["$clientCode", req.clientCode] },
                                                        ],
                                                    },
                                                },
                                            },
                                        ],
                                        as: "masterData",
                                    },
                                },
                            ])
                            voucherCode = voucherCode[0].code?.trim()
                            voucherGroup = voucherGroup[0].masterData[0]?.name.trim()

                        }
                        // console.log(voucherGroup);

                        if (taxType?.toUpperCase() === 'S') {

                            console.log(taxType);
                            console.log(JSON.stringify([
                                {
                                    $match: {
                                        _id: createObjectId(glId)
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$tblGlTax",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tblTax",
                                        let: { taxID: "$tblGlTax.taxId" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$oldId", "$$taxID"] }
                                                        ]
                                                    }
                                                }
                                            }
                                        ],
                                        as: "taxData"
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tblMasterList",
                                        let: {
                                            oldName: "tbl_voucher_group_mst",
                                            groupID: "$tblGlTax.voucherGroupId"
                                        },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ["$oldName", "$$oldName"]
                                                    }
                                                }
                                            },
                                            {
                                                $lookup: {
                                                    from: "tblMasterData",
                                                    let: {
                                                        tabelID: { $toString: "$_id" },
                                                        groupID: "$$groupID"
                                                    },
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr: {
                                                                    $and: [
                                                                        {
                                                                            $eq: [
                                                                                "$tblMasterListId",
                                                                                "$$tabelID"
                                                                            ]
                                                                        },
                                                                        {
                                                                            $eq: [
                                                                                "$_id",
                                                                                { $toObjectId: "$$groupID" }
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
                                            { $unwind: { path: "$masterData" } },
                                            {
                                                $project: {
                                                    code: "$masterData.code",
                                                    name: "$masterData.name",
                                                    _id: "$masterData._id"
                                                }
                                            }
                                        ],
                                        as: "voucharGroupData"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$taxData",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$taxData.tblTaxDetails",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $lte: [
                                                        "$taxData.tblTaxDetails.effectiveDate",
                                                        { $toDate: invoiceDate }
                                                    ]
                                                },
                                                {
                                                    $gte: [
                                                        "$taxData.tblTaxDetails.validityDate",
                                                        { $toDate: invoiceDate }
                                                    ]
                                                }
                                            ]
                                        },
                                        "voucharGroupData.name": voucherGroup
                                    }
                                }
                            ]));
                            tblTax = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                                {
                                    $match: {
                                        _id: createObjectId(glId),
                                        clientCode: req.clientCode
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$tblGlTax",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tblTax",
                                        let: { taxID: "$tblGlTax.taxId" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            // Have to change this after updating old to object id like { $eq: ["_id", {$toObjectId: "$$taxID"}] }
                                                            { $eq: ["$oldId", "$$taxID"] },
                                                            {
                                                                $nin: ["$code", ['CGST', 'SGST', 'IGST', 'UGST', 'UTGST']]
                                                            },
                                                            { $eq: ["$clientCode", req.clientCode] }
                                                        ]
                                                    }
                                                }
                                            }
                                        ],
                                        as: "taxData"
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tblMasterList",
                                        let: {
                                            oldName: "tbl_voucher_group_mst",
                                            groupID: "$tblGlTax.voucherGroupId",

                                        },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ["$oldName", "$$oldName"],
                                                        $eq: ["$clientCode", req.clientCode]
                                                    }
                                                }
                                            },
                                            {
                                                $lookup: {
                                                    from: "tblMasterData",
                                                    let: {
                                                        tabelID: { $toString: "$_id" },
                                                        groupID: "$$groupID"
                                                    },
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr: {
                                                                    $and: [
                                                                        {
                                                                            $eq: [
                                                                                "$tblMasterListId",
                                                                                "$$tabelID"
                                                                            ]
                                                                        },
                                                                        {
                                                                            $eq: [
                                                                                "$_id",
                                                                                {
                                                                                    $toObjectId:
                                                                                        "$$groupID"
                                                                                }
                                                                            ]
                                                                        },
                                                                        { $eq: ["$clientCode", req.clientCode] }
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    ],
                                                    as: "masterData"
                                                }
                                            },
                                            { $unwind: { path: "$masterData" } },
                                            {
                                                $project: {
                                                    code: "$masterData.code",
                                                    name: "$masterData.name",
                                                    _id: "$masterData._id"
                                                }
                                            }
                                        ],
                                        as: "voucharGroupData"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$taxData",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$taxData.tblTaxDetails",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $lte: [
                                                        "$taxData.tblTaxDetails.effectiveDate",
                                                        { $toDate: invoiceDate }
                                                    ]
                                                },
                                                {
                                                    $gte: [
                                                        "$taxData.tblTaxDetails.validityDate",
                                                        { $toDate: invoiceDate }
                                                    ]
                                                }
                                            ]
                                        },
                                        "voucharGroupData.name": voucherGroup
                                    }
                                }
                            ], res)

                            console.log(tblTax.length);

                        }
                        if (taxType.toUpperCase() == "G") {
                            if (taxType.toUpperCase() === 'G' && sacCodeId !== null && sacCodeId !== '' && sacCodeId !== undefined, sacCodeId !== 0) {
                                tblTax = await model.AggregateFetchData("tblSacHsn", "tblSacHsn", [
                                    {
                                        $match: { _id: createObjectId(sacCodeId), clientCode: req.clientCode }
                                    },
                                    {
                                        $unwind: {
                                            path: "$tblSacHsnDetails",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblTax",
                                            let: { id: "$tblSacHsnDetails.taxId" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                { $eq: ["$clientCode", req.clientCode] },
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
                                            as: "taxData"
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData.tblTaxDetails",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    }
                                ])
                            }
                            else if (taxType.toUpperCase() === 'G' && hsnCodeId !== null && hsnCodeId !== '' && hsnCodeId !== undefined, hsnCodeId !== 0) {
                                tblTax = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                                    {
                                        $match: {
                                            _id: createObjectId(glId),
                                            clientCode: req.clientCode,

                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$tblGlTax",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    { $match: { "tblGlTax.hsnId": hsnCodeId } },
                                    {
                                        $lookup: {
                                            from: "tblTax",
                                            let: { taxID: "$tblGlTax.taxId" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                // Have to change this after updating old to object id like { $eq: ["_id", {$toObjectId: "$$taxID"}] }
                                                                { $eq: ["$oldId", "$$taxID"] },
                                                                {
                                                                    $in: ["$code", ['CGST', 'SGST', 'IGST', 'UGST', 'UTGST']]
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "taxData"
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMasterList",
                                            let: {
                                                oldName: "tbl_voucher_group_mst",
                                                groupID: "$tblGlTax.voucherGroupId"
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                { $eq: ["$oldName", "$$oldName"] },
                                                                { $eq: ["$clientCode", req.clientCode] }
                                                            ]
                                                        }
                                                    }
                                                },
                                                {
                                                    $lookup: {
                                                        from: "tblMasterData",
                                                        let: {
                                                            tabelID: { $toString: "$_id" },
                                                            groupID: "$$groupID"
                                                        },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $expr: {
                                                                        $and: [
                                                                            {
                                                                                $eq: [
                                                                                    "$tblMasterListId",
                                                                                    "$$tabelID"
                                                                                ]
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$_id",
                                                                                    { $toObjectId: "$$groupID" }
                                                                                ]
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$clientCode",
                                                                                    req.clientCode
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
                                                { $unwind: { path: "$masterData" } },
                                                {
                                                    $project: {
                                                        code: "$masterData.code",
                                                        name: "$masterData.name",
                                                        _id: "$masterData._id"
                                                    }
                                                }
                                            ],
                                            as: "voucharGroupData"
                                        }
                                    },

                                    // {
                                    //     $lookup: {
                                    //         from: "tblMasterList",
                                    //         let: { hsnId: "$tblGlTax.hsnId" },
                                    //         pipeline: [
                                    //             {
                                    //                 $match: {
                                    //                     oldName: "tbl_hsn_code_mst"
                                    //                 }
                                    //             },
                                    //             {
                                    //                 $lookup: {
                                    //                     from: "tblMasterData",
                                    //                     let: {
                                    //                         tableID: { $toString: "$_id" },
                                    //                         hsnId: "$$hsnId"
                                    //                     },
                                    //                     pipeline: [
                                    //                         {
                                    //                             $match: {
                                    //                                 $expr: {
                                    //                                     $and: [
                                    //                                         {
                                    //                                             $eq: [
                                    //                                                 "$tblMasterListId",
                                    //                                                 "$$tableID"
                                    //                                             ]
                                    //                                         },
                                    //                                         {
                                    //                                             $eq: [
                                    //                                                 "$_id",
                                    //                                                 {
                                    //                                                     $toObjectId: "$$hsnId"
                                    //                                                 }
                                    //                                             ]
                                    //                                         }
                                    //                                     ]
                                    //                                 }
                                    //                             }
                                    //                         }
                                    //                     ],
                                    //                     as: "sacCode"
                                    //                 }
                                    //             },
                                    //             { $unwind: { path: "$sacCode" } },
                                    //             {
                                    //                 $project: {
                                    //                     code: "$sacCode.code",
                                    //                     name: "$sacCode.name",
                                    //                     _id: "$sacCode._id",

                                    //                 }
                                    //             }
                                    //         ],
                                    //         as: "hsnCode"
                                    //     }
                                    // },

                                    {
                                        $unwind: {
                                            path: "$taxData",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData.tblTaxDetails",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },

                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $lte: [
                                                            "$taxData.tblTaxDetails.effectiveDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    },
                                                    {
                                                        $gte: [
                                                            "$taxData.tblTaxDetails.validityDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    }
                                                ]
                                            },
                                            "voucharGroupData.name": voucherGroup,
                                            // "hsnCode.code": hsnCodeId
                                        }
                                    }
                                ], res)
                            }
                        }
                        else {
                            tblTax = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                                {
                                    $match: {
                                        _id: createObjectId(glId),
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$tblGlTax",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tblTax",
                                        let: { id: "$tblGlTax.taxId" }, // Fixed reference to tblGlTax.taxId
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$clientCode", req.clientCode] },
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
                                        as: "taxData"
                                    }
                                },
                                { $unwind: { path: "$taxData", includeArrayIndex: "string", preserveNullAndEmptyArrays: false } },
                                { $unwind: { path: "$taxData.tblTaxDetails", includeArrayIndex: "string", preserveNullAndEmptyArrays: false } },
                            ]
                            )
                            let data = []
                            for (const element of tblTax) {
                                let tempObject = { taxPercentage: element.taxData.tblTaxDetails.rate, taxId: element.taxData._id, taxIddropdown: [{ value: element.taxData._id, label: element.taxData.name }], taxcatid: element.taxData.taxCategoryId, taxName: element.taxData.name, effectivedate: element.taxData.tblTaxDetails.effectiveDate, validitydate: element.taxData.tblTaxDetails.validityDate, igstflag: element.igstflag, taxDetailId: element.taxData.tblTaxDetails._id }
                                tempObject.totalAmount = totalAmount * 100 / 100
                                tempObject.totalAmountFc = totalAmountFc * 100 / 100
                                // tempObject.totalAmtInvCurr=totalAmtInvoiceCurr * tempObject.ratePercent / 100 
                                tempObject.taxAmountHc = totalAmount * tempObject.taxPercentage / 100
                                tempObject.taxAmountFc = totalAmountFc * tempObject.taxPercentage / 100
                                data.push(tempObject)
                            }

                            return res.send({ success: true, tblTax: data })
                        }
                    }
                    console.log("tblTax", tblTax);

                    tblTax = ownStateId == placeOfSupply_state ? tblTax.filter((e) => e.taxData.name == "SGST" || e.taxData.name == "CGST") : tblTax.filter((e) => e.taxData.name == "IGST")
                    let data = []
                    for (const element of tblTax) {
                        let tempObject = { taxPercentage: element.taxData.tblTaxDetails.rate, taxId: element.taxData._id, taxIddropdown: [{ value: element.taxData._id, label: element.taxData.name }], taxcatid: element.taxData.taxCategoryId, taxName: element.taxData.name, effectivedate: element.taxData.tblTaxDetails.effectiveDate, validitydate: element.taxData.tblTaxDetails.validityDate, igstflag: element.igstflag, taxDetailId: element.taxData.tblTaxDetails._id }
                        tempObject.totalAmount = totalAmount * 100 / 100
                        // tempObject.totalAmtInvCurr=totalAmtInvoiceCurr * tempObject.ratePercent / 100 
                        tempObject.taxAmountHc = totalAmount * tempObject.taxPercentage / 100
                        tempObject.taxAmountFc = totalAmount * tempObject.taxPercentage / 100
                        data.push(tempObject)
                    }

                    return res.send({ modeoftransportid, igstflag, isigstonfreight, chargeTaxApplicability, chargeTaxJobType, overseas, overseasParty, trasnportMode, voucherCode, voucherGroup, tblTax: data })

                    console.log(ownStateId == placeOfSupply_state);


                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({
                        success: false,
                        message: error.message,
                        data: []
                    })
                }
            }
        })
    },
    gettingTdsDetails: async (req, res) => {
        const validationRule = {
            // ownStateId: "required",
            // glId: "required",
            // invoiceDate: "required",
            // customerId: "required",
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
                    let { rowNo, glId, totalAmount, module_template_id, vouType, invoiceDate, partyId, totalTaxAmt, exchangeRateGrid, companyId, clientName } = req.body
                    if (isNaN(parseFloat(totalAmount))) {
                        return res.send({
                            success: false,
                        });
                    }
                    let sumOftotalAmt = 0;
                    let tdsApplicable = false;
                    let glTdsApp = await model.AggregateFetchData('tblGeneralLedger', 'tblGeneralLedger', [{ $match: { _id: createObjectId(glId), status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }], res)
                    // console.log(glTdsApp[0]?.tdsApp);
                    glTdsApp = Isnull(glTdsApp[0]?.tdsApp, "n")
                    console.log(glTdsApp.toUpperCase())
                    let partyTdsApp = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [{ $match: { _id: createObjectId(partyId), status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }], res)
                    partyTdsApp = Isnull(partyTdsApp[0]?.tdsApp, "n")
                    console.log(partyTdsApp.toUpperCase())
                    let tdsRoundOffData = await model.AggregateFetchData('tblCompanyParameter', 'tblCompanyParameter', [{ $match: { companyId: companyId, status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode } }], res)
                    let tdsRoundOff = Isnull(tdsRoundOffData[0]?.tdsRoundOff, "n")
                    if (clientName === "CARGOCARRIER") {
                        // table tbl_typeofcompanysector_mst does not exist
                    }
                    else {
                        if ((glTdsApp.toUpperCase() === "Y" || glTdsApp.toUpperCase() === "YES") && (partyTdsApp.toUpperCase() === "Y" || partyTdsApp.toUpperCase() === "YES")) {
                            tdsApplicable = true;
                        }
                    }
                    if (!tdsApplicable) {
                        return res.send({ message: "TDS Not Applicable", success: false, data: [] })
                    }
                    let exemptionRate = 0;
                    let exemptionLimit = 0;
                    let deduction = 0;
                    let partyTdsRate = 0;

                    if (exemptionLimit > 0) {
                        if (parseFloat(totalTaxAmt) < parseFloat(exemptionLimit)) {
                            deduction = parseFloat(totalAmount) * parseFloat(exemptionRate) / 100;
                        } else {
                            deduction = 0;
                        }
                    } else {
                        deduction = parseFloat(totalAmount) * parseFloat(exemptionRate) / 100;
                    }
                    totalAmount = parseFloat(totalAmount) - parseFloat(deduction);
                    totalAmount = totalAmount / parseFloat(exchangeRateGrid);
                    totalAmount = parseFloat(totalAmount);
                    // ------------------------------------General Ledger Query--------------------------------------------------------
                    // partyTdsRate = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                    //     {
                    //         $unwind: {
                    //             path: "$tblPartyTds",
                    //             includeArrayIndex: "string",
                    //             preserveNullAndEmptyArrays: true
                    //         }
                    //     },
                    //     {
                    //         $match: {
                    //             "tblPartyTds._id": createObjectId(partyId),
                    //             _id: createObjectId(glId)
                    //         }
                    //     },
                    //     {
                    //         $addFields: {
                    //             tdsRate: { $ifNull: ["$tblPartyTds.tdsRate", 0] }
                    //         }
                    //     }

                    // ], res)
                    //----------------------------------------------------------------tbl Tds Query--------------------------------------------------------
                    partyTdsRate = await model.AggregateFetchData("tblTds", "tblTds", [
                        {
                            $unwind: {
                                path: "$tblTdsDetails",
                                includeArrayIndex: "string",
                                preserveNullAndEmptyArrays: false
                            }
                        },
                        {
                            $match: {
                                "tblTdsDetails.companyId": companyId,
                                clientCode: req.clientCode
                            }
                        },
                        {
                            $lookup: {
                                from: "tblGeneralLedger",
                                let: { tdsDetailsID: { $toString: "$_id" } },
                                pipeline: [
                                    {
                                        $match: {
                                            _id: createObjectId(glId),
                                            clientCode: req.clientCode
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$tblPartyTds",
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $eq: [
                                                            "$tblPartyTds.tdsId",
                                                            "$$tdsDetailsID"
                                                        ]
                                                    },
                                                    // {
                                                    //     $eq: [
                                                    //         "$tblPartyTds._id",
                                                    //         createObjectId(partyId)
                                                    //     ]
                                                    // }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: "gldata"
                            }
                        },
                        {
                            $unwind: {
                                path: "$gldata",
                                includeArrayIndex: "string",
                                preserveNullAndEmptyArrays: false
                            }
                        }
                    ], res)
                    partyTdsRate = Isnull(partyTdsRate[0]?.gldata?.tblPartyTds?.tdsRate, 0)
                    console.log("partyTdsRate", partyTdsRate);
                    let query = []
                    let data
                    if (parseFloat(partyTdsRate) == 0.0) {
                        //-------------------------------------------tbl Gerenal Ledger Query-------------------------------------------------------- 
                        // query = [
                        //     {
                        //         $unwind: {
                        //             path: "$tblPartyTds",
                        //             includeArrayIndex: "string",
                        //             preserveNullAndEmptyArrays: true
                        //         }
                        //     },
                        //     {
                        //         $match: {
                        //             "tblPartyTds.companyId": createObjectId(companyId),
                        //             "tblPartyTds._id": createObjectId(partyId),
                        //             _id: createObjectId(glId)
                        //         }
                        //     },
                        //     {
                        //         $addFields: {
                        //             tdsRate: { $ifNull: ["$tblPartyTds.tdsRate", 0] },
                        //             effectiveDate: "$tblPartyTds.effectiveDate"
                        //         }
                        //     },
                        //     {
                        //         $sort: {
                        //             effectiveDate: -1
                        //         }
                        //     },
                        //     {
                        //         $match: {
                        //             effectiveDate: { $lte: new Date(invoiceDate) },
                        //         }
                        //     },
                        //     { $limit: 1 }

                        // ]

                        //-------------------------------------------tbl Tds Query--------------------------------------------------------
                        console.log("first if condition");
                        query = [
                            {
                                $unwind: {
                                    path: "$tblTdsDetails",
                                    includeArrayIndex: "string",
                                    preserveNullAndEmptyArrays: false
                                }
                            },
                            {
                                $match: {
                                    "tblTdsDetails.companyId": companyId,
                                    "tblTdsDetails.effectiveDate": { $lte: new Date(invoiceDate) },
                                    clientCode: req.clientCode

                                }
                            },
                            {
                                $lookup: {
                                    from: "tblGeneralLedger",
                                    let: { tdsDetailsID: "$_id" },
                                    pipeline: [
                                        {
                                            $match: {
                                                _id: createObjectId(glId),
                                                clientCode: req.clientCode
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: "$tblPartyTds",
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        {
                                                            $eq: [
                                                                "$tblPartyTds.tdsId",
                                                                "$$tdsDetailsID"
                                                            ]
                                                        },
                                                        // {
                                                        //     $eq: [
                                                        //         "$tblPartyTds._id",
                                                        //         createObjectId(partyId)
                                                        //     ]
                                                        // }
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    as: "gldata"
                                }
                            },
                            { $sort: { "tblTdsDetails.effectiveDate": -1 } },
                            {
                                $unwind: {
                                    path: "$gldata",
                                    includeArrayIndex: "string",
                                    preserveNullAndEmptyArrays: false
                                }
                            },
                            { $limit: 1 }

                        ]
                        data = await model.AggregateFetchData("tblTds", "tblTds", query, res) //data
                    }
                    else {
                        console.log("second if condition");
                        query = [
                            {
                                $unwind: {
                                    path: "$tblTdsDetails",
                                    includeArrayIndex: "string",
                                    preserveNullAndEmptyArrays: false
                                }
                            },
                            {
                                $match: {
                                    "tblTdsDetails.companyId": companyId,
                                    "tblTdsDetails.effectiveDate": { $lte: new Date(invoiceDate) },
                                    clientCode: req.clientCode
                                }
                            },
                            {
                                $lookup: {
                                    from: "tblGeneralLedger",
                                    let: { tdsDetailsID: { $toString: "$_id" } },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        { $eq: ["$_id", createObjectId(partyId)] },
                                                        { $eq: ["$companyId", companyId] },
                                                        { $eq: ["$clientCode", req.clientCode] },
                                                        { $eq: ["$natureOfTdsId", "$$tdsDetailsID"] },
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: "$tblPartyTds",
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        { $eq: ["$tblPartyTds.tdsId", "$$tdsDetailsID"] },
                                                        // { $eq: ["$tblPartyTds._id", createObjectId(partyId)] }
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    as: "gldata"
                                }
                            },
                            {
                                $sort: { "tblTdsDetails.effectiveDate": -1 }
                            },
                            {
                                $unwind: {
                                    path: "$gldata",
                                    includeArrayIndex: "string",
                                    preserveNullAndEmptyArrays: false
                                }
                            },
                            { $limit: 1 }
                        ]
                        data = await model.AggregateFetchData("tblTds", "tblTds", query, res) //data
                        console.log("length of data", data.length);
                        if (data.length == 0) {
                            console.log("third if condition");
                            query = [
                                {
                                    $unwind: {
                                        path: "$tblTdsDetails",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $match: {
                                        "tblTdsDetails.companyId": companyId,
                                        "tblTdsDetails.effectiveDate": { $lte: new Date(invoiceDate) },
                                        clientCode: req.clientCode
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tblGeneralLedger",
                                        let: { tdsDetailsID: "$_id" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$_id", createObjectId(glId)] },
                                                            { $eq: ["$companyId", companyId] },
                                                            { $eq: ["$clientCode", req.clientCode] },
                                                            { $eq: ["$natureOfTdsId", "$$tdsDetailsID"] },
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                $unwind: {
                                                    path: "$tblPartyTds",
                                                    preserveNullAndEmptyArrays: true
                                                }
                                            },
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$tblPartyTds.tdsId", "$$tdsDetailsID"] },
                                                            // { $eq: ["$tblPartyTds._id", createObjectId(partyId)] }
                                                        ]
                                                    }
                                                }
                                            }
                                        ],
                                        as: "gldata"
                                    }
                                },
                                {
                                    $sort: { "tblTdsDetails.effectiveDate": -1 }
                                },
                                {
                                    $unwind: {
                                        path: "$gldata",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                { $limit: 1 }
                            ]
                            data = await model.AggregateFetchData("tblTds", "tblTds", query, res)
                        }

                    }
                    // return res.send({ success: true, data: data })
                    let finalArray = []
                    if (data.length > 0) {
                        let taxInclude = Isnull(tdsRoundOffData[0]?.taxInclude, "N")
                        for (const item of data) {
                            if (taxInclude === "y") {
                                sumOftotalAmt = parseFloat(totalAmount) + parseFloat(totalTaxAmt);
                            } else {
                                sumOftotalAmt = parseFloat(totalAmount);
                            }
                            console.log("sumOftotalAmt", sumOftotalAmt);
                            let basicTds = sumOftotalAmt * item.tblTdsDetails.rate / 100
                            let homeCurrencyTds = sumOftotalAmt * exchangeRateGrid * item.tblTdsDetails.rate / 100

                            if (tdsRoundOff === "Y") {
                                basicTds = Math.round(basicTds);
                                homeCurrencyTds = Math.round(homeCurrencyTds);
                            }
                            finalArray.push({ basicTds, tdsAmountHc: homeCurrencyTds, tdspercentage: item.tblTdsDetails.rate, tdsId: item._id, tdsDetailId: item.tblTdsDetails._id })
                        }
                        return res.status(200).send({ success: true, message: "Data Found", data: finalArray })
                    }

                    res.send({ glTdsApp, partyTdsApp, tdsRoundOff, tdsApplicable, deduction, totalAmount, partyTdsRate, })
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: error.message,
                        data: []
                    })
                }
            }
        })


    },
    getJobChargeDetails: async (req, res) => {
        try {
            let { pageMode, moduleTemplateId, clientName, voucherType, chargeBasedOn, DepartmentId, jobIds, blIds, vesselId, voyageId, billingPartyId, principalId, invoiceType, companyId, companyBranchId } = req.body
            let invoiceDepartmentId, jobType, jobCategory, prepaidCollect, getChargeFrom
            if (DepartmentId && DepartmentId !== "" && DepartmentId !== "undefined" && DepartmentId !== 0) {
                jobType = await model.AggregateFetchData("tblBusinessSegment", "tblBusinessSegment", [
                    {
                        $match: {
                            _id: createObjectId(DepartmentId),
                            clientCode: req.clientCode
                        }
                    },
                    {
                        $lookup: {
                            from: "tblMasterList",
                            let: { jobId: "$jobTypeId" },
                            pipeline: [
                                {
                                    $match: {
                                        oldName: "tbl_enquiry_type_mst",
                                        clientCode: req.clientCode
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tblMasterData",
                                        let: {
                                            tableID: { $toString: "$_id" }
                                        },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            {
                                                                $eq: [
                                                                    "$tblMasterListId",
                                                                    "$$tableID"
                                                                ]
                                                            },
                                                            {
                                                                $eq: [
                                                                    "$clientCode",
                                                                    req.clientCode
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
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$masterData._id",
                                                        { $toObjectId: "$$jobId" }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        name: "$masterData.name",
                                        code: "$masterData.code",
                                        masterData: "$masterData"
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
                        $project: {
                            code: "$masterData.code"
                        }
                    }
                ])
                jobType = jobType[0]?.code
            }
            jobType?.toUpperCase() == "E" ? prepaidCollect = "1" : jobType?.toUpperCase() == "I" ? prepaidCollect = "2" : prepaidCollect = ""
            // async function getExistingCharge(params) {
            let existingChargeData = await model.AggregateFetchData("tblInvoice", "tblInvoice", [
                {
                    $match: {
                        jobId: jobIds,
                        clientCode: req.clientCode,
                        // billingPartyId: billingPartyId
                    }
                },
                {
                    $unwind: {
                        path: "$tblInvoiceCharge",
                        preserveNullAndEmptyArrays: false
                    }
                }

            ])
            // let voucherid = new Set(existingChargeData.map(item => createObjectId(item.voucherId)))
            // let voucherCode = await model.AggregateFetchData("tblVoucher", "tblVoucher", [
            //     {
            //         $match: { _id: { $in: Array.from(voucherid) }, }
            //     },
            //     {
            //         $lookup: {
            //             from: "tblVoucherType",
            //             let: { id: "$voucherTypeId" },
            //             pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", { $toObjectId: "$$id" }] }] } } }],
            //             as: "VoucherType"
            //         }
            //     },
            //     {
            //         $unwind: {
            //             path: "$VoucherType",
            //         }
            //     },
            //     {
            //         $match: { "VoucherType.code": voucherType }
            //     }

            // ], res)
            // console.log(voucherCode);
            // let existingChargeId = new Set(existingChargeData.filter(item => voucherCode.some(code => code._id.toString() !== item.voucherId)).map(item => item.tblInvoiceCharge.map(item => createObjectId(item.jobChargeId))))
            let existingChargeId = new Set(existingChargeData.map(item => createObjectId(item.tblInvoiceCharge.jobChargeId)))
            console.log(existingChargeId);

            //    return existingChargeId
            //
            console.log(DepartmentId == 0 && req.clientCode !== "TLS");
            let Chargers
            if (DepartmentId == 0 && req.clientCode.trim().toUpperCase() !== "TLS") {

                Chargers = await model.AggregateFetchData("tblJob", "tblJob", [
                    {
                        $match: {
                            _id: createObjectId(jobIds),
                            clientCode: req.clientCode
                        }
                    },
                    {
                        $unwind: {
                            path: "$tblJobCharge",
                            includeArrayIndex: 'string',
                            preserveNullAndEmptyArrays: false
                        }
                    },
                    {
                        $match: { "tblJobCharge.sellRate": { $ne: 0 }, "tblJobCharge._id": { $nin: Array.from(existingChargeId) } }
                    },
                    {
                        $lookup: {
                            from: "tblCharge",
                            let: { chargeID: "$tblJobCharge.chargeId" },
                            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", { $toObjectId: "$$chargeID" }] }] } } }],
                            as: "chargeDesc"
                        }
                    },
                    {
                        $unwind: {
                            path: "$chargeDesc",
                            includeArrayIndex: 'string',
                            preserveNullAndEmptyArrays: false
                        }
                    },
                    {
                        $addFields: {
                            bl_measurement: { $size: "$tblJobContainer" }
                        }
                    },
                    {
                        $project: {
                            "tblJobCharge": "$tblJobCharge",
                            tblChargeDesc: "$chargeDesc",
                            bl_measurement: 1,
                            jobNo: 1
                        }
                    }
                ], res)
                // return res.send({ Chargers })
            }
            else if (DepartmentId == 0 && req.clientCode == "TLS") {
                Chargers = await model.AggregateFetchData("tblJob", "tblJob", [
                    {
                        $match: {
                            _id: createObjectId(jobIds),
                            clientCode: req.clientCode
                        }
                    },
                    {
                        $unwind: {
                            path: "$tblJobCharge",
                            includeArrayIndex: 'string',
                            preserveNullAndEmptyArrays: false
                        }
                    },
                    {
                        $match: { "tblJobCharge.sellRate": { $ne: 0 }, "tblJobCharge.chargeId": { $nin: Array.from(existingChargeId) } }
                    },
                    {
                        $lookup: {
                            from: "tblCharge",
                            let: { chargeID: "$tblJobCharge.chargeId" },
                            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", { $toObjectId: "$$chargeID" }] }] } } }],
                            as: "chargeDesc"
                        }
                    },
                    {
                        $unwind: {
                            path: "$chargeDesc",
                            includeArrayIndex: 'string',
                            preserveNullAndEmptyArrays: false
                        }
                    },
                    {
                        $addFields: {
                            bl_measurement: { $size: "$tblJobContainer" },
                            bl_id: "0",
                            hblNo: ""
                        }
                    },
                    {
                        $project: {
                            "tblJobCharge": "$tblJobCharge",
                            tblChargeDesc: "$chargeDesc",
                            bl_measurement: 1,
                            bl_id: 1,
                            hblNo: 1,
                            jobNo: 1
                        }
                    }
                ], res)
                // return res.send({ Chargers })
            }
            else {
                Chargers = await model.AggregateFetchData("tblJob", "tblJob", [
                    {
                        $match: {
                            _id: createObjectId(jobIds),
                            clientCode: req.clientCode
                        }
                    },
                    {
                        $unwind: {
                            path: "$tblJobCharge",
                            includeArrayIndex: 'string',
                            preserveNullAndEmptyArrays: false
                        }
                    },
                    {
                        $match: { "tblJobCharge.sellRate": { $ne: 0 }, "tblJobCharge._id": { $nin: Array.from(existingChargeId) } }
                    },
                    {
                        $lookup: {
                            from: "tblCharge",
                            let: { chargeID: "$tblJobCharge.chargeId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$_id", { $toObjectId: "$$chargeID" }] }
                                            ],
                                        }
                                    }
                                },
                                {
                                    $addFields: {
                                        tblChargeDetails: {
                                            $filter: {
                                                input: "$tblChargeDetails",
                                                as: "item",
                                                cond: {
                                                    $or: [
                                                        {
                                                            $and: [
                                                                { $eq: ["$$item.chargeBasedOn", "principal"] },
                                                                { $eq: ["$$item.principalId", principalId] }
                                                            ]
                                                        },
                                                        {
                                                            $and: [
                                                                { $eq: ["$$item.chargeBasedOn", "company"] },
                                                                { $eq: ["$$item.companyId", companyId] }
                                                            ]
                                                        },
                                                        { $eq: ["$$item.chargeBasedOn", ""] }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                            ,
                            as: "chargeDesc"
                        }
                    },
                    {
                        $unwind: {
                            path: "$chargeDesc",
                            includeArrayIndex: 'string',
                            preserveNullAndEmptyArrays: false
                        }
                    },
                    {
                        $lookup: {
                            from: "tblMasterData",
                            let: {
                                sellCurr: "$tblJobCharge.sellCurrencyId"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$_id",
                                                        { $toObjectId: "$$sellCurr" }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: "sellCur"
                        }
                    },
                    {
                        $lookup: {
                            from: "tblMasterData",
                            let: {
                                sellCurr: "$tblJobCharge.buyCurrencyId"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$_id",
                                                        { $toObjectId: "$$sellCurr" }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: "buyCur"
                        }
                    },
                    {
                        $unwind: {
                            path: "$sellCur",
                            includeArrayIndex: "string",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $unwind: {
                            path: "$buyCur",
                            includeArrayIndex: "string",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $addFields: {
                            bl_measurement: { $size: "$tblJobContainer" },
                            bl_id: "0",
                            hblNo: ""
                        }
                    },
                    {
                        $project: {
                            "tblJobCharge": "$tblJobCharge",
                            tblChargeDesc: "$chargeDesc",
                            bl_measurement: 1,
                            sellCur: 1,
                            buyCur: 1,
                            bl_id: 1,
                            hblNo: 1,
                            jobNo: 1
                        }
                    }
                ], res)

                // return res.send({ Chargers })
            }
            // return res.send({ Chargers })
            let finalData = []
            if (Array.isArray(Chargers)) {

                for (const item of Chargers) {
                    let value = item.tblJobCharge
                    let temp = {}
                    temp.jobChargeId = value._id
                    temp.description = value.chargeDescription !== null ? value.chargeDescription : ""
                    temp.jobId = item._id
                    temp.jobIddropdown = [{ value: item._id, label: item.jobNo }]
                    temp.rate = value.sellRate
                    temp.qty = value.qty
                    temp.chargeId = value.chargeId
                    temp.chargeIddropdown = [{ value: value.chargeId, label: item.tblChargeDesc.name }]
                    // temp.chargeId = value.chargeId
                    temp.currencyId = value.sellCurrencyId
                    temp.currencyIddropdown = [{ value: value.sellCurrencyId, label: item.sellCur.name }]
                    temp.totalAmount = value.sellNetAmount
                    temp.totalAmountFc = value.sellNetAmount
                    temp.exchangeRate = value.sellExchangeRate
                    temp.tblInvoiceChargeTax = []
                    finalData.push(temp)
                }
            }
            res.send({ Chargers: finalData })
        } catch (error) {
            res.status(500).send({
                success: false,
                message: error.message,
                data: []
            })
        }
    },
    getBlChargeDetails: async (req, res) => {
        const validationRule = {}
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
                    let { BLID, voucherType, lstjobID, impexptype, glId } = req.body
                    let voucherData = await model.AggregateFetchData("tblVoucherType", "tblVoucherType", [
                        {
                            $match: {
                                code: voucherType
                            }
                        },
                        {
                            $lookup: {
                                from: "tblMasterList",
                                let: { typeId: { $toObjectId: "$tblVoucherGroupId" } },
                                pipeline:
                                    [
                                        {
                                            $match: {
                                                oldName: "tbl_voucher_group_mst"
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: "tblMasterData",
                                                let: { tableId: { $toString: "$_id" } },
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr: {
                                                                $and: [
                                                                    {
                                                                        $eq: [
                                                                            "$tblMasterListId",
                                                                            "$$tableId"
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
                                            $project: {
                                                _id: "$masterData._id",
                                                name: "$masterData.name",
                                                code: "$masterData.code"
                                            }
                                        },
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [{ $eq: ["$_id", "$$typeId"] }]
                                                }
                                            }
                                        }
                                    ],
                                as: "voucherData"
                            }
                        }
                    ], res)
                    voucherData = voucherData[0]?.voucherData[0]?.name
                    let invoiceCharge = await model.AggregateFetchData("tblInvoice", "tblInvoice", [
                        { $match: { blId: BLID } },
                        { $unwind: "$tblInvoiceCharge" },
                        // {$match:{"tblInvoiceCharge.blChargeId":BLID}},
                        { $project: { tblInvoiceCharge: 1 } }

                    ])
                    let invoiceChargeAmount = []
                    for (const iterator of invoiceCharge) {
                        invoiceChargeAmount.push({ blChargeId: iterator.tblInvoiceCharge.blChargeId, amount: iterator.tblInvoiceCharge.totalAmount })
                    }
                    console.log(invoiceChargeAmount);
                    let matchData = {
                        _id: createObjectId(BLID)
                    }
                    if (voucherData == "SALES") {
                        matchData["tblBlCharge.sellPartyId"] = glId
                    }
                    else {
                        matchData["tblBlCharge.buyPartyId"] = glId
                    }
                    let blCharges = await model.AggregateFetchData("tblBl", "tblBl", [
                        { $match: { _id: createObjectId(BLID) } },
                        { $unwind: { path: "$tblBlCharge" } },
                        {
                            $match: matchData
                        },
                        {
                            $project: { tblBlCharge: 1 }
                        }
                    ])
                    blCharges = blCharges.filter((data) => !invoiceChargeAmount.some((invoiceData) => invoiceData.blChargeId == data.tblBlCharge._id.toString() && invoiceData.amount == data.tblBlCharge[`${voucherData == "SALES" ? "sellTotalAmountHc" : "buyTotalAmountHc"}`]))
                    res.send({ voucherData, blCharges })
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: error.message,
                        data: []
                    })
                }
            }
        })
    },
    oldgettingTaxDetails: async (req, res) => {
        console.log("req.body", req.body);
        const validationRule = {
            ownStateId: "required",
            glId: "required",
            invoiceDate: "required",
            // customerId: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "validation error....",
                    data: err
                })
            } else {
                try {
                    // Parameters to be passed
                    var { chargeId, totalAmount, jobType, jobCategory, formControlId, voucherType, invoiceDate, totalAmtInvoiceCurr, customerId, reverseTaxApplicable, chargeType, glId, companywiseCharge, principalwiseCharge, companyId, branchId, finYearId, userId, clientName, calledFromSP, billingPartyBranch, billingPartyState, taxType, hsnCodeId, sacCodeId, ownStateId, sez, SelectedParentInvId, departmentId, trasnportMode = 0, placeOfSupply_state, selfInvoice } = req.body
                    sez = await model.AggregateFetchData("tblMasterData", "tblMasterData", [
                        {
                            $match: {
                                _id: createObjectId(sez),
                                clientCode: req.clientCode
                            }
                        }
                    ], res)
                    sez = sez[0]?.code
                    console.log(sez);
                    if (sez == "Y") {
                        billingPartyState = 0
                    }
                    if (sez == "E" || typeof sez == "undefined") {
                        return res.send({ success: true, message: "TAX not applicable", data: [] })
                    }

                    // Variables Declaration
                    let chargeTaxApplicability,
                        chargeTaxJobType,
                        isigstonfreight,
                        igstflag,
                        modeoftransportid,
                        overseas, overseasParty = "n", rcm, composite_vendor, voucherCode, voucherGroup, typeOfCompanyDesc, tblTax = [], tblRooundOffDetails, ownStateTypeUT = 'n', billingStateTypeUT = 'n';

                    // Getting Mode of Transport
                    modeoftransportid = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                        {
                            $match: {
                                oldName: "tbl_mode_mst",
                            },
                        },
                        {
                            $lookup: {
                                from: "tblMasterData",
                                let: { tblObjecTid: { $toString: "$_id" } },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $eq: [
                                                            "$tblMasterListId",
                                                            "$$tblObjecTid",
                                                        ],
                                                    },
                                                    { $eq: ["$name", "Sea"] },
                                                    { $eq: ["$clientCode", req.clientCode] }
                                                ],
                                            },
                                        },
                                    },
                                ],
                                as: "masterData",
                            },
                        },
                    ], res)
                    // return res.send(modeoftransportid)
                    modeoftransportid = modeoftransportid[0].masterData[0]._id

                    // Getting IGST Flag
                    igstflag = await model.AggregateFetchData("tblCharge", "tblCharge", [
                        {
                            $match: {
                                _id: createObjectId(chargeId),
                                clientCode: req.clientCode
                            }
                        },
                        {
                            $unwind: {
                                path: "$tblChargeDetails",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $limit: 1
                        },
                        {
                            $project: {
                                igstflag: "$tblChargeDetails"
                            }
                        }
                    ], res)
                    igstflag = Isnull(igstflag[0]?.igstflag?.igstflag, "N")

                    // Setting isigstonfreight Flag
                    // console.log(new Date(invoiceDate));
                    isigstonfreight = (new Date(invoiceDate) >= new Date("2022-10-01") && igstflag === "Y") ? "Y" : "N";
                    if (Number.isInteger(parseInt(jobType)) && parseInt(jobType) !== 0) {
                        chargeTaxJobType = "To DO"
                    }
                    else {
                        chargeTaxJobType = 0
                    }
                    chargeTaxApplicability = chargeTaxJobType > 0 ? "n" : "y"
                    if (chargeTaxApplicability === "y") {
                        if (trasnportMode == 0) {
                            if (departmentId !== "" && departmentId !== 0 && typeof departmentId !== "undefined") {
                                trasnportMode = await model.AggregateFetchData("tblBusinessSegment", "tblBusinessSegment", [{
                                    $match: { _id: createObjectId(departmentId), clientCode: req.clientCode }
                                }], res)
                            }
                            else {
                                trasnportMode = await model.AggregateFetchData("tblBusinessSegment", "tblBusinessSegment", [
                                    {
                                        $match: {
                                            jobTypeId: jobType,
                                            jobCategoryId: jobCategory,
                                            clientCode: req.clientCode
                                        }
                                    }
                                ], res)
                            }
                            trasnportMode = trasnportMode[0].modeId
                        }
                        billingPartyState = sez?.toLowerCase() === "y" ? 0 : billingPartyState;
                        overseas = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                            {
                                $match: {
                                    oldName: "tbl_gst_party_type_mst",
                                    clientCode: req.clientCode

                                },
                            },
                            {
                                $lookup: {
                                    from: "tblMasterData",
                                    let: { tableId: { $toString: "$_id" } },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        {
                                                            $eq: ["$tblMasterListId", "$$tableId"],
                                                        },
                                                        {
                                                            $in: ["$name", ["Overseas Company", "Composition"]],
                                                        },
                                                        { $eq: ["$clientCode", req.clientCode] },
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
                                    includeArrayIndex: "index",
                                    preserveNullAndEmptyArrays: false,
                                },
                            },
                            {
                                $lookup: {
                                    from: "tblGeneralLedger",
                                    let: { partyTypeID: { $toString: "$masterData._id" } },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    // $eq: ["$gstPartyTypeId", "$$partyTypeID"],
                                                    $and: [{ $eq: ["$clientCode", req.clientCode] }, { $eq: ["$gstPartyTypeId", "$$partyTypeID"] },],
                                                },
                                            },
                                        },
                                    ],
                                    as: "gl",
                                },
                            }
                        ]
                            , res)
                        console.log("hello");
                        overseas = overseas.reduce((acc, val) => {
                            acc += val.gl.length
                            return acc
                        }, 0)
                        console.log("OverSea", overseas);

                        overseasParty = overseas > 0 ? "y" : "n";
                        companywiseCharge = companywiseCharge ? companywiseCharge : null;
                        principalwiseCharge = principalwiseCharge ? principalwiseCharge : null;
                        taxType = taxType ? taxType : 'G';
                        placeOfSupply_state = placeOfSupply_state == 0 ? null : placeOfSupply_state
                        if (SelectedParentInvId !== 0 && SelectedParentInvId !== null) {
                            voucherCode = await model.AggregateFetchData("tblInvoice", "tblInvoice", [
                                {
                                    $match: {
                                        _id: createObjectId(SelectedParentInvId),
                                        clientCode: req.clientCode
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "tblVoucherType",
                                        let: { id: "$voucherTypeId" },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ["$_id", { $toObjectId: "$$id" }] },
                                                            { $eq: ["$clientCode", req.clientCode] }
                                                        ]
                                                    }
                                                },
                                            },
                                        ],
                                        as: "vt",
                                    },
                                },
                                {
                                    $unwind: {
                                        path: "$vt",
                                        includeArrayIndex: 'string',
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $project: {
                                        code: "$vt.code",
                                        id: "$vt.tblVoucherGroupId"
                                    }
                                }
                            ], res)
                            voucherGroup = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                                {
                                    $match: {
                                        oldName: "tbl_voucher_group_mst",
                                        clientCode: req.clientCode
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "tblMasterData",
                                        let: { tableID: { $toString: "$_id" } },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            {
                                                                $eq: [
                                                                    "$tblMasterListId",
                                                                    "$$tableID",
                                                                ],
                                                            },
                                                            {
                                                                $eq: [
                                                                    "$_id",
                                                                    {
                                                                        $toObjectId:
                                                                            voucherCode[0].id,
                                                                    },
                                                                ],
                                                            },
                                                            { $eq: ["$clientCode", req.clientCode] },
                                                        ],
                                                    },
                                                },
                                            },
                                        ],
                                        as: "masterData",
                                    },
                                },
                            ])
                            voucherCode = voucherCode[0].code?.trim()
                            voucherGroup = voucherGroup[0].masterData[0]?.name.trim()

                        }
                        else {
                            voucherCode = await model.AggregateFetchData("tblVoucherType", "tblVoucherType", [
                                {
                                    $unwind: {
                                        path: "$tblVoucherTypeModule",
                                        includeArrayIndex: "string",
                                        preserveNullAndEmptyArrays: false
                                    }
                                },
                                {
                                    $match: {
                                        "tblVoucherTypeModule.formControlId": formControlId,
                                        clientCode: req.clientCode
                                    }
                                }
                            ])
                            voucherGroup = await model.AggregateFetchData("tblMasterList", "tblMasterList", [
                                {
                                    $match: {
                                        oldName: "tbl_voucher_group_mst",
                                        clientCode: req.clientCode
                                    },
                                },
                                {
                                    $lookup: {
                                        from: "tblMasterData",
                                        let: { tableID: { $toString: "$_id" } },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            {
                                                                $eq: [
                                                                    "$tblMasterListId",
                                                                    "$$tableID",
                                                                ],
                                                            },
                                                            {
                                                                $eq: [
                                                                    "$_id",
                                                                    {
                                                                        $toObjectId:
                                                                            voucherCode[0]?.tblVoucherGroupId,
                                                                    },
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
                            ])
                            voucherCode = voucherCode[0]?.code?.trim()
                            voucherGroup = voucherGroup[0]?.masterData[0]?.name.trim()
                        }
                        if (['G_EXP', 'G_PAY', 'ICN', 'GSI', 'SELFINV', 'I_F_J_P', 'CN', 'OCN', 'DN', 'GP', 'TP', 'BLI', 'E_F_BL', 'ETF', 'OT', 'INEXP', 'PFI'].includes(voucherCode)) {
                            // console.log(voucherGroup);

                            if (taxType?.toUpperCase() === 'S') {
                                console.log(taxType);
                                console.log(JSON.stringify([
                                    {
                                        $match: {
                                            _id: createObjectId(glId)
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$tblGlTax",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblTax",
                                            let: { taxID: "$tblGlTax.taxId" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                { $eq: ["$oldId", "$$taxID"] }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "taxData"
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMasterList",
                                            let: {
                                                oldName: "tbl_voucher_group_mst",
                                                groupID: "$tblGlTax.voucherGroupId"
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ["$oldName", "$$oldName"]
                                                        }
                                                    }
                                                },
                                                {
                                                    $lookup: {
                                                        from: "tblMasterData",
                                                        let: {
                                                            tabelID: { $toString: "$_id" },
                                                            groupID: "$$groupID"
                                                        },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $expr: {
                                                                        $and: [
                                                                            {
                                                                                $eq: [
                                                                                    "$tblMasterListId",
                                                                                    "$$tabelID"
                                                                                ]
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$_id",
                                                                                    { $toObjectId: "$$groupID" }
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
                                                { $unwind: { path: "$masterData" } },
                                                {
                                                    $project: {
                                                        code: "$masterData.code",
                                                        name: "$masterData.name",
                                                        _id: "$masterData._id"
                                                    }
                                                }
                                            ],
                                            as: "voucharGroupData"
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData.tblTaxDetails",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $lte: [
                                                            "$taxData.tblTaxDetails.effectiveDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    },
                                                    {
                                                        $gte: [
                                                            "$taxData.tblTaxDetails.validityDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    }
                                                ]
                                            },
                                            "voucharGroupData.name": voucherGroup
                                        }
                                    }
                                ]));
                                tblTax = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                                    {
                                        $match: {
                                            _id: createObjectId(glId),
                                            clientCode: req.clientCode
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$tblGlTax",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblTax",
                                            let: { taxID: "$tblGlTax.taxId" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                // Have to change this after updating old to object id like { $eq: ["_id", {$toObjectId: "$$taxID"}] }
                                                                { $eq: ["$oldId", "$$taxID"] },
                                                                {
                                                                    $nin: ["$code", ['CGST', 'SGST', 'IGST', 'UGST', 'UTGST']]
                                                                },
                                                                { $eq: ["$clientCode", req.clientCode] }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "taxData"
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMasterList",
                                            let: {
                                                oldName: "tbl_voucher_group_mst",
                                                groupID: "$tblGlTax.voucherGroupId",

                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ["$oldName", "$$oldName"],
                                                            $eq: ["$clientCode", req.clientCode]
                                                        }
                                                    }
                                                },
                                                {
                                                    $lookup: {
                                                        from: "tblMasterData",
                                                        let: {
                                                            tabelID: { $toString: "$_id" },
                                                            groupID: "$$groupID"
                                                        },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $expr: {
                                                                        $and: [
                                                                            {
                                                                                $eq: [
                                                                                    "$tblMasterListId",
                                                                                    "$$tabelID"
                                                                                ]
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$_id",
                                                                                    {
                                                                                        $toObjectId:
                                                                                            "$$groupID"
                                                                                    }
                                                                                ]
                                                                            },
                                                                            { $eq: ["$clientCode", req.clientCode] }
                                                                        ]
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        as: "masterData"
                                                    }
                                                },
                                                { $unwind: { path: "$masterData" } },
                                                {
                                                    $project: {
                                                        code: "$masterData.code",
                                                        name: "$masterData.name",
                                                        _id: "$masterData._id"
                                                    }
                                                }
                                            ],
                                            as: "voucharGroupData"
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData.tblTaxDetails",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $lte: [
                                                            "$taxData.tblTaxDetails.effectiveDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    },
                                                    {
                                                        $gte: [
                                                            "$taxData.tblTaxDetails.validityDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    }
                                                ]
                                            },
                                            "voucharGroupData.name": voucherGroup
                                        }
                                    }
                                ], res)

                                console.log(tblTax.length);

                            }
                            else if (taxType.toUpperCase() === 'G' && sacCodeId !== null && sacCodeId !== '' && sacCodeId !== undefined, sacCodeId !== 0) {
                                tblTax = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                                    {
                                        $match: {
                                            _id: createObjectId(glId),
                                            clientCode: req.clientCode
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$tblGlTax",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    { $match: { "tblGlTax.sacId": sacCodeId } },
                                    {
                                        $lookup: {
                                            from: "tblTax",
                                            let: { taxID: "$tblGlTax.taxId" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                // Have to change this after updating old to object id like { $eq: ["_id", {$toObjectId: "$$taxID"}] }
                                                                { $eq: ["$oldId", "$$taxID"] },
                                                                {
                                                                    $in: ["$code", ['CGST', 'SGST', 'IGST', 'UGST', 'UTGST']]
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "taxData"
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMasterList",
                                            let: {
                                                oldName: "tbl_voucher_group_mst",
                                                groupID: "$tblGlTax.voucherGroupId"
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            // $eq: ["$oldName", "$$oldName"],
                                                            $and: [
                                                                { $eq: ["$clientCode", req.clientCode] },
                                                                { $eq: ["$oldName", "$$oldName"] }
                                                            ]
                                                        }
                                                    }
                                                },
                                                {
                                                    $lookup: {
                                                        from: "tblMasterData",
                                                        let: {
                                                            tabelID: { $toString: "$_id" },
                                                            groupID: "$$groupID"
                                                        },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $expr: {
                                                                        $and: [
                                                                            {
                                                                                $eq: [
                                                                                    "$tblMasterListId",
                                                                                    "$$tabelID"
                                                                                ]
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$_id",
                                                                                    {
                                                                                        $toObjectId:
                                                                                            "$$groupID"
                                                                                    }
                                                                                ]
                                                                            },
                                                                            { $eq: ["$clientCode", req.clientCode] }
                                                                        ]
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        as: "masterData"
                                                    }
                                                },
                                                { $unwind: { path: "$masterData" } },
                                                {
                                                    $project: {
                                                        code: "$masterData.code",
                                                        name: "$masterData.name",
                                                        _id: "$masterData._id"
                                                    }
                                                }
                                            ],
                                            as: "voucharGroupData"
                                        }
                                    },

                                    // {
                                    //     $lookup: {
                                    //         from: "tblMasterList",
                                    //         let: { sacId: "$tblGlTax.sacId" },
                                    //         pipeline: [
                                    //             {
                                    //                 $match: {
                                    //                     oldName: "tbl_sac_code_mst"
                                    //                 }
                                    //             },
                                    //             {
                                    //                 $lookup: {
                                    //                     from: "tblMasterData",
                                    //                     let: {
                                    //                         tableID: { $toString: "$_id" },
                                    //                         sacId: "$$sacId"
                                    //                     },
                                    //                     pipeline: [
                                    //                         {
                                    //                             $match: {
                                    //                                 $expr: {
                                    //                                     $and: [
                                    //                                         {
                                    //                                             $eq: [
                                    //                                                 "$tblMasterListId",
                                    //                                                 "$$tableID"
                                    //                                             ]
                                    //                                         },
                                    //                                         {
                                    //                                             $eq: [
                                    //                                                 "$_id",
                                    //                                                 {
                                    //                                                     $toObjectId: "$$sacId"
                                    //                                                 }
                                    //                                             ]
                                    //                                         }
                                    //                                     ]
                                    //                                 }
                                    //                             }
                                    //                         }
                                    //                     ],
                                    //                     as: "sacCode"
                                    //                 }
                                    //             },
                                    //             { $unwind: { path: "$sacCode" } },
                                    //             {
                                    //                 $project: {
                                    //                     code: "$sacCode.code",
                                    //                     name: "$sacCode.name",
                                    //                     _id: "$sacCode._id",

                                    //                 }
                                    //             }
                                    //         ],
                                    //         as: "sacCode"
                                    //     }
                                    // },

                                    {
                                        $unwind: {
                                            path: "$taxData",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData.tblTaxDetails",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },

                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $lte: [
                                                            "$taxData.tblTaxDetails.effectiveDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    },
                                                    {
                                                        $gte: [
                                                            "$taxData.tblTaxDetails.validityDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    }
                                                ]
                                            },
                                            "voucharGroupData.name": voucherGroup,
                                            // "sacCode.code": sacCodeId
                                        }
                                    }
                                ], res)
                            }
                            else if (taxType.toUpperCase() === 'G' && hsnCodeId !== null && hsnCodeId !== '' && hsnCodeId !== undefined, hsnCodeId !== 0) {
                                tblTax = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                                    {
                                        $match: {
                                            _id: createObjectId(glId),
                                            clientCode: req.clientCode,

                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$tblGlTax",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    { $match: { "tblGlTax.hsnId": hsnCodeId } },
                                    {
                                        $lookup: {
                                            from: "tblTax",
                                            let: { taxID: "$tblGlTax.taxId" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                // Have to change this after updating old to object id like { $eq: ["_id", {$toObjectId: "$$taxID"}] }
                                                                { $eq: ["$oldId", "$$taxID"] },
                                                                {
                                                                    $in: ["$code", ['CGST', 'SGST', 'IGST', 'UGST', 'UTGST']]
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "taxData"
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "tblMasterList",
                                            let: {
                                                oldName: "tbl_voucher_group_mst",
                                                groupID: "$tblGlTax.voucherGroupId"
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                { $eq: ["$oldName", "$$oldName"] },
                                                                { $eq: ["$clientCode", req.clientCode] }
                                                            ]
                                                        }
                                                    }
                                                },
                                                {
                                                    $lookup: {
                                                        from: "tblMasterData",
                                                        let: {
                                                            tabelID: { $toString: "$_id" },
                                                            groupID: "$$groupID"
                                                        },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $expr: {
                                                                        $and: [
                                                                            {
                                                                                $eq: [
                                                                                    "$tblMasterListId",
                                                                                    "$$tabelID"
                                                                                ]
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$_id",
                                                                                    { $toObjectId: "$$groupID" }
                                                                                ]
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$clientCode",
                                                                                    req.clientCode
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
                                                { $unwind: { path: "$masterData" } },
                                                {
                                                    $project: {
                                                        code: "$masterData.code",
                                                        name: "$masterData.name",
                                                        _id: "$masterData._id"
                                                    }
                                                }
                                            ],
                                            as: "voucharGroupData"
                                        }
                                    },

                                    // {
                                    //     $lookup: {
                                    //         from: "tblMasterList",
                                    //         let: { hsnId: "$tblGlTax.hsnId" },
                                    //         pipeline: [
                                    //             {
                                    //                 $match: {
                                    //                     oldName: "tbl_hsn_code_mst"
                                    //                 }
                                    //             },
                                    //             {
                                    //                 $lookup: {
                                    //                     from: "tblMasterData",
                                    //                     let: {
                                    //                         tableID: { $toString: "$_id" },
                                    //                         hsnId: "$$hsnId"
                                    //                     },
                                    //                     pipeline: [
                                    //                         {
                                    //                             $match: {
                                    //                                 $expr: {
                                    //                                     $and: [
                                    //                                         {
                                    //                                             $eq: [
                                    //                                                 "$tblMasterListId",
                                    //                                                 "$$tableID"
                                    //                                             ]
                                    //                                         },
                                    //                                         {
                                    //                                             $eq: [
                                    //                                                 "$_id",
                                    //                                                 {
                                    //                                                     $toObjectId: "$$hsnId"
                                    //                                                 }
                                    //                                             ]
                                    //                                         }
                                    //                                     ]
                                    //                                 }
                                    //                             }
                                    //                         }
                                    //                     ],
                                    //                     as: "sacCode"
                                    //                 }
                                    //             },
                                    //             { $unwind: { path: "$sacCode" } },
                                    //             {
                                    //                 $project: {
                                    //                     code: "$sacCode.code",
                                    //                     name: "$sacCode.name",
                                    //                     _id: "$sacCode._id",

                                    //                 }
                                    //             }
                                    //         ],
                                    //         as: "hsnCode"
                                    //     }
                                    // },

                                    {
                                        $unwind: {
                                            path: "$taxData",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$taxData.tblTaxDetails",
                                            includeArrayIndex: "string",
                                            preserveNullAndEmptyArrays: false
                                        }
                                    },

                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $lte: [
                                                            "$taxData.tblTaxDetails.effectiveDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    },
                                                    {
                                                        $gte: [
                                                            "$taxData.tblTaxDetails.validityDate",
                                                            { $toDate: invoiceDate }
                                                        ]
                                                    }
                                                ]
                                            },
                                            "voucharGroupData.name": voucherGroup,
                                            // "hsnCode.code": hsnCodeId
                                        }
                                    }
                                ], res)
                            }
                        }
                        tblTax = ownStateId == placeOfSupply_state ? tblTax.filter((e) => e.taxData.name == "SGST" || e.taxData.name == "CGST") : tblTax.filter((e) => e.taxData.name == "IGST")
                        let data = []
                        for (const element of tblTax) {
                            let tempObject = { taxPercentage: element.taxData.tblTaxDetails.rate, taxId: element.taxData._id, taxcatid: element.taxData.taxCategoryId, taxName: element.taxData.name, effectivedate: element.taxData.tblTaxDetails.effectiveDate, validitydate: element.taxData.tblTaxDetails.validityDate, igstflag: element.igstflag, taxDetailId: element.taxData.tblTaxDetails._id }
                            tempObject.totalAmount = totalAmount * 100 / 100
                            // tempObject.totalAmtInvCurr=totalAmtInvoiceCurr * tempObject.ratePercent / 100 
                            tempObject.taxAmountHc = totalAmount * tempObject.taxPercentage / 100
                            tempObject.taxAmountFc = totalAmount * tempObject.taxPercentage / 100
                            data.push(tempObject)
                        }

                        return res.send({ modeoftransportid, igstflag, isigstonfreight, chargeTaxApplicability, chargeTaxJobType, overseas, overseasParty, trasnportMode, voucherCode, voucherGroup, tblTax: data })



                    }
                    else {

                        res.send({
                            success: false,
                            message: "No data found",
                            data: []
                        })
                    }
                    console.log(ownStateId == placeOfSupply_state);


                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({
                        success: false,
                        message: error.message,
                        data: []
                    })
                }
            }
        })
    },
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
    },
    gettingTaxDetailsQuotation: async (req, res) => {
        try {
            // Get the glId and departmentId from the first table
            const firstTable = await model.AggregateFetchData("tblCharge", "tblCharge", [
                {
                    $match: {
                       "tblChargeDetails.glId": req.body.glId,
                        clientCode: req.clientCode,
                    }
                },
                {
                    $project: {
                        glId: { $arrayElemAt: ["$tblChargeDetails.glId", 0] },
                        departmentId: { $arrayElemAt: ["$tblChargeDetails.departmentId", 0] }
                    }
                }
            ]);

            const glId = firstTable[0]?.glId;
            const departmentId = firstTable[0]?.departmentId;

            // Get sacId from the second table
            const secondTable = await model.AggregateFetchData("tblGeneralLedger", "tblGeneralLedger", [
                {
                    $match: {
                        _id: createObjectId(glId),
                        clientCode: req.clientCode
                    }
                },
                {
                    $project: {
                        sacId: "$sacId"
                    }
                }
            ]);

            const sacId = secondTable[0]?.sacId;
            const thirdTable = await model.AggregateFetchData("tblSacHsn", "tblSacHsn", [
                {
                    $match: {
                        _id: createObjectId(sacId)
                    }
                },
                {
                    $unwind: "$tblSacHsnDetails"
                },
                {
                    $match: {
                        "tblSacHsnDetails.isChecked": true,
                        $expr: {
                            $and: [
                                { $lte: ["$tblSacHsnDetails.effectiveDate", new Date()] },
                                { $gte: ["$tblSacHsnDetails.validityDate", new Date()] }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        maxRate: { $max: "$tblSacHsnDetails.rate" },
                        taxId: { $first: "$tblSacHsnDetails.taxId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        maxRate: 1,
                        taxId: 1
                    }
                }
            ], { allowDiskUse: true });

            // Debugging output
            console.log("Third Table Result:", thirdTable);

            if (!thirdTable || thirdTable.length === 0) {
                console.log("No valid tax found or no matching records.");
                // Optional: Provide more detailed logs here
            }

            const highestTaxDetail = thirdTable[0]; // Since we grouped by null, there should be only one document

            // Prepare final response data
            const taxResponse = {
                taxId: highestTaxDetail.taxId,
                taxRate: highestTaxDetail.maxRate,
                glId: glId,
                departmentId: departmentId
            };

            return res.send({ success: true, taxDetails: taxResponse });

        } catch (error) {
            errorLogger(error, req);
            return res.status(500).send({
                success: false,
                message: error.message,
                data: []
            });
        }
    },
}