const { connectToSql } = require("../config/sqlConfig");

module.exports = {
    executeQuery: async (query, data) => {
        try {
            const pool = await connectToSql();
            const request = pool.request();
            for (const [key, value] of Object.entries(data)) {
                request.input(key, value);
            };
            const result = await request.query(query);
            return result; // Return the result set
        } catch (error) {
            console.error('Error inserting data:', error);
            throw error;
        }
    },
    executeStoredProcedure: async (procedureName, data) => {
        try {
            const pool = await connectToSql();
            const request = pool.request();
            for (const [key, value] of Object.entries(data)) {
                request.input(key, value);
            };
            const result = await request.execute(procedureName);
            
            if (result.recordsets.length == 0) {
                return [];
            }
            return JSON.parse(result.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']); // Return the result set
        } catch (error) {
            console.error('Error inserting data:', error);
            throw error;
        }
    },
    executeNonJSONStoredProcedure: async (procedureName, data) => {
        try {
            const pool = await connectToSql();
            const request = pool.request();
            for (const [key, value] of Object.entries(data)) {
                request.input(key, value);
            };
            const result = await request.execute(procedureName);
            return result; // Return the result set
        } catch (error) {
            if (error.originalError) {
                console.error('SQL Error Details:');
                console.error('Message:', error.originalError.message);
                console.error('Procedure Name:', procedureName);
                console.error('Data:', data);
            } else {
                console.error('Error Details:', error.message);
            }
            console.error('Error inserting data:', error);
            throw error;
        }
    }
}