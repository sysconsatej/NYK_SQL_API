const validate = require('../helper/validate')
const { executeQuery, executeStoredProcedure } = require("../modelSQL/model")

module.exports = {
    getVoucherAckData: [
        async (req, res) => {
            try {
                // Convert request body to JSON string
                const requestData = JSON.stringify(req.body);

                if (!requestData || requestData === "[]") {
                    return res.status(400).send({
                        success: false,
                        message: "Invalid request data. Expected a non-empty array.",
                    });
                }

                // Correct way to call stored procedure
                const query = `read_voucher_ack_api`; // Just the procedure name
                const parameters = { jsonData: requestData }; // Pass parameters correctly

                let data = await executeStoredProcedure(query, parameters); // Function must handle execution

                res.send({
                    success: true,
                    message: "Data Processed Successfully",
                    data: data,
                });

            } catch (error) {
                console.error("Error in getVoucherAckData:", error);
                res.status(500).send({
                    success: false,
                    message: "Something went wrong",
                    error: error.message
                });
            }
        }
    ]
};

