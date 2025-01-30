const modele = require('../models/module')
const validate = require('../helper/validate')
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const connection = require('../config/MongoConnection')
const schema = require('../schema/Schema')
async function innerJoinData(voucherLedgers, generalLedgers, tbGroups, balanceSheetGroups) {
    // Start by joining voucherLedgers and generalLedgers on gl_id and gl_account
    // const ledgerGeneralLedgerJoin = voucherLedgers.map(vl => {
    //     const generalLedger = generalLedgers.find(gl => gl.gl_id === vl.gl_account);
    //     return generalLedger ? { ...vl, ...generalLedger } : null;
    // }).filter(item => item !== null); // Filter out the non-matching entries
    const tbGroupsJoin = tbGroups.map(tb => {
        const balance_sheet_group = balanceSheetGroups.find(bs => bs.balance_sheet_group_id === tb.under_group_id)
        return balance_sheet_group ? { ...tb, ...balance_sheet_group } : null
    }).filter(item => item !== null);
    // console.log(tbGroupsJoin);
    
    const general_ledger = generalLedgers.map(gl => {
        const tb_group = tbGroupsJoin.find(tb => tb.tb_group_id === gl.tb_group_id)
        return tb_group ? { ...gl, ...tb_group } : null
    }).filter(item => item !== null);
    console.log(general_ledger);
    // return

    const voucher_ledger = voucherLedgers.map(gl => {
        const voucher = general_ledger.find(vl => vl.gl_id === gl.GL_account)
        return voucher ? { ...gl, ...voucher } : null
    })
    // Next, join the result with tbGroups on tb_group_id
    // const ledgerTbGroupJoin = ledgerGeneralLedgerJoin.map(lgl => {
    //   const tbGroup = tbGroups.find(tb => tb.tb_group_id === lgl.tb_group_id);
    //   return tbGroup ? { ...lgl, ...tbGroup } : null;
    // }).filter(item => item !== null); // Filter out the non-matching entries

    // // Finally, join with balanceSheetGroups on balance_sheet_group_id
    // const completeJoin = ledgerTbGroupJoin.map(ltgl => {
    //   const balanceSheetGroup = balanceSheetGroups.find(bs => bs.balance_sheet_group_id === ltgl.under_group_id);
    //   return balanceSheetGroup ? { ...ltgl, ...balanceSheetGroup } : null;
    // }).filter(item => item !== null); // Filter out the non-matching entries

    return voucher_ledger;
}
function joinTables(balanceSheetGroups, tbGroups, generalLedgers, tbl_gl_branch, tbl_company_mst, tbl_company_branch, company_id, branch_id, p_b, tbl_gl_balance_mst, voucherdata, openbalance) {
    // Perform an inner join on balance_sheet_group_mst and tb_group_mst
    console.log(tbl_company_branch);
    tbGroups.map(e => e["Company Name"] = tbl_company_mst[0].company_name)
    //    tbGroups.forEach(element => {

    //     tbl_company_branch.forEach(element2 => {
    //         if (element.company_branch_id==element2.company_branch_id) {
    //             console.log();

    //         }
    //     });
    //    });
    const innerJoinResult = []
    tbGroups.filter(tb => {
        const balance_sheet_group = balanceSheetGroups.find(bs => bs.balance_sheet_group_id === tb.under_group_id)
        // console.log({ ...tb, ...balance_sheet_group });
        innerJoinResult.push({ ...tb, ...balance_sheet_group })
        return balance_sheet_group ? { ...tb, ...balance_sheet_group } : null

    })
    // console.log("innvere join ");
    // console.log(innerJoinResult);

    // Perform left joins on tbl_tb_group_mst with itself to resolve the hierarchy
    const leftJoinsResult = innerJoinResult.map(tb => {
        let parent = tbGroups.find(tb1 => tb1.tb_group_id === tb.parent_group_id);
        let grandparent = parent ? tbGroups.find(tb2 => tb2.tb_group_id === parent.parent_group_id) : null;
        let greatGrandparent = grandparent ? tbGroups.find(tb3 => tb3.tb_group_id === grandparent.parent_group_id) : null;
        let greatGreatGrandparent = greatGrandparent ? tbGroups.find(tb4 => tb4.tb_group_id === greatGrandparent.parent_group_id) : null;
        let greatGreatGreatGrandparent = greatGreatGrandparent ? tbGroups.find(tb5 => tb5.tb_group_id === greatGreatGrandparent.parent_group_id) : null;

        // Now create a new object that combines the tb object with its parents
        return {
            ...tb,
            parent,
            grandparent,
            greatGrandparent,
            greatGreatGrandparent,
            greatGreatGreatGrandparent
        };
    });

    // Finally, perform an inner join on the general_ledger_mst
    var finalResult = leftJoinsResult.filter(tb =>
        generalLedgers.some(gl => gl.tb_group_id === tb.tb_group_id)
    );
    finalResult = finalResult.map(gl => {
        const voucher = generalLedgers.find(vl => vl.tb_group_id === gl.tb_group_id)
        return voucher ? { ...gl, ...voucher } : null
    })
    // console.log("length befor filter");
    // console.log(finalResult.length);
    finalResult = finalResult.filter(e => tbl_gl_branch.includes(e.gl_id)).filter(e => p_b === "B" ? ["Assets", "Liability"].includes(e.balance_sheet_group_name) : ["Income", "Expense"].includes(e.balance_sheet_group_name))
    // console.log("length After filter");
    // console.log(finalResult.length);
    finalResult.map(branch => branch["Company Branch"] = tbl_company_branch.find(e => e.company_branch_id == branch.company_branch_id)["name"])
    // finalResult = finalResult.map(gl => {
    //     const Company = tbl_company_mst.find(vl => vl.company_id === gl.company_id)
    //     return Company ? { ...gl, ...Company } : null
    // })

    finalResult.map((final) => {
        if (final.balance_sheet_group_name) {
            final["Balance Sheet Group"] = final.balance_sheet_group_name
            delete final.balance_sheet_group_name
        }
        final["TB Group Name"] = final.tb_group_name


        // List of keys you want to delete


        if (final.parent) {
            final["Sub Group-1"] = final.parent.tb_group_name
            delete final.parent
        }
        else {
            final["Sub Group-1"] = null
            delete final.parent
        }
        if (final.grandparent) {
            final["Sub Group-2"] = final.grandparent.tb_group_name
            delete final.grandparent
        }
        else {
            final["Sub Group-2"] = null
            delete final.grandparent
        }
        if (final.greatGrandparent) {
            final["Sub Group-3"] = final.greatGrandparent.tb_group_name
            delete final.greatGrandparent
        }
        else {
            final["Sub Group-3"] = null
            delete final.greatGrandparent
        }
        if (final.greatGreatGrandparent) {
            final["Sub Group-4"] = final.greatGreatGrandparent.tb_group_name
            delete final.greatGreatGrandparent
        } else {
            final["Sub Group-4"] = null
            delete final.greatGreatGrandparent
        }
        if (final.greatGreatGrandparent) {
            final["Sub Group-5"] = final.greatGreatGreatGrandparent.tb_group_name
            delete final.greatGreatGreatGrandparent
        }
        else {
            final["Sub Group-5"] = null
            delete final.greatGreatGreatGrandparent
        }
        if (final.gl_desc) {
            final["Ledger Name"] = final.gl_desc
            delete final.gl_desc
        }
        openbalance == "y" ? final["Amount"] = tbl_gl_balance_mst.filter(glb => glb.gl_id === final.gl_id).reduce((sum, glb) => {
            // Sum the balance, using 0 if op_bal or op_bal_cr is null (or undefined)
            const opBal = glb.op_bal || 0;
            const opBalCr = glb.op_bal_cr || 0;
            return sum + (opBal - opBalCr);
        }, 0) : final["Amount"] = voucherdata.filter(e => e.GL_account = final.gl_id).reduce((sum, vl) => {
            // Sum the balance, using 0 if op_bal or op_bal_cr is null (or undefined)
            const opBal = vl.Debit_Amount || 0;
            const opBalCr = vl.Credit_Amount || 0;
            return sum + (opBal - opBalCr);
        }, 0);
        let keysToDelete = ["tb_group_id", "under_group_id", "parent_group_id", "fin_year_id", "company_id", "is_deleted", "parent_group", "detailed", "display_sr_no", "_id", "tb_group_code", "tb_group_name", "gl_id", "gl_code", "gl_type", "balance_sheet_group_id", "company_branch_id"];

        // Iterate over the array and delete the keys
        let myObject = final
        keysToDelete.forEach((key) => {
            delete myObject[key];
        });
    })


   

    return finalResult;
}
 async function finalUpdate(data,total,p_b) {
    data.forEach(row => {
        if (!row['TB Group Name'] && !row['Sub Group-1']) {
            row['TB Group Name'] = row['Sub Group-1'];
            row['Sub Group-1'] = row['Sub Group-2'];
            row['Sub Group-2'] = row['Sub Group-3'];
            row['Sub Group-3'] = row['Sub Group-4'];
            row['Sub Group-4'] = row['Sub Group-5'];
            row['Sub Group-5'] = row['Ledger Name'];
            row['Ledger Name'] = null;
        }
    });
    data.forEach(row => {
        if (row['Balance Sheet Group'] === 'Income') {
            row['Amount'] *= -1;
        }
    });
    let fieldsToDrop = ['Sub Group-5', 'Sub Group-4', 'Sub Group-3', 'Sub Group-2', 'Sub Group-1', 'Ledger Name'];
    fieldsToDrop.forEach(field => {
        if (data.every(row => row[field] === null || row[field] === undefined)) {
            data.forEach(row => {
                delete row[field];
            });
        }
    });
    if (p_b === 'P') {
        data.forEach(row => {
            if (row['TB Group Name']) {
                row['TB Group Name'] = ' ' + row['TB Group Name'];
            }
        });
    }
    // if (Profit.length > 0) {
        const profitLossRow = {
            'Balance Sheet Group': total < 0 ? 'Income' : 'Expense',
            'TB Group Name': total < 0 ? 'Net Loss' : 'Net Profit',
            'Amount': Math.abs(total)
        };
        data.push(profitLossRow);
    // }
    data = data.filter(row => row['Amount'] !== 0);
    return data
}








