const { errorLogger } = require('../helper/loggerService')
const validate = require('../helper/validate')
const model = require("../models/module")

module.exports = {

    
    addRole: async (req, res) => {
        
        const validationRule={
            "roleName": "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error....!",
                    data: err
                })
            }
            else{
               
                try {
                    let insertData={}
                    insertData.id = req.body.id || ""
                    insertData.roleName = req.body.roleName
                    insertData.status = process.env.ACTIVE_STATUS
                    insertData.menuAccess=req.body.menuAccess||[]
//                    console.log("insertData..........");
//                    console.log(insertData);
                    let isValidate = await model.validateBeforeSubmit(req.body); // check custom validation
                    if(isValidate.validation){
                         //change spelling of Update_If_Available_Else_Insert

                         // chnage function name available
                        let data = await model.updateIfAvailableElseInsert("tblRole", "tblRole", insertData,{}, res)
                        data ? res.send({
                            success: true,
                            message: "Data inserted successfully....!",
                            data: data
                        }) : res.status(500).send({
                            success: false,
                            message: "Data not inserted Successfully...",
                            data: data
                        })
                    }
                    else{
                        // validation failed logic and msg
                        res.status(500).send({
                            success: false,
                            message: isValidate.msg,
                            data: data
                        })
                    }
                   

                } catch (error) {
                    // Log the error to MongoDB using ErrorModel
                    errorLogger(error, req)
                    res.status(500).send({
                        success: false,
                        message: "Something went wrong....!",
                        data: error.message
                    })
                }
            }
        })
    },
    lisRole: async (req, res) => {
        try {
            let _match = { status: Number(process.env.ACTIVE_STATUS) }
           
            if (req.query.id && req.query.id!==""&&req.query.id!=="undefined" && typeof req.query.id!=="undefined") {
                _match.id = Number(req.query.id)
                
            }
            let query = [
                {
                    $match: _match
                }
            ]
//            console.log(typeof req.query.id);
            let data = await model.AggregateFetchData("tblRole", "tblRole",query, res)
            data ? res.send({
                success: true,
                message: "Data fetched successfully....!",
                data: data
            }) : res.status(500).send({
                success: false,
                message: "Data not fetched Successfully...",
                data: data
            })
        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "Something went wrong....!",
                data: error.message
            })
        }
    }
}