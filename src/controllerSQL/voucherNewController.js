const validate = require('../helper/validate')
const { executeQuery, executeStoredProcedure } = require("../modelSQL/model")

module.exports = {
    getVoucherDataNew: async (req, res) => {
        try {
            const {} = req.body
            const query = `voucher_api_new`;
            const parameters = {}
            let data = await executeStoredProcedure(query, parameters)
            if (data) {
                res.send({
                    success: true,
                    message: "Data Fetched Successfully",
                    data: data,
                })
            }
            else {
                res.send({
                    success: false,
                    message: "No Data Found",
                    data: []
                })
            }

        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    }
}