const { errorLogger } = require('../helper/loggerService');
const validate = require('../helper/validate')
const model = require("../models/module")
const moment = require('moment')
const { ObjectId } = require('mongodb');

function appendDocIdToNestedObjects(obj, search) {
    // Check if obj is an array
    if (!Array.isArray(obj)) {
        return;
    }
    let result = []

    for (const object of obj) {
        // Check and log menuName if it exists
        if (object.menuName) {
            //            // console.log(JSON.stringify(object));
        }

        // Assign null to docId
        if (search == object.docId) {
            result.push(object)
        }

        // Check if child exists and has elements before making a recursive call
        else if (object.child && object.child.length > 0) {
            let data = appendDocIdToNestedObjects(object.child, search);
            result.push(data[0])
        }
    }
    //    console.log(JSON.stringify(result));
    return result;
}
function mapDataAndAppendDocIdToNestedObjects(data, search) {
    if (!Array.isArray(data)) {
        return;
    }
    let result = []
    for (const iterator of data) {
        if (iterator.docId == search) {
            result.push(iterator)
        }
        else {
            let dataa = appendDocIdToNestedObjects(iterator.options, search)
            result.push(dataa[0])
        }
    }
    return result
}
function findItemsWithDocIds(obj, searchValues) {
    // Convert search values to a Set for efficient lookups
    const searchSet = new Set(searchValues);
    let results = [];

    // Recursive helper function
    function searchNestedObjects(nestedObj) {
        if (Array.isArray(nestedObj)) {
            for (const item of nestedObj) {
                if (searchSet.has(item.docId)) {
                    results.push(item);
                }
                // Recurse if 'child' exists and is an array
                if (item.child && Array.isArray(item.child)) {
                    searchNestedObjects(item.child);
                }
                // Also check in 'options' if it exists
                if (item.options && Array.isArray(item.options)) {
                    searchNestedObjects(item.options);
                }
            }
        }
    }

    // Start the recursive search
    searchNestedObjects(obj);
    return results;
}
function functionToSort(data) {
    if (Array.isArray(data.options) && data.options.length > 0) {
        let dataa = data.options.sort((a, b) => a.order - b.order)
        dataa.forEach(element => {
            functionToSort(element)
        })
        return dataa
    }
    if (Array.isArray(data.child) && data.child.length > 0) {
        let dataa = data.child.sort((a, b) => a.order - b.order)
        dataa.forEach(element => {
            functionToSort(element)
        })
        return dataa

    }
}



