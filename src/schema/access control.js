// Role Schema
[{
  "roleName": "Admin",
  "menuAccess": [{
    "menuID": "",// menu document id i.e _id
    "isDeleted": false,
    "isEdit": false,
    "isview": false,
    "isAdd": false
  }],
}]

// user Schema
[
  {
    userName: { type: String, required: false, default: null },
    // roleId: { type: String, required: false, default: null },
    status: { type: Number, required: false, default: 1 },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },
    // if user role is not defined then we will use this menuaccess else we will fetch it from the role 
    menuAccess: [{
      menuID: { type: String, required: false, default: null },// menu document id i.e _id
      isDeleted: { type: Boolean, required: false, default: false },
      isEdit: { type: Boolean, required: false, default: false },
      isview: { type: Boolean, required: false, default: false },
      isAdd: { type: Boolean, required: false, default: false },
      // status: { type: Number, required: false, default: 1 },
    }]
  }
]
