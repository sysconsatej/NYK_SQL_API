

function hashUsername(username) {
    return createHash('sha256').update(username).digest('hex');
}


module.exports = {

    idCounter: async (
        collection,
        column
    ) => {
        const _counter = await collection.aggregate([
            { $project: { [column]: 1, _id: 0 } },
            { $sort: { [column]: -1 } },
            { $limit: 1 }
        ]);
        console.log(_counter);
        // let aggregateQueryArr = [];
        // aggregateQueryArr.push({ $project: { [column]: 1, _id: 0 } });
        // aggregateQueryArr.push({ $sort: { [column]: -1 } }, { $limit: 1 });
        // const _counters = await collection.aggregate(aggregateQueryArr);
        return _counter.length >= 1 ? _counter[0][column] + 1 : 1;
    },
    ShortenId: async () => {
        let uniqueId = Date.now().toString();
        const hash = createHash('sha256').update(uniqueId).digest('base64');
        return hash.replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '').replace(/-/g, "").replace(/_/g, "");
    },
    Accesstoken_generate: async (username) => {
        try {
            let hash = hashUsername(username);
            console.log(hash);
            return hash

            // console.log(hashUsername("ankita_23").length);
            // console.log(hashUsername("ankita_23"));
        } catch (error) {
            console.log(error.message);
        }
    },

}