module.exports = {

    // This api is used to create menu
    addMenu: async (req, res) => {
        const validationRule = {

        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error....!",
                    data: err
                })
            } else {
                try {
                    let insertData = {}
                    insertData.id = req.body.id || ""
                    insertData.menuName = req.body.menuName
                    insertData.options = req.body.options || []
                    insertData.order = req.body.order || 0
                    if (Array.isArray(req.body.options)) {
                        insertData.options = req.body.options

                    }
                    else {
                        insertData.options = JSON.parse(req.body.options) || []
                    }
                    if (req.files && req.files.icon) {
                        //                        console.log(req.files.icon);
                        var element = req.files.icon;
                        var image_name = moment().format("YYYYMMDDHHmmss") + element.name;
                        element.mv('./public/api/images/' + image_name.trim());
                        var doc_data = image_name;
                        insertData.icon = image_name
                    }


                    // return
                    let data = await model.updateIfAvailableElseInsert("tblMenu", "tblMenu", insertData, {}, res)
                    data ? res.send({
                        success: true,
                        message: "Data inserted successfully....!",
                        data: data
                    }) : res.status(500).send({
                        success: false,
                        message: "Data not inserted successfully....!",
                        data: data
                    })

                } catch (error) {
                    errorLogger(error, req)
                    res.status(500).send({
                        success: false,
                        message: "Something went wrong....!",
                        data: error.message
                    })
                }
            }
        })
    },
    listMenu: async (req, res) => {
        try {
            let _match = { status: Number(process.env.ACTIVE_STATUS), clientCode: req.clientCode }
            let query = [
                {
                    $match: _match
                },
                {
                    $sort: {
                        order: 1,
                        menuName: 1
                    }
                },
                {
                    $project: {
                        id: 1,
                        docId: 1,
                        menuName: 1,
                        icon: { $concat: [process.env.BASE_URL, "/api/images/", "$icon"] },
                        options: 1,
                        status: 1,
                        child: "$options",
                        createdDate: 1,
                        createdBy: 1,
                        updatedDate: 1,
                        updatedBy: 1,
                        icon: 1,
                        order: 1,
                        isFormcontrol: 1,
                        componentPath: 1
                    }
                }
            ]

            let data = await model.AggregateFetchData("tblMenu", "tblMenu", query, res)
            function sortOptions(options) {
                return options.map(option => {
                    if (option.child && option.child.length > 0) {
                        option.child = sortOptions(option.child);
                    }
                    return option;
                }).sort((a, b) => a.menuName.localeCompare(b.menuName));
            }
            for (let i = 0; i < data.length; i++) {
                // console.log(JSON.stringify(sortOptions(data[i].child)));
                data[i].options = [...sortOptions(data[i].child)]
            }
            if (req.body.userName && req.body.userName !== "", req.body.userName !== "undefined" && typeof req.body.userName !== "undefined") {
                let roleMenu = await model.AggregateFetchData("tblUser", "tblUser", [{ $match: { email: req.body.userName } }], res)
                let search = []
                roleMenu.forEach(element => {
                    element.menuAccess.map((data) => {
                        search.push(data.menuID)
                    })
                })
                data = findItemsWithDocIds(data, search);

            }


            data.length > 0 ? res.send({
                success: true,
                message: "Data fetched successfully....!",
                data: data,
            }) : res.status(200).send({
                success: false,
                message: "No menu found....!",
                data: data
            })
        } catch (error) {
            errorLogger(error, req)
            res.status(500).send({
                success: false,
                message: "Something went wrong....!",
                data: error.message
            })
        }
    },
    MenuList: async (req, res) => {
        try {
          // Extract dynamic where condition from the request
          const whereCondition = req.body.whereCondition || {};
        //   //    console.log('whereCondition',whereCondition);
      
        //   // Ensure _id is an array and convert to ObjectId
          if (whereCondition._id) {
            if (!Array.isArray(whereCondition._id)) {
              whereCondition._id = [whereCondition._id];
            }
            whereCondition._id = {
              $in: whereCondition._id.map((id) => new ObjectId(id)),
            };
          }
      
          // Combine with existing conditions
          const matchCondition = {
            status: Number(process.env.ACTIVE_STATUS),
            clientCode: req.clientCode,
            menuType: { $ne: "O" },
            ...whereCondition,
          };
      
        //   console.log('matchCondition',matchCondition);
      
          // Build the aggregation pipeline with the dynamic where condition and projection
          let data = await model.AggregateFetchData(
            "tblMenu1",
            "tblMenu1",
            [
              { $match: matchCondition },
              { $sort: { order: 1, menuName: 1 } },
              //    { $project: { _id: 1, menuName: 1, order: 1, parentMenuId: 1, clientCode: 1 } } // Example projection
            ],
            res
          );
      
          let dataAll = await model.AggregateFetchData(
            "tblMenu1",
            "tblMenu1",
            [
              { $match: {} },
              { $sort: { order: 1, menuName: 1 } },
              //    { $project: { _id: 1, menuName: 1, order: 1, parentMenuId: 1, clientCode: 1 } } // Example projection
            ],
            res
          );
      
          function creatingTheNestedJSON(params, dataAll) {
            const itemMap = new Map(
              params.map((item) => [item._id.toString(), item])
            );
            const allItemsMap = new Map(
              dataAll.map((item) => [item._id.toString(), item])
            );
      
            for (const item of params) {
              item.options = item.options || [];
              item.child = item.child || [];
            }
            for (const item of dataAll) {
              item.options = item.options || [];
              item.child = item.child || [];
            }
      
            function nestItem(item) {
              if (item.parentMenuId) {
                let parent =
                  itemMap.get(item.parentMenuId.toString()) ||
                  allItemsMap.get(item.parentMenuId.toString());
      
                if (parent) {
                  parent.child = parent.child || [];
                  parent.options = parent.options || [];
      
                  if (!parent.child.includes(item)) {
                    parent.child.push(item);
                    parent.options.push(item);
                  }
      
                  itemMap.set(parent._id.toString(), parent);
      
                  nestItem(parent);
                }
              }
            }
      
            for (const item of params) {
              nestItem(item);
            }
      
            let result = [];
            for (const item of itemMap.values()) {
              if (!item.parentMenuId) {
                result.push(item);
              }
            }
      
            return result;
          }
      
          data = creatingTheNestedJSON(data, dataAll);
      
          res.send({
            success: true,
            message: "Data fetched successfully....!",
            data: data,
          });
        } catch (error) {
          res.status(500).send({
            success: false,
            message: "Something went wrong....!",
            data: error.message,
          });
        }
      } 
}