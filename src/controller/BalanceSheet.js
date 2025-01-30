// controllers/yourController.js
const { connectToSql, sql } = require("../config/sqlConfig");

const fetchDataByStoredProcedure = async (req, res) => {
  const { fromDate, toDate, branchId } = req.body;

  if (!fromDate || !toDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const pool = await connectToSql();

    // Pass parameters with the correct SQL data types
    const result = await pool
      .request()
      .input("fromDate", sql.VarChar(10), fromDate)
      .input("toDate", sql.VarChar(10), toDate)
      .input("branchId", sql.Int, branchId)
      .execute("tb_api");

    // Check if the result contains the expected JSON key
    const jsonKey = "JSON_F52E2B61-18A1-11d1-B105-00805F49916B";
    if (!result.recordset[0] || !result.recordset[0][jsonKey]) {
      throw new Error("Unexpected response format from stored procedure");
    }

    // Extract and parse the JSON string into a JavaScript object
    const jsonString = result.recordset[0][jsonKey];
    const parsedData = JSON.parse(jsonString);

    // Log the parsed data for debugging, if necessary
    // console.log("Parsed Data:", parsedData);

    // Send the parsed data as the response
    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Failed to execute stored procedure:", error.message);
    res.status(500).send("Failed to fetch data from MS SQL");
  }
};

module.exports = { fetchDataByStoredProcedure };
