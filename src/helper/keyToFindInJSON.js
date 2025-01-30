exports.find = (obj, keysToFind) => {
    let foundValues = {};

    const findKeys = (item) => {
        if (item && typeof item === 'object') {
            keysToFind.forEach(key => {
                if (item.hasOwnProperty(key)) {
                    foundValues[key] = item[key];
                }
            });

            Object.values(item).forEach(findKeys);
        }
    };

    findKeys(obj);
    return foundValues;
};

exports.findFieldInJSON = (obj, fieldName) => {
    // Helper function to search for the fieldname in a given collection of fields
    const findInFields = (fields) => fields.find(value => value.fieldname === fieldName);

    // First, try to find the fieldname in the top-level fields
    let result = findInFields(obj.fields);
    if (result) return result;

    // If not found, iterate over each child
    for (const child of obj.child) {
        result = findInFields(child.fields);
        if (result) return result;

        // If not found in child, iterate over each subChild
        for (const subChild of child.subChild) {
            result = findInFields(subChild.fields);
            if (result) return result;
        }
    }

    // If the fieldname is not found at any level, return undefined
    return result;
};
