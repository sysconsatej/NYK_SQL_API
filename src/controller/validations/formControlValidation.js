const mongoose = require("../../config/MongoConnection");
const { ObjectId } = require("mongodb");
const client = require("../../redis/redis_client");
const { body } = require("express-validator");

const userFindByEmail = async (email) => {
  let userKey = "userWrongPassword";
  let serializedList = await client.lrange(userKey, 0, -1);
  const userFound = serializedList.some((item) => {
    let user = JSON.parse(item);
    return user.email === email;
  });

  return userFound;
};

const isDateString = (str) => {
  return !isNaN(Date.parse(str));
};

// Function to escape special characters in the regex pattern
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

module.exports = {
  fetchData: async (req, res) => {
    const { tableName, whereCondition } = req.body;

    // Iterate through whereCondition object keys
    for (const key in whereCondition) {
      if (whereCondition.hasOwnProperty(key)) {
        // Check if the key is '_id' and the value is a string that should be converted to ObjectId
        if (key === "_id" && typeof whereCondition[key] === "string") {
          try {
            whereCondition[key] = new ObjectId(whereCondition[key]);
          } catch (error) {
            console.error("Error converting ObjectId:", error);
            return res.status(400).json({
              success: false,
              message: "Invalid ObjectId format",
              error: error.message,
            });
          }
        }
      }
    }
    try {
      const collection = mongoose.connection.collection(tableName);
      const fetchedData = await collection.find(whereCondition).toArray();
      res.status(200).json({
        success: true,
        message: "Data fetched Successfully!",
        data: fetchedData,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch data!",
        error: error.message,
      });
    }
  },
  updateActiveInactive: async (req, res) => {
    const tableName = req.body.tableName;
    const objectId = req.body.objectId; // Ensure this matches how you send data in the client's request
    try {
      const collection = mongoose.connection.collection(tableName);

      // Convert the objectId from string to ObjectId
      const _id = new ObjectId(objectId);

      // Fetch the document to check if it exists
      const document = await collection.findOne({ id: id });
      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found!",
        });
      }
      // Update the activeInactive status to null
      await collection.updateOne(
        { id: id },
        { $set: { activeInactive: null } }
      );
      // Respond with the updated document to confirm changes
      const updatedDocument = await collection.findOne({ id: id });

      // Abdullah Start

      let userKey = "userWrongPassword";
      let findUser = await userFindByEmail(document.email);
      let serializedList = await client.lrange(userKey, 0, -1);
      if (findUser) {
        const updatedList = [];
        for (let i = 0; i < serializedList.length; i++) {
          let user = JSON.parse(serializedList[i]);
          if (user.email === document.email) {
            if (user.count >= 3) {
              user.count = 0;
            }
          }
          updatedList.push(JSON.stringify(user));
        }

        await client.del(userKey);
        await client.rpush(userKey, ...updatedList);
      }
      res.status(200).json({
        success: true,
        message: "Document updated successfully!",
        data: updatedDocument,
      });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process request!",
        error: error.message,
      });
    }
  },
  updateUserInactive: async (req, res) => {
    const tableName = req.body.tableName;
    const email = req.body.email; // Ensure this matches how you send data in the client's request
    try {
      const collection = mongoose.connection.collection(tableName);

      // Fetch the document to check if it exists
      const document = await collection.findOne({ email: email });
      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Email not found!",
        });
      }
      // Update the activeInactive status to null
      await collection.updateOne(
        { email: email },
        { $set: { activeInactive: "i" } }
      );
      // Respond with the updated document to confirm changes
      const updatedDocument = await collection.findOne({ email: email });
      res.status(200).json({
        success: true,
        message: "User Inactive successfully!",
        data: updatedDocument,
      });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process request!",
        error: error.message,
      });
    }
  },
  UpdateData: async (req, res) => {
    try {
      const requests = Array.isArray(req.body) ? req.body : [req.body];
      let totalModifiedCount = 0;
      for (const request of requests) {
        const { tableName, uniqueColumn, whereCondition } = request;
        if (!tableName || !uniqueColumn || !whereCondition) {
          return res.status(400).json({
            success: false,
            message:
              "Missing required fields. Please provide tableName, uniqueColumn, and whereCondition.",
          });
        }
        const masterSchemaCollection =
          mongoose.connection.db.collection("master_schema");
        const schemaDocument = await masterSchemaCollection.findOne({
          tableName: tableName,
        });
        if (!schemaDocument || !schemaDocument.fields) {
          return res.status(404).json({
            success: false,
            message: `Schema not found or invalid for table "${tableName}".`,
          });
        }
        const schemaFields = schemaDocument.fields.map(
          (field) => field.fieldname
        );
        let updateCondition;
        for (const key in uniqueColumn) {
          if (uniqueColumn.hasOwnProperty(key)) {
            if (key === "id" || key === "_id" || schemaFields.includes(key)) {
              updateCondition = key;
              break;
            } else {
              return res.status(400).json({
                success: false,
                message: `Invalid update condition "${key}".`,
              });
            }
          }
        }
        const collection = mongoose.connection.collection(tableName);
        let filter;
        if (updateCondition === "_id") {
          filter = {
            [updateCondition]: new ObjectId(uniqueColumn[updateCondition]),
          };
        } else {
          filter = { [updateCondition]: uniqueColumn[updateCondition] };
        }
        const updateData = whereCondition;
        const result = await collection.updateMany(filter, {
          $set: updateData,
        });
        totalModifiedCount += result.modifiedCount;
      }
      if (totalModifiedCount > 0) {
        res.status(200).json({
          success: true,
          message: `${totalModifiedCount} data updated successfully!`,
        });
      } else {
        res.status(404).json({
          success: false,
          message: `No data found or not updated based on the provided update conditions.`,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update data!",
        error: error.message,
      });
    }
  },
  fetchProjectedData: async (req, res) => {
    const { tableName, whereCondition, subchildCondition, projection } =
      req.body;

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: 'tableName' is required.",
      });
    }

    const convertObjectIds = (condition) => {
      for (const key in condition) {
        if (
          key.includes("_id") &&
          typeof condition[key] === "string" &&
          ObjectId.isValid(condition[key])
        ) {
          condition[key] = new ObjectId(condition[key]);
        }
      }
    };

    const containsObjectId = (condition) => {
      for (const key in condition) {
        if (
          key.includes("_id") &&
          typeof condition[key] === "string" &&
          ObjectId.isValid(condition[key])
        ) {
          return true;
        }
      }
      return false;
    };

    const buildProjection = (proj) => {
      const project = { _id: 1 };
      const addProjectionFields = (proj, prefix = "") => {
        for (const key in proj) {
          if (proj[key] === 1) {
            project[`${prefix}${key}`] = 1;
          } else if (typeof proj[key] === "object") {
            addProjectionFields(proj[key], `${prefix}${key}.`);
          }
        }
      };
      addProjectionFields(proj);
      return project;
    };

    const generatePipeline = (
      whereCondition,
      subchildCondition,
      projection
    ) => {
      const pipeline = [];

      // Match stage for whereCondition if provided
      if (whereCondition && Object.keys(whereCondition).length > 0) {
        pipeline.push({ $match: whereCondition });
      }

      // Filtering tblCompanyBranch
      for (const key in whereCondition) {
        if (key.includes("._id")) {
          const parts = key.split(".");
          const parentField = parts[0];
          const childId = whereCondition[key];

          pipeline.push(
            { $unwind: `$${parentField}` }, // Unwind the array
            {
              $addFields: {
                [parentField]: {
                  $cond: {
                    if: { $eq: [`$${parentField}._id`, childId] },
                    then: `$${parentField}`,
                    else: null,
                  },
                },
              },
            },
            { $match: { [`${parentField}._id`]: { $ne: null } } }
          );
        }
      }

      // Filtering tblCompanyBranch.tblCompanyBranchPerson
      if (subchildCondition) {
        for (const key in subchildCondition) {
          if (key.includes("._id")) {
            const parts = key.split(".");
            const parentField = parts.slice(0, parts.length - 2).join(".");
            const subchildField = parts[parts.length - 2];
            const subchildId = subchildCondition[key];

            pipeline.push(
              { $unwind: `$${parentField}` }, // Unwind the array
              { $unwind: `$${parentField}.${subchildField}` }, // Unwind the sub-array
              {
                $addFields: {
                  [`${parentField}.${subchildField}`]: {
                    $cond: {
                      if: {
                        $eq: [
                          `$${parentField}.${subchildField}._id`,
                          subchildId,
                        ],
                      },
                      then: `$${parentField}.${subchildField}`,
                      else: null,
                    },
                  },
                },
              },
              {
                $match: {
                  [`${parentField}.${subchildField}._id`]: { $ne: null },
                },
              }
            );
          }
        }
      }

      // Adding Projection stage
      const projectionStage =
        Object.keys(projection).length > 0 ? buildProjection(projection) : null;
      if (projectionStage) {
        pipeline.push({ $project: projectionStage });
      }

      return pipeline;
    };

    try {
      const collection = mongoose.connection.collection(tableName);

      if (
        containsObjectId(whereCondition) ||
        (subchildCondition && containsObjectId(subchildCondition))
      ) {
        convertObjectIds(whereCondition);
        if (subchildCondition) {
          convertObjectIds(subchildCondition);
        }

        const pipeline = generatePipeline(
          whereCondition,
          subchildCondition,
          projection
        );
        const fetchedData = await collection.aggregate(pipeline).toArray();

        res.status(200).json({
          success: true,
          message: "Data fetched successfully!",
          data: fetchedData,
        });
      } else {
        const pipeline = generatePipeline(
          whereCondition,
          subchildCondition,
          projection
        );
        const fetchedData = await collection.aggregate(pipeline).toArray();

        res.status(200).json({
          success: true,
          message: "Data fetched successfully!",
          data: fetchedData,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch data!",
        error: error.message,
      });
    }
  },
  fetchAPIData: async (req, res) => {
    const {
      apiUrl,
      filterCondition,
      headers,
      method,
      dateCriteria,
      clientCode,
    } = req.body;

    // Validate required fields
    if (!clientCode) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: clientCode",
      });
    }

    if (!apiUrl || !filterCondition || typeof filterCondition !== "object") {
      return res.status(400).json({
        success: false,
        message:
          "Missing or incorrect required fields: apiUrl, filterCondition",
      });
    }

    // Add clientCode to the filterCondition
    filterCondition.clientCode = clientCode;

    // Prepare fetch options
    const fetchOptions = {
      method: method || "POST", // Assuming a POST request to send the filterCondition
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ filterCondition }), // Send filterCondition in the request body
    };

    try {
      const response = await fetch(apiUrl, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from API:", errorText, {
          apiUrl,
          filterCondition,
        });
        return res.status(response.status).json({
          success: false,
          message: "Failed to fetch data from external API",
          error: errorText,
        });
      }

      const responseData = await response.json();

      if (!Array.isArray(responseData.data)) {
        return res.status(400).json({
          success: false,
          message: "Fetched data is not an array",
          data: responseData,
        });
      }

      // Define the color options
      const colors = ["#A6AEBF", "#C5D3E8", "#D0E8C5", "#FFF8DE"];

      // Add the colorCode field to each object in the array
      const filteredData = responseData.data.map((item) => ({
        ...item,
        colorCode: colors[Math.floor(Math.random() * colors.length)],
      }));

      res.status(200).json({
        success: true,
        message: "Data fetched and filtered successfully!",
        length: filteredData.length,
        data: filteredData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch data!",
        error: error.message,
      });
    }
  },
  checkDuplicateData(req, res) {
    const tableName = req.body.tableName;
    const keyName = req.body.keyName;
    const keyValue = req.body.keyValue;
    const clientCode = req.body.clientCode;

    if (!tableName || !keyName || !keyValue || !clientCode) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: tableName, keyName, keyValue, clientCode",
      });
    }

    const collection = mongoose.connection.collection(tableName);

    // Escape special characters in keyValue
    const escapedKeyValue = escapeRegExp(keyValue);

    // Construct the query object with an additional clientCode field
    const query = {
      [keyName]: {
        $regex: new RegExp(`^${escapedKeyValue}$`, "i"), // Case-insensitive regex
      },
      clientCode: clientCode, // Add clientCode field
    };

    collection.findOne(query, (err, result) => {
      if (err) {
        console.error("Error during MongoDB findOne:", err.message); // Debugging line
        return res.status(500).json({
          success: false,
          message: "Error checking for duplicate data",
          error: err.message,
        });
      }

      if (result) {
        return res.status(200).json({
          success: true,
          isDataExists: true,
          message: "Data exists",
        });
      } else {
        return res.status(200).json({
          success: false,
          isDataExists: false,
          message: "Data does not exist",
        });
      }
    });
  },
  fetchCharge: async (req, res) => {
    try {
      // Extract table name, conditions, and projection from the request body
      const { tableName, whereCondition, projection } = req.body;

      // Validate that the required fields are present
      if (!tableName || !whereCondition) {
        return res.status(400).json({
          success: false,
          message: "Table name and whereCondition are required.",
        });
      }

      // Get the collection dynamically using the tableName from request
      const collection = mongoose.connection.collection(tableName);

      // Perform the MongoDB query
      const data = await collection
        .find(whereCondition, { projection })
        .toArray();

      // Send the result back to the client
      return res.status(200).json({
        success: true,
        data: data,
      });
    } catch (err) {
      console.error("Error during MongoDB query:", err.message); // Debugging line
      return res.status(500).json({
        success: false,
        message: "Error fetching data",
        error: err.message,
      });
    }
  },
};
