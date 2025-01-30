function getCommaSeparatedValuesCountFromNestedKeys(data, nestedKey) {
  if (!Array.isArray(data)) {
    return {
      values: "", // Return an empty string if the input is not an array
      count: 0  // Initialize count to 0
    };
  }

  if (!nestedKey) {
    return {
      values: "", // Return an empty string if the key is not provided
      count: 0  // Initialize count to 0
    };
  }

  const values = [];
  let count = 0;

  data.forEach(item => {
    const value = ProccessForTheCommaSeperated(item, nestedKey);
    if (value !== undefined) {
      values.push(value);
      count += value.split(',').length; // Increment the count by the number of values
    }
  });

  return {
    values: values.filter(value => value !== undefined).join(", "),
    count: count
  };
}

function ProccessForTheCommaSeperated(Data, nestedKey) {
  const keys = nestedKey.split('.');
  const key = keys[0];

  let value = [];

  if (keys.length === 1) {
    value.push(Data[key]);
  } else {
    let find = Data[key].map(item => ProccessForTheCommaSeperated(item, keys.slice(1).join(".")));
    value = [...find];
  }

  return value.join(",");
}

// Sample data with nested keys at various levels
const dataArray = [
  {
    "name": "kuna",
    "tblState": [
      { "code": "DE", "name": "Delhi", "tblCity": [{ "name": "Tel Aviv" }, { "name": "Jerusalem" }] },
      { "code": "DE", "name": "Delhi", "tblCity": [{ "name": "New York" }, { "name": "Los Angeles" }] }
    ],
  },
  {
    "tblState": [
      { "code": "UP", "name": "Uttar Pradesh", "tblCity": [{ "name": "Mumbai" }, { "name": "Delhi" }] },
      { "code": "HR", "name": "Haryana", "tblCity": [{ "name": "Toronto" }, { "name": "Vancouver" }] }
    ],
  }
];
const Data = [{
  "_id": {
    "$oid": "6595433e9a0954715e30e8d1"
  },
  "id": 1,
  "status": 1,
  "createdDate": {
    "$date": "2024-01-03T11:21:34.685Z"
  },
  "createdBy": null,
  "updatedDate": {
    "$date": "2024-01-03T11:21:34.685Z"
  },
  "updatedBy": null,
  "code": "IL",
  "name": "ISRAEL",
  "countryPhoneCode": "null",
  "blacklist": "n",
  "activeInactive": "y",
  "tblState": [
    {
      "code": "id1stateCode",
      "taxStateCode": null,
      "name": "Delhi",
      "tblCity": [
        {
          "name": "id1CityName",
          "tblStateId": null,
          "cityPhoneCode": null,
          "code": "id1CityCode",
          "_id": {
            "$oid": "6595453a9a0954715e30e8e1"
          }
        }
      ],
      "_id": {
        "$oid": "6595453a9a0954715e30e8e0"
      }
    }
  ],
  "__v": 0
},
{
  "_id": {
    "$oid": "6595433e9a0954715e30e8d2"
  },
  "id": 2,
  "status": 1,
  "createdDate": {
    "$date": "2024-01-03T11:21:34.699Z"
  },
  "createdBy": null,
  "updatedDate": {
    "$date": "2024-01-03T11:21:34.699Z"
  },
  "updatedBy": null,
  "code": "IT",
  "name": "ITALY",
  "countryPhoneCode": "+39",
  "blacklist": "n",
  "activeInactive": "y",
  "tblState": [
    {
      "code": "id2stateCode",
      "taxStateCode": null,
      "name": "id2statename",
      "tblCity": [
        {
          "name": "id2CityName",
          "tblStateId": null,
          "cityPhoneCode": null,
          "code": "id2CityCode",
          "_id": {
            "$oid": "6595453a9a0954715e30e8e3"
          }
        }
      ],
      "_id": {
        "$oid": "6595453a9a0954715e30e8e2"
      }
    }
  ],
  "__v": 0
},
{
  "_id": {
    "$oid": "6595433e9a0954715e30e8d3"
  },
  "id": 3,
  "status": 1,
  "createdDate": {
    "$date": "2024-01-03T11:21:34.713Z"
  },
  "createdBy": null,
  "updatedDate": {
    "$date": "2024-01-03T11:21:34.713Z"
  },
  "updatedBy": null,
  "code": "JM",
  "name": "JAMAICA",
  "countryPhoneCode": "null",
  "blacklist": "n",
  "activeInactive": "y",
  "tblState": [
    {
      "code": "id3stateCode",
      "taxStateCode": null,
      "name": "id3statename",
      "tblCity": [
        {
          "name": "id3CityName",
          "tblStateId": null,
          "cityPhoneCode": null,
          "code": "id3CityCode",
          "_id": {
            "$oid": "6595453a9a0954715e30e8e5"
          }
        }
      ],
      "_id": {
        "$oid": "6595453a9a0954715e30e8e4"
      }
    }
  ],
  "__v": 0
}]
const nestedKey = "tblState.tblCity.name"; // Specify the nested key in dot notation here
// getCommaSeparatedValuesCountFromNestedKeys(dataArray, nestedKey);
exports = getCommaSeparatedValuesCountFromNestedKeys()