module.exports = {
    report: async (req, res) => {
        const validationRule = {
            company_id: 'required',
            branch_id: 'required',
            financial_year_id: 'required',
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
                    // Assuming `fin_year_id`, `from_date`, `to_date`, `company_id`, `company_branch_id` are provided
                    const finYearId = parseInt(req.body.financial_year_id); // Replace with actual value
                    const companyId = parseInt(req.body.company_id); // Replace with actual value
                    const companyBranchId = parseInt(req.body.branch_id); // Replace with actual value

                    // Convert `from_date` and `to_date` to JavaScript Date objects if they are strings
                    const fromDate = new Date(req.body.from_date) || null
                    const toDate = new Date(req.body.to_date) || null


                    // const includeOpBal = (startDate.getTime() === fromDate.getTime() && endDate.getTime() === toDate.getTime()) ? 'y' : 'n';
                    var includeOpBal = 'n';
                    let _matchdata = {
                        'v.is_deleted': 0,
                        'v.transaction_status': null,
                        'v.Company_id': companyId,
                        'v.Company_Branch_id': companyBranchId,
                        'v.Fin_year': finYearId,
                        'v.account_effect': 'y',
                        'bs.balance_sheet_group_name': { $in: ['Income', 'Expense'] }
                    }
                    if (req.body.from_date && req.body.from_date !== "" && req.body.from_date !== "undefined" && req.body.to_date && req.body.to_date !== "" && req.body.to_date !== "undefined") {
                        _matchdata['v.Voucher_date'] = {
                            $gte: fromDate,
                            $lte: toDate
                        }

                    }
                    else if (req.body.from_date && req.body.from_date !== "" && req.body.from_date !== "undefined") {
                        _matchdata['v.Voucher_date'] = {
                            $gte: fromDate
                        }
                    }
                    else if (req.body.to_date && req.body.to_date !== "" && req.body.to_date !== "undefined") {
                        _matchdata['v.Voucher_date'] = {
                            $lte: toDate
                        }
                    }
                    let pipeline = [
                        // {
                        //     $limit: 100,
                        // },
                        {
                            '$lookup': {
                                'from': 'tbl_voucher',
                                'localField': 'voucher_id',
                                'foreignField': 'voucher_id',
                                'as': 'v'
                            }
                        }, {
                            '$unwind': {
                                'path': '$v'
                            }
                        },
                        {
                            "$lookup": {
                                "from": 'tbl_general_ledger_mst',
                                "localField": 'GL_account',
                                "foreignField": 'gl_id',
                                "as": 'gl'
                            }
                        },
                        {
                            $lookup: {
                                from: 'tbl_tb_group_mst',
                                localField: 'gl.tb_group_id',
                                foreignField: 'tb_group_id',
                                as: 'tb'
                            }
                        },
                        {
                            $lookup: {
                                from: 'tbl_balance_sheet_group_mst',
                                localField: 'tb.under_group_id',
                                foreignField: 'balance_sheet_group_id',
                                as: 'bs'
                            }
                        },
                        {
                            $lookup: {
                                from: 'tbl_financial_year_mst',
                                pipeline: [{
                                    $match: {
                                        financial_year_id: finYearId
                                    }
                                }],
                                as: 'fineyeardata'
                            }
                        },
                        {
                            '$match': _matchdata
                        }, {
                            '$project': {
                                'Prfit_loss': {
                                    '$subtract': [
                                        '$Credit_Amount', '$Debit_Amount'
                                    ]
                                },
                                "fineyeardata": { $arrayElemAt: ['$fineyeardata', 0] },
                                'bs': '$bs',
                                'tb': '$tb',
                                'gl': '$gl',
                            }
                        }
                    ]
                    let temp = [
                        {
                            $match: {
                                is_deleted: 0,
                                transaction_status: null,
                                account_effect: "y",
                                Company_id: companyId,
                                Company_Branch_id: companyBranchId,
                                Fin_year: finYearId,
                            }
                        },
                        {
                            $lookup: {
                                from: "tbl_voucher_ledger",
                                localField: "voucher_id",
                                foreignField: "voucher_id",
                                as: "voucher_ledger"
                            }
                        },
                        { $unwind: "$voucher_ledger" },
                        {
                            $lookup: {
                                from: "tbl_general_ledger_mst",
                                localField: "voucher_ledger.GL_account",
                                foreignField: "gl_id",
                                as: "general_ledger"
                            }
                        },
                        { $unwind: "$general_ledger" },
                        {
                            $lookup: {
                                from: "tbl_tb_group_mst",
                                localField: "general_ledger.tb_group_id",
                                foreignField: "tb_group_id",
                                as: "tb_group"
                            }
                        },
                        { $unwind: "$tb_group" },
                        {
                            $lookup: {
                                from: "tbl_balance_sheet_group_mst",
                                localField: "tb_group.under_group_id",
                                foreignField: "balance_sheet_group_id",
                                as: "balance_sheet_group"
                            }
                        },
                        { $unwind: "$balance_sheet_group" },
                        {
                            $match: {
                                "balance_sheet_group.balance_sheet_group_name": { $in: ["Income", "Expense"] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: {
                                    $sum: {
                                        $subtract: [
                                            { $ifNull: ["$voucher_ledger.Credit_Amount", 0] },
                                            { $ifNull: ["$voucher_ledger.Debit_Amount", 0] }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalBalance: { $ifNull: ["$total", 0] }
                            }
                        }
                    ]
                    let Profit = await modele.AggregateFetchData('tbl_voucher', 'tbl_voucher', temp, res);
                    // let Profit = await modele.AggregateFetchData('tbl_voucher_ledger', 'tbl_voucher_ledger', pipeline, res);
                    // console.log(Profit[0].fineyeardata.start_date);
                    if (req.body.from_date && req.body.from_date !== "" && req.body.from_date !== "undefined" && req.body.to_date && req.body.to_date !== "" && req.body.to_date !== "undefined" && Profit.length > 0 && fromDate.toDateString() == new Date(Profit[0].fineyeardata.start_date).toDateString() && toDate.toDateString() == new Date(Profit[0].fineyeardata.end_date).toDateString()) {
                        includeOpBal = 'y'

                    }
                    let glid = await modele.AggregateFetchData('tbl_gl_branch', 'tbl_gl_branch', [{ $match: { "branch_id": companyBranchId > 0 ? companyBranchId.toString() : 0 } }])
                    let _matchdata_for_teptable = {
                        'is_deleted': 0,
                        // "parent_group_id":{$ne:null},
                        'gl': {
                            $elemMatch: {
                                'company_id': companyId,
                                'gl_id': { $in: glid.map((e) => e.gl_id) }
                            }
                        },

                    }
                    if (req.body.p_b && req.body.p_b !== "" && req.body.p_b !== "undefined" && req.body.p_b == "B") {
                        _matchdata_for_teptable['bs'] = {
                            $elemMatch: {
                                'balance_sheet_group_name': { $in: ['Assets', 'Liability'] }

                            }
                        }
                    }
                    if (req.body.p_b && req.body.p_b !== "" && req.body.p_b !== "undefined" && req.body.p_b == "P") {
                        _matchdata_for_teptable['bs'] = {
                            $elemMatch: {
                                'balance_sheet_group_name': { $in: ['Income', 'Expense'] }
                            }
                        }
                    }
                    let Amount
                    includeOpBal == 'y' ?
                        Amount = {
                            from: "tbl_gl_balance_mst",
                            pipeline: [
                                {
                                    $match: {
                                        company_id: companyId,
                                        company_branch_id: companyBranchId,
                                        fin_year_id: finYearId
                                    }
                                },
                                {
                                    $project: {
                                        Amount: {
                                            $subtract: ['$op_bal', '$op_bal_cr']
                                        }
                                    }
                                }
                            ],
                            as: 'vl'
                        } : Amount = {
                            from: "tbl_voucher_ledger",
                            // left:{'Debit_Amount':'$Debit_Amount','Credit_Amount':"$Credit_Amount"},
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "tbl_voucher",
                                        localField: "voucher_id",
                                        foreignField: "voucher_id",
                                        as: 'v'
                                    }
                                }
                                ,
                                {
                                    $match: {
                                        'v.is_deleted': 0,
                                        'v.transaction_status': null,
                                        'v.account_effect': 'y',
                                        'v.Company_id': companyId,
                                        'v.Company_Branch_id': companyBranchId,
                                        'v.Fin_year': finYearId
                                    }
                                },
                                {
                                    $project: {
                                        Debit_Amount: 1,
                                        Credit_Amount: 1,
                                        Amount: {
                                            $subtract: ['$Debit_Amount', "$Credit_Amount"]
                                        }
                                        // V: "$v"
                                    }
                                }
                            ],
                            as: "vl"
                        }

                    let pipeline_for_teptable = [
                        {
                            $lookup: Amount
                        },
                        {
                            $lookup: {
                                from: "tbl_balance_sheet_group_mst",
                                localField: "under_group_id",
                                foreignField: "balance_sheet_group_id",
                                as: "bs"
                            }
                        },
                        // {
                        //     $unwind:{path:'$bs'}
                        // },
                        {
                            $lookup: {
                                from: "tbl_general_ledger_mst",
                                localField: "tb_group_id",
                                foreignField: "tb_group_id",
                                as: "gl"
                            }
                        },
                        {
                            $lookup: {
                                from: "tbl_company_mst",
                                let: { companyId: "$company_id" }, // Assume you have the company_id stored somewhere or passed as parameter
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$company_id", "$$companyId"] } } }
                                ],
                                as: "c"
                            }
                        },
                        {
                            $lookup: {
                                from: "tbl_company_branch",
                                let: { companyBranchId: "$company_branch_id" }, // Assume you have the company_branch_id stored somewhere or passed as parameter
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$company_branch_id", "$$companyBranchId"] } } }
                                ],
                                as: "cb"
                            }
                        },
                        {
                            $graphLookup: {
                                from: "tbl_tb_group_mst",
                                startWith: "$parent_group_id",
                                connectFromField: "parent_group_id",
                                connectToField: "tb_group_id",
                                as: "hierarchy",
                                maxDepth: 5, // this should be set according to your maximum level depth
                                depthField: "depth"
                            }
                        },

                        {
                            $match: _matchdata_for_teptable
                        },
                        {
                            $project: {
                                "_id": 0,
                                "tb_group_id": 1,
                                "Company Name": { $arrayElemAt: ["$c.company_name", 0] },
                                "Company Branch": { $arrayElemAt: ["$cb.name", 0] },
                                // "Balance Sheet Group": "$bs.balance_sheet_group_name",
                                "Balance Sheet Group": { $arrayElemAt: ["$bs.balance_sheet_group_name", 0] },
                                "TB Group Name": {
                                    $cond: {
                                        if: { $arrayElemAt: ["$hierarchy", 5] },
                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 5] },
                                        else: {
                                            $cond: {
                                                if: { $arrayElemAt: ["$hierarchy", 4] },
                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 4] },
                                                else: {
                                                    $cond: {
                                                        if: { $arrayElemAt: ["$hierarchy", 3] },
                                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 3] },
                                                        else: {
                                                            $cond: {
                                                                if: { $arrayElemAt: ["$hierarchy", 2] },
                                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 2] },
                                                                else: {
                                                                    $cond: {
                                                                        if: { $arrayElemAt: ["$hierarchy", 1] },
                                                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 1] },
                                                                        else: {
                                                                            $cond: {
                                                                                if: { $arrayElemAt: ["$hierarchy", 0] },
                                                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 0] },
                                                                                else: null
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "Sub Group-1": {
                                    $cond: {
                                        if: { $arrayElemAt: ["$hierarchy", 4] },
                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 4] },
                                        else: {
                                            $cond: {
                                                if: { $arrayElemAt: ["$hierarchy", 3] },
                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 3] },
                                                else: {
                                                    $cond: {
                                                        if: { $arrayElemAt: ["$hierarchy", 2] },
                                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 2] },
                                                        else: {
                                                            $cond: {
                                                                if: { $arrayElemAt: ["$hierarchy", 1] },
                                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 1] },
                                                                else: {
                                                                    $cond: {
                                                                        if: { $arrayElemAt: ["$hierarchy", 0] },
                                                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 0] },
                                                                        else: null
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }


                                },
                                "Sub Group-2": {
                                    $cond: {
                                        if: { $arrayElemAt: ["$hierarchy", 3] },
                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 3] },
                                        else: {
                                            $cond: {
                                                if: { $arrayElemAt: ["$hierarchy", 2] },
                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 2] },
                                                else: {
                                                    $cond: {
                                                        if: { $arrayElemAt: ["$hierarchy", 1] },
                                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 1] },
                                                        else: {
                                                            $cond: {
                                                                if: { $arrayElemAt: ["$hierarchy", 0] },
                                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 0] },
                                                                else: null
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "Sub Group-3": {
                                    $cond: {
                                        if: { $arrayElemAt: ["$hierarchy", 2] },
                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 2] },
                                        else: {
                                            $cond: {
                                                if: { $arrayElemAt: ["$hierarchy", 1] },
                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 1] },
                                                else: {
                                                    $cond: {
                                                        if: { $arrayElemAt: ["$hierarchy", 0] },
                                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 0] },
                                                        else: null
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "Sub Group-4": {
                                    $cond: {
                                        if: { $arrayElemAt: ["$hierarchy", 1] },
                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 1] },
                                        else: {
                                            $cond: {
                                                if: { $arrayElemAt: ["$hierarchy", 0] },
                                                then: { $arrayElemAt: ["$hierarchy.tb_group_name", 0] },
                                                else: null
                                            }
                                        }
                                    }
                                },
                                "Sub Group-5": {
                                    $cond: {
                                        if: { $arrayElemAt: ["$hierarchy", 0] },
                                        then: { $arrayElemAt: ["$hierarchy.tb_group_name", 0] },
                                        else: null
                                    }
                                },
                                "Ledger Name": {
                                    $substrCP: [{ $arrayElemAt: ["$gl.gl_desc", 0] }, 0, 30] // Using $substrCP for UTF-8 string code points
                                },
                                "Amount": { $arrayElemAt: ['$vl.Amount', 0] }

                                // "Amount": "5000"
                                // Here you would add the logic to calculate the 'Amount' based on your conditions

                                // ... More fields as needed
                            }
                        },
                        // ... Potentially more stages for filtering, grouping, or additional calculations
                    ]
                    let data = await modele.AggregateFetchData('tbl_tb_group_mst', 'tbl_tb_group_mst', pipeline_for_teptable, res);
                    //  let data=[]
                    data.forEach(row => {
                        if (!row['TB Group Name'] && !row['Sub Group-1']) {
                            row['TB Group Name'] = row['Sub Group-1'];
                            row['Sub Group-1'] = row['Sub Group-2'];
                            row['Sub Group-2'] = row['Sub Group-3'];
                            row['Sub Group-3'] = row['Sub Group-4'];
                            row['Sub Group-4'] = row['Sub Group-5'];
                            row['Sub Group-5'] = row['Ledger Name'];
                            row['Ledger Name'] = null;
                        }
                    });
                    data.forEach(row => {
                        if (row['Balance Sheet Group'] === 'Income') {
                            row['Amount'] *= -1;
                        }
                    });
                    let fieldsToDrop = ['Sub Group-5', 'Sub Group-4', 'Sub Group-3', 'Sub Group-2', 'Sub Group-1', 'Ledger Name'];
                    fieldsToDrop.forEach(field => {
                        if (data.every(row => row[field] === null || row[field] === undefined)) {
                            data.forEach(row => {
                                delete row[field];
                            });
                        }
                    });
                    if (req.body.p_b === 'P') {
                        data.forEach(row => {
                            if (row['TB Group Name']) {
                                row['TB Group Name'] = ' ' + row['TB Group Name'];
                            }
                        });
                    }
                    if (Profit.length > 0) {
                        const profitLossRow = {
                            'Balance Sheet Group': Profit[0].totalBalance < 0 ? 'Income' : 'Expense',
                            'TB Group Name': Profit[0].totalBalance < 0 ? 'Net Loss' : 'Net Profit',
                            'Amount': Math.abs(Profit[0].totalBalance)
                        };
                        data.push(profitLossRow);
                    }
                    data = data.filter(row => row['Amount'] !== 0);
                    res.status(200).send({
                        success: true,
                        message: "Data fetched successfully",
                        // data: Profit,
                        result: data
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
    },
    list: async (req, res) => {
        try {
            // var _matchdata = { is_deleted: 0 }
            console.log(req.body.id);
            // let id = req.body.id
            // console.log(id);
            // id ? _matchdata.balance_sheet_group_id = Number(id) : ""

            let query = [
                {
                    $match: { is_deleted: 0 }
                },
                // {
                //     $limit:10000
                // }
            ]
            const finYearId = parseInt(req.body.financial_year_id); // Replace with actual value
            const companyId = parseInt(req.body.company_id); // Replace with actual value
            const companyBranchId = parseInt(req.body.branch_id); // Replace with actual value

            // Convert `from_date` and `to_date` to JavaScript Date objects if they are strings
            const fromDate = new Date(req.body.from_date) || null
            const toDate = new Date(req.body.to_date) || null
            var includeOpBal = 'n';
            let _matchdata = {
                'is_deleted': 0,
                'transaction_status': null,
                'Company_id': companyId,
                'Company_Branch_id': companyBranchId,
                'Fin_year': finYearId,
                'account_effect': 'y',
                // 'bs.balance_sheet_group_name': { $in: ['Income', 'Expense'] }
            }
            if (req.body.from_date && req.body.from_date !== "" && req.body.from_date !== "undefined" && req.body.to_date && req.body.to_date !== "" && req.body.to_date !== "undefined") {
                _matchdata['Voucher_date'] = {
                    $gte: fromDate,
                    $lte: toDate
                }

            }
            else if (req.body.from_date && req.body.from_date !== "" && req.body.from_date !== "undefined") {
                _matchdata['Voucher_date'] = {
                    $gte: fromDate
                }
            }
            else if (req.body.to_date && req.body.to_date !== "" && req.body.to_date !== "undefined") {
                _matchdata['Voucher_date'] = {
                    $lte: toDate
                }
            }
            let tbl_tb_group_mst = await modele.AggregateFetchData('tbl_tb_group_mst', 'tbl_tb_group_mst', [{ $match: { is_deleted: 0, company_id: companyId } }], res)
            let tbl_balance_sheet_group_mst = await modele.AggregateFetchData('tbl_balance_sheet_group_mst', 'tbl_balance_sheet_group_mst', query, res)
            let tbl_company_mst = await modele.AggregateFetchData('tbl_company_mst', 'tbl_company_mst', [{ $match: { is_deleted: 0, company_id: companyId } }], res)
            let tbl_company_branch = await modele.AggregateFetchData('tbl_company_branch', 'tbl_company_branch', [{ $match: { company_id: companyId } }], res)
            let tbl_financial_year_mst = await modele.AggregateFetchData('tbl_financial_year_mst', 'tbl_financial_year_mst', [{$match:{financial_year_id:finYearId}}], res)
            let tbl_general_ledger_mst = await modele.AggregateFetchData('tbl_general_ledger_mst', 'tbl_general_ledger_mst', query, res)
            let tbl_gl_balance_mst = await modele.AggregateFetchData('tbl_gl_balance_mst', 'tbl_gl_balance_mst', [{ $match: { is_deleted: 0, fin_year_id: finYearId, company_id: companyId, company_branch_id: companyBranchId } }], res)
            let tbl_gl_branch = await modele.AggregateFetchData('tbl_gl_branch', 'tbl_gl_branch', [{ $match: { branch_id: companyBranchId.toString() } }], res)
            let tbl_voucher = await modele.AggregateFetchData('tbl_voucher', 'tbl_voucher', [{ $match: _matchdata }], res)
            let voucher_id = new Set(tbl_voucher.map(item => item.voucher_id))
            let tbl_voucher_ledger = await modele.AggregateFetchData('tbl_voucher_ledger', 'tbl_voucher_ledger', [{ $match: { voucher_id: { $in: Array.from(voucher_id) } } }], res)
            if (req.body.from_date && req.body.from_date !== "" && req.body.from_date !== "undefined" && req.body.to_date && req.body.to_date !== "" && req.body.to_date !== "undefined" && tbl_financial_year_mst.length > 0 && fromDate.toDateString() == new Date(tbl_financial_year_mst[0].start_date).toDateString() && toDate.toDateString() == new Date(tbl_financial_year_mst[0].end_date).toDateString()) {
                includeOpBal = 'y'

            }
            console.log(fromDate.toDateString());
            console.log(new Date(tbl_financial_year_mst[0].start_date).toDateString());
            console.log(includeOpBal);
            console.log(tbl_voucher_ledger.length);
            console.log(tbl_tb_group_mst.length);
            let result = await innerJoinData(tbl_voucher_ledger, tbl_general_ledger_mst, tbl_tb_group_mst, tbl_balance_sheet_group_mst)
            console.log(result);
                // return
            let result_temp = result.filter(e => e.balance_sheet_group_id == 3 || e.balance_sheet_group_id == 4)
            let total = 0;
            let Amount=result_temp.reduce((sum, vl) => {
                return
                // Sum the balance, using 0 if op_bal or op_bal_cr is null (or undefined)
                const opBal = vl.Credit_Amount || 0;
                const opBalCr = vl.Debit_Amount || 0;
                return sum + (opBal - opBalCr);
            }, 0);
            console.log("Ammount");
            console.log(Amount);
            result_temp.forEach((document) => {
                const creditAmount = document.Credit_Amount || 0;
                const debitAmount = document.Debit_Amount || 0;
                total += creditAmount - debitAmount;
            });
            let gl_id = new Set(tbl_gl_branch.map(item => item.gl_id))
            console.log(Array.from(gl_id));
            let  data = joinTables(tbl_balance_sheet_group_mst, tbl_tb_group_mst, tbl_general_ledger_mst, Array.from(gl_id), tbl_company_mst, tbl_company_branch, companyId, companyBranchId, req.body.p_b, tbl_gl_balance_mst, result, includeOpBal);
            data.forEach(row => {
                if (!row['TB Group Name'] && !row['Sub Group-1']) {
                    row['TB Group Name'] = row['Sub Group-1'];
                    row['Sub Group-1'] = row['Sub Group-2'];
                    row['Sub Group-2'] = row['Sub Group-3'];
                    row['Sub Group-3'] = row['Sub Group-4'];
                    row['Sub Group-4'] = row['Sub Group-5'];
                    row['Sub Group-5'] = row['Ledger Name'];
                    row['Ledger Name'] = null;
                }
            });
            data.forEach(row => {
                if (row['Balance Sheet Group'] === 'Income') {
                    row['Amount'] *= -1;
                }
            });
            if (req.body.p_b === 'P') {
                data.forEach(row => {
                    if (row['TB Group Name']) {
                        row['TB Group Name'] = ' ' + row['TB Group Name'];
                    }
                });
                const profitLossRow = {
                    'Balance Sheet Group': total < 0 ? 'Income' : 'Expense',
                    'TB Group Name': total < 0 ? 'Net Loss' : 'Net Profit',
                    'Amount': Math.abs(total)
                };
                console.log(profitLossRow);
                data.push(profitLossRow);
            }
            else{
                const profitLossRow = {
                    'Balance Sheet Group': total < 0 ? 'Assets' : 'Liability',
                    'TB Group Name': total < 0 ? 'Loss Carried Forward' : 'Profit Carried Forward',
                    'Amount': Math.abs(total)
                };
                console.log(profitLossRow);
                data.push(profitLossRow);
            }
            data = data.filter(row => row['Amount'] !== 0);
            let cleanedArray = data.map(obj => {
                return Object.entries(obj).reduce((acc, [key, value]) => {
                  if (value !== null) {
                    acc[key] = value;
                  }
                  return acc;
                }, {});
              });
            // if (Profit.length > 0) {
                
            // }
           

            res.send({
                success: true,
                message: "list fetched",
                // data: total,
                result: cleanedArray,
            })
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "something went wrong",
                data: error.message
            })
        }
    }
}




