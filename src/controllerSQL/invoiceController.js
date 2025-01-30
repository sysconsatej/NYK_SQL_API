const validate = require('../helper/validate')
const { executeQuery, executeStoredProcedure } = require("../modelSQL/model")

module.exports = {
    getInvoiceData: async (req, res) => {
        try {
             const {} = req.body
            const query = `invoice_api`;
             const parameters = {}
            let data = await executeStoredProcedure(query, parameters)
            //let data = await executeStoredProcedure(query)
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