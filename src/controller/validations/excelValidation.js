// Import the Mongoose module for MongoDB connection
const { check } = require('express-validator');
const mongoose = require('../../config/MongoConnection');

// Export the module
module.exports = {
    // Function to check for existing data
    checkExistingData: async (req, res) => {
        // Extract table name, JSON data, and fields to check from request body
        const tableName = req.body.tableName;
        const jsonData = req.body.jsonData;
        const checkFieldsForExistingData = req.body.checkFieldsForExistingData;
        try {
            // Access the MongoDB database and collection based on the provided table name
            const collection = mongoose.connection.collection(tableName); // Use the connection established by mongoose

            // Retrieve existing data from the collection where status is 1 (active)
            const existingData = await collection.find({ status: 1 }).toArray(); // Only consider data with status 1
            // Create a copy of existing data for comparison
            const existingValues = existingData.map(item => ({ ...item })); // Copy existing data
            // Initialize array to store existing data found in the database
            const existingDataInDatabase = [];

            // Loop through each JSON object provided in the request
            for (const [index, obj] of jsonData.entries()) {
                // Loop through each key in the JSON object
                for (const key in obj) {
                    // Check if the key is included in the fields to check
                    if (Object.hasOwnProperty.call(obj, key) && checkFieldsForExistingData.includes(key)) {
                        // Check if any existing data matches the current key-value pair
                        if (existingValues.some(item => item[key] === obj[key])) {
                            // If a match is found, add details to the existing data array
                            existingDataInDatabase.push({ index: index + 1, field: key, value: obj[key] });
                        }
                    }
                }
            }

            // Return the existing data found in the database
            res.status(200).json({
                success: true,
                message: 'List of Data Already Exist in Database',
                data: existingDataInDatabase,
            });
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error checking data in the MongoDB database:', error);
            // Send an error response with status code 500
            res.status(500).json({
                success: false,
                message: 'Error checking data in the MongoDB database',
                error: error.message,
            });
        }
    },
    // Function to check fieldNames
    checkFieldName: async (req, res) => {
        const tableName = req.body.tableName;
        const jsonData = req.body.jsonData;

        try {
            // Access the MongoDB database and collection based on the provided table name
            const collection = mongoose.connection.collection(tableName); // Use the connection established by mongoose

            // Get the fields present in the MongoDB collection
            const collectionFields = await collection.findOne({}); // Get a document to retrieve its keys (fields)
            const fieldNamesInDatabase = Object.keys(collectionFields);

            // Initialize array to store incorrect field names
            const incorrectFieldNames = [];

            // Loop through each JSON object provided in the request
            for (const obj of jsonData) {
                // Loop through each key in the JSON object
                for (const key in obj) {
                    // Check if the key is not present in the list of field names in the database collection
                    if (!fieldNamesInDatabase.includes(key)) {
                        // If key is not found, add it to the list of incorrect field names
                        incorrectFieldNames.push(key);
                    }
                }
            }

            // Return the list of incorrect field names
            res.status(200).json({
                success: true,
                message: "List Incorrect Field Names",
                data: incorrectFieldNames
            });

        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error checking data in the MongoDB database:', error);
            // Send an error response with status code 500
            res.status(500).json({
                success: false,
                message: 'Error checking data in the MongoDB database',
                error: error.message,
            });
        }
    },
    // Function to check Size of the values with master_schema
    checkValueSize: async (req, res) => {
        const tableName = req.body.tableName;
        const jsonData = req.body.jsonData;
    
        try {
            // Access the MongoDB database and collection for master_schema
            const masterSchemaCollection = mongoose.connection.collection('master_schema'); // Use the connection established by mongoose
            
            // Find the master schema document for the given table name
            const masterSchemaDocument = await masterSchemaCollection.findOne({ tableName });
    
            if (!masterSchemaDocument) {
                return res.status(404).json({
                    success: false,
                    message: `Master schema not found for table ${tableName}`
                });
            }
    
            // Extract field definitions from the master schema
            const fieldDefinitions = masterSchemaDocument.fields.reduce((acc, field) => {
                acc[field.fieldname] = { size: field.size, index: field.index }; // Create a dictionary of fieldname, size, and index
                return acc;
            }, {});
    
            // Initialize array to store fields with oversized values
            const oversizedFields = [];
    
            // Iterate over JSON data
            for (const [index, obj] of jsonData.entries()) {
                // Check size of each field value
                for (const key in obj) {
                    if (Object.hasOwnProperty.call(obj, key)) {
                        const fieldValue = obj[key];
                        const fieldInfo = fieldDefinitions[key];
                        if (fieldInfo && fieldValue.length > fieldInfo.size) {
                            // If size of value exceeds the defined size, add it to oversizedFields along with the index
                            oversizedFields.push({ index: index + 1, field: key, size: fieldInfo.size });
                        }
                    }
                }
            }
    
            // Return the list of fields with oversized values
            res.status(200).json({
                success: true,
                message: "List of Field's having size of values more than the size mentioned in the schema",
                data: oversizedFields
            });
    
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error checking value size in the MongoDB database:', error);
            // Send an error response with status code 500
            res.status(500).json({
                success: false,
                message: 'Error checking value size in the MongoDB database',
                error: error.message,
            });
        }
    }

};
