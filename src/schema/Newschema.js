const { bgYellow } = require('colors');
const mongoose = require('mongoose');
const fieldSchema = new mongoose.Schema({
  fieldname: { type: String, required: false, default: null },
  defaultValue: mongoose.Schema.Types.Mixed,
  status: { type: Number, required: false, default: 1 },
  isRequired: Boolean,
  type: { type: String, required: false, default: null },
  size: { type: Number, required: false, default: null },
  referenceTable: { type: String, required: false, default: null },
});
const childSchema = new mongoose.Schema({
  tableName: { type: String, required: false, default: null },
  fields: [fieldSchema],
  subChild: [{
    tableName: { type: String, required: false, default: null },
    fields: [fieldSchema],
  }],
});
const optionSchema = new mongoose.Schema({
  menuName: { type: String, required: false, default: null },
  order: { type: Number, required: false, default: 0 },
  child: [{ type: mongoose.Schema.Types.Mixed }], // Allows for recursive nesting
  docId: { type: String, required: false, default: null, index: 'text' },
});
const model = require("../models/module");
const moment = require('moment');

// Use the schema within itself for recursive nesting
optionSchema.add({ child: [optionSchema] });

function appendDocIdToNestedObjects(obj) {
  // Check if obj is an array
  if (!Array.isArray(obj)) {
    return;
  }

  for (const object of obj) {
    // Check and log menuName if it exists
    if (object.menuName) {
      //      console.log(object.menuName);
    }

    // Assign null to docId
    object.docId = object._id.toString();

    // Check if child exists and has elements before making a recursive call
    if (object.child && object.child.length > 0) {
      appendDocIdToNestedObjects(object.child);
    }
  }
  return obj;
}
async function fetchDataForDropdown(dropdownData, model, res) {
  let dropdownMatch = { status: 1 };
  // if (dropdownData.controlDefaultValue !== null && dropdownData.referenceTable.split('.').length > 1) {
  //   dropdownMatch[`${dropdownData.referenceColumn.replace("$","")}`] = dropdownData.controlDefaultValue

  // }
  // else if (dropdownData.controlDefaultValue !== null) {
  //   dropdownMatch[dropdownData.referenceColumn] = dropdownData.controlDefaultValue
  // }
  //  console.log(dropdownMatch);
  if (typeof dropdownData.controlDefaultValue !== "undefined" && dropdownData.controlDefaultValue !== null && dropdownData.controlDefaultValue !== "") {
    //    console.log(fixJsonLikeString(dropdownData.controlDefaultValue));
    // let temp = JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"'));
    let temp = JSON.parse(fixJsonLikeString(dropdownData.controlDefaultValue));
    //    console.log(typeof temp);
    Object.assign(dropdownMatch, temp);
    //    console.log(dropdownMatch);
  }
  //  //    dropdownData.dropdownFilter!==null&&console.log("DropdownFilter",JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"')));
  let dropdownQuery = [{ $match: dropdownMatch }];

  let referenceTable = dropdownData.referenceTable !== null ? dropdownData.referenceTable.split('.') : [];
  for (let i = 1; i < referenceTable.length; i++) {
    let path = referenceTable.slice(1, i + 1).join('.');
    dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });
  }

  if (dropdownData.referenceColumn) {
    const keys = dropdownData.referenceColumn.split(',');
    const regex = /[\s\W]/;
    const fieldsToConcat = keys.map(key => regex.test(key) ? `${key}` : `$${key.trim()}`);
    dropdownQuery.push({
      $project: {
        value: referenceTable.length == 1 ? "$_id" : `$${referenceTable.slice(1).join('.')}._id`,
        oldId: referenceTable.length == 1 ? "$oldId" : `$${referenceTable.slice(1).join('.')}.oldId`,
        label: { $concat: fieldsToConcat }
      }
    });
  }

  return await model.AggregateFetchData(referenceTable[0], dropdownData.referenceTable, dropdownQuery, res);
}
// function fixJsonLikeString(str) {
//   // First, ensure that colons have spaces after them for consistency in the regex match
//   str = str.replace(/:/g, ': ');

