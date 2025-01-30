const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
async function getDataFromDynamicCollection(modal , query) {
    // Generate a unique cache key based on collection name and query
    const cacheKey = `${modal.collection.collectionName}-${JSON.stringify(query)}`;

    // Try to fetch cached data
    const cachedData = myCache.get(cacheKey);

    if (cachedData !== undefined) {
        console.log('Data fetched from cache');
        return cachedData;
    }

    // If not found in cache, get from MongoDB
    // const dynamicModel = connection.model(collectionName, schema);

    const data = await modal.aggregate(query,{allowDiskUse:true});

    // Cache the fetched data
    myCache.set(cacheKey, data);

    console.log('Data fetched from MongoDB');
    return data;
}
function deleteCacheWithPattern(pattern) {
    const regex = new RegExp(pattern,'g');
    console.log(regex);
    const keys = myCache.keys();
  
    for (const key of keys) {
      if (regex.test(key)) {
        myCache.del(key);
        console.log(`Deleted cache for key: ${key}`);
      }
    }
  }
  module.exports = {
      getDataFromDynamicCollection,deleteCacheWithPattern
  }