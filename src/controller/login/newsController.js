const mongoose = require('../../config/MongoConnection');

module.exports = {
    fetchNews: async (req, res) => {
        try {
            // Extract clientCode from body parameters
            const clientCode = req.body.clientCode;

            // Check if clientCode is missing in the query parameters
            if (!clientCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing clientCode in the query parameters'
                });
            }

            // Access the collection 'tblNewsMessages' from the MongoDB connection
            const collection = mongoose.connection.collection('tblNewsMessages');

            // Fetch news data based on specified conditions
            const newsData = await collection
                .find({
                    $or: [
                        // Condition: flag is 'i', clientCode matches, and status is 1
                        { flag: 'i', clientCode: clientCode, status: 1 },
                        // Condition: flag is 'n', clientCode is null, and status is 1
                        { flag: 'n', clientCode: null, status: 1 }
                    ]
                })
                .toArray();

            // If no matching documents were found, return an error message
            if (newsData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No data matches the given clientCode and flag combination'
                });
            }

            // Return the fetched documents
            res.status(200).json({
                success: true,
                message: 'Data fetched successfully!',
                data: newsData
            });

        } catch (error) {
            // Log and return an error if fetching data fails
            console.error('Error fetching data from the MongoDB database:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching data from the MongoDB database',
                error: error.message
            });
        }
    }
};