//   // Add quotes to keys (including those with periods) and values that are missing them
//   str = str.replace(/([{\s,])(\w+(\.\w+)*)\s*:\s*(\w+)/g, '$1"$2": "$4"');

//   // Check if there are nested objects with improperly formatted JSON and fix them
//   const nestedObjectRegex = /"(\w+(\.\w+)*)":\s*"{([^}]+)}"/;
//   let match = nestedObjectRegex.exec(str);

//   while (match) {
//     // For the matched nested object, recursively fix its string
//     const fixedNestedObject = fixJsonLikeString(`{${match[3]}}`);
//     // Replace the matched string with the fixed nested object
//     str = str.replace(nestedObjectRegex, `"$1": ${fixedNestedObject}`);
//     // Search for the next nested object
//     match = nestedObjectRegex.exec(str);
//   }

//   return str;
// }
function fixJsonLikeString(str) {
  // Normalize colons by ensuring there's a space after them
  str = str?.replace(/:\s*/g, ': ');

  // Add quotes to keys and values, supporting spaces in values
  // This matches a key (with optional periods), followed by a colon, then captures everything until a comma or closing brace
  str = str?.replace(/([{\s,])(\w+(\.\w+)?)(\s*:\s*)([^,}]+)/g, function (match, p1, p2, p3, p4, p5) {
    // Add quotes around the key
    let key = `"${p2.trim()}"`;
    // Add quotes around the value if not already quoted, and trim spaces
    let value = p5.trim().startsWith('"') ? p5.trim() : `"${p5.trim()}"`;
    return `${p1}${key}${p4}${value}`;
  });

  // Handle nested objects recursively
  const nestedObjectRegex = /"(\w+(\.\w+)*)":\s*"{([^}]+)}"/;
  let match = nestedObjectRegex.exec(str);

  while (match) {
    const fixedNestedObject = fixJsonLikeString(`{${match[3]}}`);
    str = str.replace(nestedObjectRegex, `"$1": ${fixedNestedObject}`);
    match = nestedObjectRegex.exec(str);
  }

  return str;
}


async function processFields(fields, model, next) {
  for (let field of fields) {
    if (field.controlname.toLowerCase() === "dropdown" && field.controlDefaultValue !== null && typeof field.controlDefaultValue !== "object") {
      const datadafind = await fetchDataForDropdown(field, model, "res");
      if (datadafind.length == 0) {
        next(new Error(`Field ${field.controlDefaultValue} not found in reference table of ${field.fieldname}`));
        return; // Stop processing further fields after error
      }
    }
  }
}
async function processAggregateFields(fields, model) {
  for (const field of fields) {
    if (["date.now()", "Date.now()", "date.now", "Date.now"].includes(field.controlDefaultValue)) {
      field.controlDefaultValue = moment().format("YYYY-MM-DD");
    }

    if (field.controlname.toLowerCase() === "dropdown" && field.controlDefaultValue !== null && typeof field.controlDefaultValue !== "object") {
      const datadafind = await fetchDataForDropdown(field, model, "res");
      if (datadafind.length > 0) {
        field.controlDefaultValue = datadafind[0];
      }
    }
  }
}


