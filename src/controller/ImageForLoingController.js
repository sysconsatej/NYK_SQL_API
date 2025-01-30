const moment = require("moment");
const model = require("../models/module");
const { errorLogger } = require("../helper/loggerService");

module.exports = {
    AddImage: async (req, res) => {
        try {
            let insertData={}
            insertData.id=req.body.id||""
            insertData.status=1
            if (req.files && req.files !== null && req.files.loginPage) {
                var element = req.files.loginPage;
                var image_name = moment().format("YYYYMMDDHHmmss") + element.name;
                element.mv('./public/api/loginPage/' + image_name.trim());
                var doc_data = image_name;
                insertData.loginPage = image_name
            }
            let data=await model.updateIfAvailableElseInsert("asset", "asset", insertData,{}, res)
            if (data) {
                res.send({
                    success: true,
                    message: "Data inserted successfully....",
                    data: data
                })
            }
            else {
                res.status(500).send({
                    success: false,
                    message: "Data not inserted Successfully..."
                })
            }
        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    },
    // randomImage: async (req, res) => {
    //     try {
    //         let data = await model.AggregateFetchData("asset", "asset", [{$match:{status:Number(process.env.ACTIVE_STATUS)}},{$sample:{size:1}},{$project:{loginPage:{$concat:[process.env.BASE_URL,"/api/loginPage/","$loginPage"]}}}], res)
    //         res.send({
    //             success: true,
    //             message: "Data fetched successfully....",
    //             data: data
    //         })
    //     } catch (error) {
    //         res.status(500).send({
    //             success: false,
    //             message: "Something went wrong",
    //             data: error.message
    //         })
    //     }
    // }
    randomImage: async (req, res) => {
        try {
            let data = await model.AggregateFetchData("asset", "asset", [{$match:{status:Number(process.env.ACTIVE_STATUS)}},{
                $group: {
                  _id: null, // Grouping without a specific field to create a single group
                  loginPages: {
                    $push: {$concat:["/api/loginPage/","$loginPage"]} // Accumulates all loginPage values into an array
                  }
                }
              },
              {
                $project: {
                  _id: 0, // Excludes the _id field from the output
                  loginPages: 1 // Includes the loginPages array in the output
                }
              }], res)
            res.send({
                success: true,
                message: "Data fetched successfully....",
                data: data
            })
        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    }
}