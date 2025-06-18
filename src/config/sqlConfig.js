const sql = require("mssql");

const sqlConfig = {
  user: process.env.SQL_DB_USER,
  password: process.env.SQL_DB_PASSWORD,
  server: process.env.SQL_SERVER_IP,
  port: 15999, // Specify the custom port here
  database: process.env.SQLDB,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

const connectToSql = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(sqlConfig);
      console.log("Connected to MS SQL successfully.".green);
    }
    return pool;
  } catch (err) {
    console.error("Error connecting to MS SQL:".green, err);
    throw err;
  }
};

module.exports = { connectToSql, sql };