module.exports = {

  any: new mongoose.Schema({ id: Number }, { strict: false }).set("autoIndex", true),
  // Create the Log model using the logSchema

  //tbl audit_trail
  tblAuditLog: new mongoose.Schema({
    // Defines the table or collection name related to the log
    tableName: {
      type: String,
      required: true
    },
    // An array to store the state of the fields before the update
    previousField: {
      type: Object,
      of: mongoose.Schema.Types.Mixed,
    },
    // An array to store the state of the fields after the update
    updateFields: {
      type: Object,
      of: mongoose.Schema.Types.Mixed,
    },
    previousFieldsForReport: {
      type: Object,
      of: mongoose.Schema.Types.Mixed,
    },
    updatedValuesForReport: {
      type: Object,
      of: mongoose.Schema.Types.Mixed,
    },
    isDelete: {
      type: Number
    },

    // IP address from which the action was performed
    ipAddress: {
      type: String,
      required: false
    },
    // Type of action performed (e.g., 'update', 'delete')
    action: {
      type: String,
      required: true,
      enum: ['insert', 'update', 'delete', 'add', 'insertMany', 'findOneAndUpdate'] // Restrict to these actions
    },
    // Timestamp of when the log was created
    createdDate: { type: Date, required: false, default: new Date() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: new Date() },
    updatedBy: { type: String, required: false, default: null },
    clientCode: { type: String, required: false, default: null },
    companyId: { type: String, required: false, default: null },
    brachId: { type: String, required: false, default: null },
    defaultFinYearId: { type: String, required: false, default: null },
    AuditKey: { type: String, required: false, default: null },
    AuditValue: { type: String, required: false, default: null },

    // ID of the document that was changed Primary key of the document/row that was updated
    documentId: {
      type: Number,
      required: false
    },
    // Additional fields as needed
  }),
  //Log: mongoose.model('Log', logSchema),
  // Define logSchema

  tblQuotation: new mongoose.Schema({
    id: { type: String, required: true, default: 0 },
    name: { type: String, required: false, default: null },
    yourlabel: { type: String, required: false, default: null },
    controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
    isControlShow: { type: Boolean, default: true },// to show and hide the control
    referenceTable: { type: String, required: false, default: null },
    fields: [{}],

    status: { type: Number, required: false, default: 1 },
  }),
  tblBooking: new mongoose.Schema({
    // _id: { type: String, required: true },
    name: { type: String, required: false, default: null },
    yourlabel: { type: String, required: false, default: null },
    controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
    quotationid: { type: String, default: true },// to show and hide the control
    referenceTable: { type: String, required: false, default: null },
    fields: [{}],

    status: { type: Number, required: false, default: 1 },
  }),



  mainTableSchema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    tableName: { type: String, required: true },
    menuID: { type: String, required: false, default: null },
    status: { type: Number, required: false, default: 1 },
    isCopyForSameTable: { type: Boolean, required: false, default: false },// to Copy data Form same table to display Copy incon on display search
    isNoGenerate: { type: Boolean, required: false, default: false },
    isRequiredAttachment: { type: Boolean, required: false, default: false },
    functionOnLoad: { type: String, required: false, default: null },
    functionOnSubmit: { type: String, required: false, default: null },
    functionOnEdit: { type: String, required: false, default: null },
    functionOnDelete: { type: String, required: false, default: null },
    viewId: { type: String, required: false, default: null },// Which view is to be displayed
    viewFilterField: { type: String, required: false, default: null },
    searchArray: [
      {
        searchFieldName: { type: String, required: false, default: null },
        searchOperator: { type: String, required: false, default: null },
        searchFieldValue: { type: String, required: false, default: null },
        searchTable: { type: String, required: false, default: null },
      }
    ],
    // gridView: Number,
    buttons: [{
      name: { type: String, required: false, default: null },
      functionOnClick: { type: String, required: false, default: null },
      iconName: { type: String, required: false, default: null },
      type: { type: String, required: false, default: null },
    }],
    viewFields: [{
      fieldname: { type: String, required: false, default: null },
      yourlabel: { type: String, required: false, default: null },
      keyToShowOnGrid: { type: String, required: false, default: null },// key to show on grid
      isDummy: { type: Boolean, default: false },// to identify the dummy field for the calculations if is dummy is true then fieldname is to define on which the calculation is to be done
      ordering: { type: Number, required: false, default: null },
      toolTipMessage: { type: String, required: false, default: null },// tooltip message for the control
    }],// Array of the View Fields
    fields: [{
      fieldname: { type: String, required: false, default: null },
      yourlabel: { type: String, required: false, default: null },
      controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
      isControlShow: { type: Boolean, default: true },// to show and hide the control
      // To DO code has to be changed 
      isGridView: { type: Boolean, default: false },
      isDataFlow: { type: Boolean, default: false },
      copyMappingName: { type: String, required: false, default: null },
      isCommaSeparatedOrCount: { type: String, enum: ["comma", "count"], default: null },
      isAuditLog: { type: Boolean, default: false },
      keyToShowOnGrid: { type: String, required: false, default: null },// key to show on grid
      isDummy: { type: Boolean, default: false },// to identify the dummy field for the calculations if is dummy is true then fieldname is to define on which the calculation is to be done
      dropDownValues: [{ id: String, value: String }],//for small  drowpdown values to avoiding creating masters // change the code accordaingly
      referenceTable: { type: String, required: false, default: null, },
      referenceView: { type: String, required: false, default: null },
      referenceColumn: { type: String, required: false, default: null },// have to check the combination of keys 
      type: { type: mongoose.Schema.Types.Mixed, required: false, default: null },// Data type like number, string, decimal etc,
      size: { type: Number, required: false, default: null },//size of the control to accept the values
      ordering: { type: Number, required: false, default: null },
      toolTipMessage: { type: String, required: false, default: null },// tooltip message for the control
      isRequired: { type: Boolean, default: false },
      isEditable: { type: Boolean, default: true },
      isSwitchToText: { type: Boolean, default: false },
      isBreak: { type: Boolean, default: false },
      dropdownFilter: { type: String, required: false, default: null },// filter condition for dropdown like by default filter city of india {}
      controlDefaultValue: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
      functionOnChange: { type: String, required: false, default: null },
      functionOnBlur: { type: String, required: false, default: null },
      functionOnKeyPress: { type: String, required: false, default: null },
      sectionHeader: { type: String, required: false, default: null },// Short by this keys to drow the screem
      sectionOrder: { type: Number, required: false, default: null },// Short by this keys to drow the screem
      isCopy: { type: Boolean, default: false },// to fields to be copied
      isCopyEditable: { type: Boolean, default: true },// to fields to be copied,
      position: { type: String, required: false, default: "top" },

    }],
    child: [{
      tableName: { type: String, required: true },
      isChildCopy: { type: Boolean, default: true },// to Identifi is child to be copied of not
      childHeading: { type: String, required: false, default: null },
      childOrder: { type: Number, required: false, default: 0 },
      functionOnSubmit: { type: String, required: false, default: null },
      functionOnDelete: { type: String, required: false, default: null },
      isAddFunctionality: { type: Boolean, default: true },// to identify if the child table is to be added
      isDeleteFunctionality: { type: Boolean, default: true },// to identify if the child table is to be deleted
      isCopyFunctionality: { type: Boolean, default: true },// to identify if the child table is to be copied
      isHideGrid: { type: Boolean, default: false },// to identify if the child table grid to be hide or not
      isHideGridHeader: { type: Boolean, default: false },// to identify if the child table grid headers to be hide or not
      isGridExpandOnLoad: { type: Boolean, default: false },// to identify if the child table is to be on load expanded
      fields: [{
        fieldname: { type: String, required: false, default: null },
        yourlabel: { type: String, required: false, default: null },
        controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
        isControlShow: { type: Boolean, default: true },// to show and hide the control
        isGridView: { type: Boolean, default: false },
        isDummy: { type: Boolean, default: false },// to identify the dummy field for the calculations if is dummy is true then fieldname is to define on which the calculation is to be done  
        dropDownValues: [{ id: String, value: String }],
        isSwitchToText: { type: Boolean, default: false },
        gridTotal: { type: Boolean, default: false },
        gridTypeTotal: { type: String, required: false, },
        isBreak: { type: Boolean, default: false },
        toolTipMessage: { type: String, required: false, default: null },// tooltip message for the control
        referenceTable: { type: String, required: false, default: null },
        referenceColumn: { type: String, required: false, default: null },// have to check the combination of keys 
        referenceView: { type: String, required: false, default: null },
        type: { type: mongoose.Schema.Types.Mixed, required: false, default: null },// Data type like number, string, decimal etc,
        size: { type: Number, required: false, default: null },
        ordering: { type: Number, required: false, default: null },
        isRequired: { type: Boolean, default: false },
        isEditable: { type: Boolean, default: true },
        dropdownFilter: { type: String, required: false, default: null },// filter condition for child dropdown
        controlDefaultValue: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
        functionOnChange: { type: String, required: false, default: null },
        functionOnBlur: { type: String, required: false, default: null },
        functionOnKeyPress: { type: String, required: false, default: null },
        sectionHeader: { type: String, required: false, default: null },// Short by this keys to drow the screem
        sectionOrder: { type: Number, required: false, default: null },// Short by this keys to drow the screem
        isCopy: { type: Boolean, default: false },
        isCopyEditable: { type: Boolean, default: true },
      }],
      subChild: [{
        tableName: { type: String, required: true, },
        subChildHeading: { type: String, required: false, default: null },
        functionOnSubmit: { type: String, required: false, default: null },
        functionOnDelete: { type: String, required: false, default: null },
        isHideGrid: { type: Boolean, default: false },// to identify if the child table grid to be hide or not
        isHideGridHeader: { type: Boolean, default: false },// to identify if the child table grid headers to be hide or not
        isGridExpandOnLoad: { type: Boolean, default: false },// to identify if the child table is to be on load expanded
        fields: [{
          fieldname: { type: String, required: false, default: null },
          yourlabel: { type: String, required: false, default: null },
          controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
          isControlShow: { type: Boolean, default: true },// to show and hide the control
          dropDownValues: [{ id: String, value: String }],
          isGridView: { type: Boolean, default: false },
          isDummy: { type: Boolean, default: false },// to identify the dummy field for the calculations if is dummy is true then fieldname is to define on which the calculation is to be done
          toolTipMessage: { type: String, required: false, default: null },// tooltip message for the control
          referenceTable: { type: String, required: false, default: null },
          referenceColumn: { type: String, required: false, default: null },// have to check the combination of keys 
          referenceView: { type: String, required: false, default: null },
          type: { type: mongoose.Schema.Types.Mixed, required: false, default: null },// Data type like number, string, decimal etc,
          size: { type: Number, required: false, default: null },
          ordering: { type: Number, required: false, default: null },
          gridTotal: { type: Boolean, default: false },
          gridTypeTotal: { type: String, required: false, },
          isRequired: { type: Boolean, default: false },
          isEditable: { type: Boolean, default: true },
          isSwitchToText: { type: Boolean, default: false },
          isBreak: { type: Boolean, default: false },
          dropdownFilter: { type: String, required: false, default: null },// filter condition for child dropdown
          controlDefaultValue: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
          functionOnChange: { type: String, required: false, default: null },
          isCopy: { type: Boolean, default: false },
          isCopyEditable: { type: Boolean, default: true },
        }]
      }]
    }], // Array of child tables
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },
    clientCode: { type: String, required: false, default: null },

  }).pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    // return next()
    const checkUniqueness = (fieldsArray) => {
      const fieldnames = fieldsArray.map(field => {
        if (typeof field.dropDownValues === "string" && field.dropDownValues !== "") {
          let array = field.dropDownValues.split(',');
          let values = [];
          for (const iterator of array) {
            //            console.log("iterator",);
            iterator.split(".").length > 1 ? values.push({ id: iterator.split(".")[0], value: iterator.split(".")[1] }) :
              values.push({ id: iterator, value: iterator });
          }
          field.dropDownValues = values

        }
        else {
          field.dropDownValues = Array.isArray(field.dropDownValues) ? field.dropDownValues : []
        }

        return field.fieldname
      });
      const uniqueFieldnames = new Set(fieldnames);
      return fieldnames.length === uniqueFieldnames.size;
    };
    const checkUniquenessTableName = (fieldsArray) => {
      const fieldnames = fieldsArray.map(field => field.tableName);
      const uniqueFieldnames = new Set(fieldnames);
      return fieldnames.length === uniqueFieldnames.size;
    };
    //    console.log(update.fields);
    // Check uniqueness in the top-level fields array
    if (update && update.fields && !checkUniqueness(update.fields)) {
      return next(new Error('Fieldname must be unique in fields.'));
    }

    // Check uniqueness in children fields
    if (update && update.child) {
      if (!checkUniquenessTableName(update.child)) {
        return next(new Error('Table Name must be unique in Child '));
      }

      for (const child of update.child) {
        if (child.fields && !checkUniqueness(child.fields)) {
          return next(new Error('Fieldname must be unique in child fields.'));
        }

        // Check uniqueness in subChildren fields
        if (child.subChild) {
          if (!checkUniquenessTableName(child.subChild)) {
            return next(new Error('Table Name must be unique in SubChild '));
          }
          for (const subChild of child.subChild) {
            if (subChild.fields && !checkUniqueness(subChild.fields)) {
              return next(new Error('Fieldname must be unique in subChild fields.'));
            }
          }
        }
      }
    }
    //    console.log(update);
    // Process fields in the main document
    if (update.fields) {
      await processFields(update.fields, model, next);
    }

    // Process fields in child
    if (update.child) {
      for (const child of update.child) {
        await processFields(child.fields, model, next);

        // Process fields in subChild
        for (const subChild of child.subChild) {
          await processFields(subChild.fields, model, next);
        }
      }
    }

    next();
    next();
  }).post("aggregate", async function (doc, next) {
    console.log("aggregate", this._req)
    // for (const object of doc) {
    //   // Process fields in the main document
    //   if (object.fields) {
    //     await processAggregateFields(object.fields, model);

    //   }

    //   // Process fields in child and subChild
    //   for (const child of object.child || []) {
    //     if (child.fields) {
    //       await processAggregateFields(child.fields, model);

    //     }
    //     for (const subChild of child.subChild || []) {
    //       if (subChild.fields) {

    //         await processAggregateFields(subChild.fields, model);
    //       }

    //       for (const iterator of subChild["4thchild"] || []) {
    //         if (iterator.fields) {
    //           //              console.log("4thchild", iterator);
    //           await processAggregateFields(iterator.fields, model);
    //         }

    //       }
    //     }

    //   }
    // }
    next();
  }),
  // Form Control master

  master_schema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    tableName: { type: String, required: true, unique: true },
    fields: {
      type: [{
        fieldname: { type: String, required: false, default: null },
        defaultValue: mongoose.Schema.Types.Mixed,
        status: { type: Number, required: false, default: 1 },
        isRequired: Boolean,
        type: { type: String, required: false, default: null },
        size: { type: Number, required: false, default: null },
        referenceTable: { type: String, required: false, default: null },
        isUnique: { type: Boolean, required: false, default: false },
        index: { type: Number, required: false, default: 0 },
        isDeletable: { type: Boolean, required: false, default: false },

      }],

    },
    child: [{
      tableName: { type: String, required: true },
      fields: {
        type: [{
          fieldname: { type: String, required: false, default: null },
          defaultValue: mongoose.Schema.Types.Mixed,
          status: { type: Number, required: false, default: 1 },
          isRequired: Boolean,
          type: { type: String, required: false, default: null },
          size: { type: Number, required: false, default: null },
          referenceTable: { type: String, required: false, default: null },
          isUnique: { type: Boolean, required: false, default: false },
          index: { type: Number, required: false, default: 0 },
          isDeletable: { type: Boolean, required: false, default: false },

        }],

      },
      subChild: [{
        tableName: { type: String, required: true, },
        fields: {
          type: [{
            fieldname: { type: String, required: false, default: null },
            defaultValue: mongoose.Schema.Types.Mixed,
            status: { type: Number, required: false, default: 1 },
            isRequired: Boolean,
            type: { type: String, required: false, default: null },
            size: { type: Number, required: false, default: null },
            referenceTable: { type: String, required: false, default: null },
            isUnique: { type: Boolean, required: false, default: false },
            index: { type: Number, required: false, default: 0 },
            isDeletable: { type: Boolean, required: false, default: false },

          }],

        },
      }]
    }], // Array of child tables
    // indexes: {},
    status: { type: Number, required: false, default: 1 },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },
    clientCode: { type: String, required: false, default: null },

  }).set('autoIndex', true),// Master Control Shema

  //Defining the schema of menu master
  tblMenu: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    docId: { type: String, required: false, default: null, index: 'text' },
    menuName: { type: String, required: false, default: null, unique: true },
    icon: { type: String, required: false, default: null },
    isFormcontrol: { type: Boolean, required: false, default: false },
    order: { type: Number, required: false, default: 0 },
    options: [optionSchema],
    status: { type: Number, required: false, default: 1 },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },
    componentPath: { type: String, required: false, default: "/default" },
    clientCode: { type: String, required: false, default: null },

  }).post('findOneAndUpdate', function (doc, next) {
    //    console.log('Pre-findOneAndUpdate hook triggered');

    // Access the update operation
    const update = doc;
    //    console.log(update);
    if (update.docId == null) {
      update.docId = update._id.toString();
      update.options = appendDocIdToNestedObjects(update.options)
      doc.save().then(() => next());
      //      console.log(update);
    }
    else {
      next();
    }


    // Check if the operation is creating a new document (upsert)


    // next();
  }),
  tblRoleNotUse: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    roleName: { type: String, required: true, default: null },
    menuAccess: [{
      menuID: { type: String, required: false, default: null },// menu document id i.e _id
      isDeleted: { type: Boolean, required: false, default: false },
      isEdit: { type: Boolean, required: false, default: false },
      isview: { type: Boolean, required: false, default: false },
      isAdd: { type: Boolean, required: false, default: false },
    }],
    status: { type: Number, required: false, default: 1 },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    clientCode: { type: String, required: false, default: null },
  }).set('autoIndex', true).set("collection", "tblRole"),



  tblUserss: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    userName: { type: String, required: false, default: null, unique: true },
    name: { type: String, required: false, default: null },

    status: { type: Number, required: false, default: 1 },
    email: { type: String, required: false, default: null, unique: true },
    mobile: { type: String, required: false, default: null, unique: true },
    password: { type: String, required: false, default: null },
    passwordLastUpdateDate: { type: Date, required: false, default: Date.now() },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },
    // otp: { type: Number, required: false, default: null },
    profilePhoto: { type: String, required: false, default: null },
    language: { type: String, required: false, default: null },
    twoStepVerification: { type: Boolean, required: false, default: false },
    dateTimeFormat: { type: String, required: false, default: null },
    currency: { type: String, required: false, default: null },
    emailVerification: { type: Boolean, required: false, default: false },
    smsVerification: { type: Boolean, required: false, default: false },
    menuAccess: [{
      menuID: { type: String, required: false, default: null },// menu document id i.e _id
      isDeleted: { type: Boolean, required: false, default: false },
      isEdit: { type: Boolean, required: false, default: false },
      isview: { type: Boolean, required: false, default: false },
      isAdd: { type: Boolean, required: false, default: false },

    }],
    defaultFinYearId: { type: Number, required: false, default: null },
    defaultCompanyId: { type: Number, required: false, default: null },
    defaultBranchId: { type: Number, required: false, default: null },
    numberFormat: { type: Number, required: false, default: null },
    clientCode: { type: String, required: false, default: null },
  }),
  tblOtpLog: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    status: { type: Number, required: false, default: 1 },
    userID: { type: Number, required: false, default: null },
    action: { type: String, required: false, default: null },//used for login or forget password,
    otp: { type: String, required: false, default: null },
    expireIn: { type: String, required: false, default: null },// used to check otp expire time and time will store in seconds
    createdDate: { type: Date, required: false, default: Date.now() },
    isUseable: { type: Number, required: false, default: 1 },// 1 for usable and 2 for not usable
  }),
  NumberGenerationSchema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    client: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    menuID: { type: String, required: false, default: null },
    columnName: { type: String, required: false, default: null },// Where to append the No. while submiting JSON to DB , May be used in future
    module: {
      type: String,
      // enum: ['Quotation', 'Booking', 'B/L', 'Invoice', 'Voucher'],
      required: true,
    },
    preFix: {
      type: String,
      required: true,
      default: null
    },
    NoofDigits: { type: Number, required: false, default: 0 },
    cycleType: [{
      keyName: { type: String, required: true, default: null },
      keyType: { type: String, required: true, default: null },
      dateFormat: { type: String, required: true, default: null },
    }],
    status: { type: Number, required: false, default: 1 },
    rules: [{
      name: { type: String, required: true, default: null },
      tableName: { type: String, required: true, default: null },// while submiting JSON we will find this key in the Original JSON and append the No. Generation Value
      filterColumn: { type: String, required: true, default: null },// this column will be used for filter the resuts from DB
      columnName: { type: String, required: true, default: null },
      type: { type: String, required: true, default: null },// Should be PreFIx , Key ,Date, Special Symbol
      dateFormat: { type: String, required: true, default: null },// Date format exampel DD,MM,YYYY,DDMMYYYY,YYYYMMDD
      specialSymbol: { type: String, required: true, default: null },// Special symbol include ( , - . ),
      to: { type: Number, required: true, default: null },// To
      from: { type: Number, required: true, default: null },// From
      ordering: { type: Number, required: true, default: 0 },// Ordering
    }],
    clientCode: { type: String, required: false, default: null },
  }),
  CopyTableMapingSchema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    fromTableName: { type: String, required: true, default: null },
    mappingName: { type: String, required: true, default: null, unique: true },
    status: { type: Number, required: false, default: 1 },
    filterOn: { type: String, required: false, default: "_id" },
    fieldsMaping: [{
      FromColmunName: { type: String, required: true, default: null },
      ToColmunName: { type: String, required: true, default: null },
      isChild: { type: Boolean, required: false, default: false },
      isOnChage: { type: Boolean, required: false, default: false },
      isEditable: { type: Boolean, required: true, default: false },
    }],
    clientCode: { type: String, required: false, default: null },
  }),
  tblReportSearchCriteriaNOTINUSE: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    // menuID: { type: String, required: false, default: null },
    reportID: { type: String, required: false, default: null },
    tableName: { type: String, required: false, default: null },
    status: { type: Number, required: false, default: 1 },
    apiUrl: { type: String, required: false, default: null },

    fields: {
      type: [{
        fieldname: { type: String, required: false, default: null },
        controlname: { type: String, required: false, default: null },
        yourlabel: { type: String, required: false, default: null },
        type: { type: String, required: false, default: null },
        status: { type: Number, required: false, default: 1 },
        controlDefaultValue: { type: String, required: false, default: null },
        referenceTable: { type: String, required: false, default: null },
        referenceColumn: { type: String, required: false, default: null },
        isRequired: { type: Boolean, required: false, default: false },
        isEditable: { type: Boolean, default: true },
        dropDownValues: [{ id: String, value: String }],
        toolTipMessage: { type: String, required: false, default: null },
        functionOnChange: { type: String, required: false, default: null },
        functionOnBlur: { type: String, required: false, default: null },
        functionOnKeyPress: { type: String, required: false, default: null },
      }]
    },
    grid: {
      type: [{
        fieldname: { type: String, required: false, default: null },
        label: { type: String, required: false, default: null },
        count: { type: String, required: false, default: null },
        url: { type: String, required: false, default: null },
        groupingDepth: { type: Number, required: false, default: 0 },
        displaySubTotal: { type: Boolean, required: false, default: false },
        displayGrandTotal: { type: Boolean, required: false, default: false },
      }]
    },
    buttons: [{
      name: { type: String, required: false, default: null },
      functionOnClick: { type: String, required: false, default: null },
      iconName: { type: String, required: false, default: null },
      type: { type: String, required: false, default: null },
    }],
    createdBy: { type: String, required: false, default: null },
    createdDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },
    updateDate: { type: Date, required: false, default: Date.now() },
    clientCode: { type: String, required: false, default: null },
  }).post("aggregate", async function (doc, next) {
    for (const object of doc) {
      if (object.fields) {
        await processAggregateFields(object.fields, model);

      }
    }
  })



}



