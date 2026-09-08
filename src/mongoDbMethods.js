import helpers from 'helpers_jsonld'
import { MongoClient } from 'mongodb'


let uri = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'




// -----------------------------------------------------------------
// Database
// -----------------------------------------------------------------

export async function dbCreateDatabase(client, databaseID, tenantID) {


    let action = new helpers.Action("MongoDB Create database")

    try {
        // Select the database (MongoDB creates it if it doesn't exist)
        const db = client.db(databaseID);

        // Select a collection name
        const collection = db.collection('config');

        // 
        let data = {
            "@type": "Dataset",
            "@id": `https://www.test.com/${databaseID}#dataset`,
            "name": databaseID,
            "dateCreated": new Date()
        }


        // Insert at least one document to physically create the database
        const insertResult = await collection.insertOne(data);


        // create index
        if (tenantID) {
            let r = await dbCreateIndex(client, databaseID, tenantID)
        }


        action.setCompleted(data)

        return action?.record || action

    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action

    }
}




export async function dbSearchDatabases(client) {


    let action = new helpers.Action("MongoDB Get Databases")

    try {

        // Select a collection name

        // Access the administrative interface
        const adminDb = client.db().admin();

        // Retrieve the list of databases
        const dbList = await adminDb.listDatabases();

        let databases = []
        for (let db of dbList.databases) {
            let r = {
                "@type": "Dataset",
                "@id": `https://www.test.com/${db.name}#dataset`,
                "name": db.name,
                "tenandID": (await getCollections(client, db.name))?.result || []
            }
            databases.push(r)
        }


        // 
        action.setCompleted(databases)

        return action?.record || action

    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action

    }
}



export async function dbInit(uri) {

    let action = new helpers.Action('MongoDB Init')

    let client
    try {
        client = new MongoClient(uri);
        let k = await client.connect();

        action.setCompleted(client)

        return action

    } catch (err) {
        action.setFailed(String(err))
        return action
    }

}



export async function dbHealthCheck(client, databaseID, tenantID) {

    let action = new helpers.Action("MongoDB Healthcheck")
    try {



        // Verify indexes
        let indexes = (await dbGetIndex(client, databaseID, tenantID))?.result || []
        indexes = Array.isArray(indexes) ? indexes : [indexes]

        let mainIndex = indexes.find(x => x.propertyID.includes('@id'))

        if (!mainIndex) {
            let r = await dbCreateIndex(client, databaseID, tenantID)
            action.hasPart.push(r)
            action.description = "Index missing, created."
        } else {
            action.description = "Index already present."
        }


        action.setCompleted()
        return action?.record || action

    } catch (err) {
        console.log('Error', err)
        action.setFailed(String(err))
    }

}


// -----------------------------------------------------------------
// Index
// -----------------------------------------------------------------



export async function dbCreateIndex(client, databaseID, tenantID) {


    let action = new helpers.Action("MongoDB Create index")

    try {

        await client.connect();
        const db = client.db(databaseID);
        const collection = db.collection(tenantID);

        // Fetch all indexes on the specified collection
        let index1 = await collection.createIndex({ "data.@type": 1 });
        let index2 = await collection.createIndex({ "data.@id": 1 });
        let index3 = await collection.createIndex({ "data.actionStatus": 1 });
        let index4 = await collection.createIndex({ "data.url": 1 });



        // 
        action.setCompleted(indexes)

        return action?.record || action

    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action

    }
}


export async function dbGetIndex(client, databaseID, tenantID) {


    let action = new helpers.Action("MongoDB Get index")

    try {

        await client.connect();
        const db = client.db(databaseID);
        const collection = db.collection(tenantID);

        // Fetch all indexes on the specified collection
        const indexList = await collection.indexes();


        let indexes = indexList.map(i => (
            {
                "@type": "Index",
                "@id": `https://www.test.com/${databaseID}/${tenantID}/${i.name}#index`,
                "name": i.name,
                "propertyID": Object.keys(i.key),
                "unique": i?.unique || false
            }
        ));

        // 
        action.setCompleted(indexes)

        return action?.record || action

    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action

    }
}




// -----------------------------------------------------------------
// Collections
// -----------------------------------------------------------------

export async function getCollections(client, databaseID) {

    let action = new helpers.Action("MongoDB Get Collections")

    try {


        const database = client.db(databaseID);

        let collections = await database.listCollections().toArray();

        let tenants = []
        for (let c of collections) {

            let t = {
                "@type": "Tenant",
                "name": c.name,
                "url": "/" + c.name,
                "numberOfitems": await getDocumentCount(client, databaseID, c.name),
                "indexes": await dbGetIndex(client, databaseID, c.name),
            }
            tenants.push(t)
        }


        action.setCompleted(tenants)

        return action?.record || action


    } catch (err) {

        action.setFailed('getCollection error: ' + String(err))

        return action?.record || action
    }

}


// -----------------------------------------------------------------
// Documents
// -----------------------------------------------------------------



export async function dbPurge(client, databaseID, tenantID) {

    // init action
    let action = new helpers.Action('MongoDB Purge')

    try {

        const database = client.db(databaseID);
        const collection = database.collection(tenantID);

        let records = await collection.deleteMany({});

        action.object = {}
        action.setCompleted()
        return action?.record || action


    } catch (err) {
        action.setFailed(String(err))
        console.log('error', JSON.stringify(action))
        return action?.record || action
    }


}


export async function getDocumentCount(client, databaseID, tenantID) {

    const db = client.db(databaseID);
    const collection = db.collection(tenantID);


    // Method 2: Fast, estimated count of the entire collection
    const totalEstimate = await collection.estimatedDocumentCount();

    return totalEstimate

}



export async function dbGetNested(client, databaseID, tenantID, records) {

    let action = new helpers.Action("MongoDB Get nested", records)

    let initialIDs = []
    let fetchedIDs = []         // ids already fetched
    let toFetchIDs = []         // records to return 
    let recordsDB = new helpers.DB()  // records already fetched 


    try {

        records = Array.isArray(records) ? records : [records]
        initialIDs = records.map(x => x?.["@id"])
        toFetchIDs = toFetchIDs.concat(initialIDs)



        while (toFetchIDs.length > 0) {

            let a = await dbGet(client, databaseID, tenantID, toFetchIDs, false)


            let dbRecords = a.result
            dbRecords = Array.isArray(dbRecords) ? dbRecords : [dbRecords]
            dbRecords = dbRecords.map(x => x?.record || x)
            // Add records to recordsDB
            recordsDB.post(dbRecords)


            // add ids to fetch to already fetched
            fetchedIDs = fetchedIDs.concat(toFetchIDs)

            // Reset toFetchIDs
            toFetchIDs = []

            // Get new ids to fetch
            toFetchIDs = recordsDB.record_ids.filter(x => !fetchedIDs.includes(x))

        }



        let results = initialIDs.map(x => recordsDB.get(x))

        action.setCompleted(results)
        return action?.record || action


    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action
    }
}


export async function dbPatch(client, databaseID, tenantID, records) {



    let action = new helpers.Action('MongoDB Patch', helpers.clone(records))

    records = getFlatRecords(records)

    let record_ids = records.map(x => x?.["@id"])

    // Retrieve current db records
    let retrieveCurrentRecordsAction = await dbGet(client, databaseID, tenantID, record_ids)
    let currentRecords = retrieveCurrentRecordsAction?.result || []
    currentRecords = helpers.toArray(currentRecords)


    // iterate
    let mergedRecords = []
    for (let r of records) {

        let currentRecord = currentRecords.find(x => x?.["@id"] == r?.['@id'])

        let mergedRecord = helpers.merge(r, currentRecord)

        mergedRecords.push(mergedRecord)

    }

    let a = await dbInsert(client, databaseID, tenantID, mergedRecords)

    if (a.isFailed) {
        action.setFailed(a?.error)
        return action
    }

    action.setCompleted(mergedRecords)

    let result = action?.record || action

    try {
        result = JSON.parse(JSON.stringify(result))
    } catch { }

    return result


}


export async function dbInsert(client, databaseID, tenantID, records) {


    let action = new helpers.Action('MongoDB Insert', helpers.clone(records))

    tenantID = tenantID || 'test'

    records = getFlatRecords(records)
    
    // Retrieve
    let queries = []
    for (let r of records) {

        let q = {
            updateOne: {
                filter: { "data.@id": r?.['@id'] },
                update: {
                    $set: {
                        "@type": helpers.record_type(r),
                        "@id": r?.["@id"],
                        "data": r,
                        "@annotation.dbModifiedDate": new Date()
                    },
                    $setOnInsert: {
                        "@annotation.dbCreatedDate": new Date()
                    }
                },
                upsert: true
            }
        }
        queries.push(q)
    }




    try {
        let database = client.db(databaseID);
        let collection = database.collection(tenantID);
        let r = await collection.bulkWrite(queries)

        action.setCompleted(String(r))

        let result = action?.record || action

        try {
            result = JSON.parse(JSON.stringify(result))
        } catch { }

        return result

    } catch (err) {
        action.setFailed(String(err))

        let result = action?.record || action

        try {
            result = JSON.parse(JSON.stringify(result))
        } catch { }

        return result


    }



}


export async function dbSearch(client, databaseID, tenantID, filter, orderBy, orderDirection, limit, offset, expand = true) {


    // init action
    let action = new helpers.Action('MongoDB Search', filter)

    tenantID = tenantID || 'test'

    if (typeof filter == 'string') {
        try {
            filter = JSON.parse(filter)
        } catch { }

    }
    filter = JSON.parse(JSON.stringify(filter || {}))
    orderBy = orderBy || "@id"
    orderDirection = orderDirection || 1
    offset = offset ?? 0
    limit = limit ?? 100



    offset = Number(offset)
    offset = isNaN(offset) ? 0 : offset

    limit = Number(limit)
    limit = isNaN(limit) ? 0 : limit


    // adjust for array
    for (let k of Object.keys(filter)) {
        let value = filter[k]
        if (Array.isArray(value)) {
            filter[k] = { $all: value }
        }
    }

    // Adjust for data.x
    for (let k of Object.keys(filter)) {
        filter['data.' + k] = filter[k]
        delete filter[k]
    }



    try {

        const database = client.db(databaseID);
        const collection = database.collection(tenantID);

        let ordering = {}
        ordering["data." + orderBy] = orderDirection
        ordering['_id'] = -1
        let records = await collection.find(filter).sort(ordering).skip(offset).limit(limit).toArray();



        let count = await collection.countDocuments(filter);

        // Clean records
        records = _cleanMongoRecord(records)

        // Expand
        if (expand == true) {
            records = await dbGetNested(client, databaseID, tenantID, records)
            records = records?.result || []
        }

        let result = {
            "@type": "ItemList",
            "@id": "_:" + helpers.randomUUID(),
            "name": "Search results",
            "numberOfItems": count,
            "itemListElement": []
        }

        let results = []
        records = Array.isArray(records) ? records : [records]
        for (let [i, r] of records.entries()) {

            let listItem = {
                "@type": "ListItem",
                "@id": "_: " + helpers.randomUUID(),
                "position": i + offset,
                "item": r
            }

            results.push(listItem)
        }

        result.itemListElement = results
        action.setCompleted(result)
        return action?.record || action


    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action
    }


}



export async function dbGet(client, databaseID, tenantID, record_ids, expand = true) {

    // init action
    let action = new helpers.Action('MongoDB Get', record_ids)


    tenantID = tenantID || 'test'

    record_ids = Array.isArray(record_ids) ? record_ids : [record_ids]

    record_ids = record_ids.map(x => x?.["@id"] || x)

    let query = record_ids.map(x => { return { "data.@id": x } })
    query = { '$or': query }


    try {

        const database = client.db(databaseID);
        const collection = database.collection(tenantID);


        let records = await collection.find(query).toArray();


        // Clean records
        records = _cleanMongoRecord(records)

        // Expand
        if (expand == true) {
            let a = await dbGetNested(client, databaseID, tenantID, records)
            records = a?.result
        }


        action.setCompleted(records)

        return action?.record || action




    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action
    }

}


export async function dbDelete(client, databaseID, tenantID, filter) {


    // init action
    let action = new helpers.Action('MongoDB Delete', filter)

    if (typeof filter == "string") {
        filter = { "@id": filter }
    }


    filter = filter || {}
    for (let k of Object.keys(filter)) {
        filter['data.' + k] = filter[k]
        delete filter[k]
    }

    try {

        const database = client.db(databaseID);
        const collection = database.collection(tenantID);

        let records = await collection.deleteMany(filter);

        action.object = filter
        action.setCompleted()
        return action?.record || action


    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action
    }

}


export async function dbDeleteById(client, databaseID, tenantID, record_ids) {


    // init action
    let action = new helpers.Action('MongoDB Delete by Id', record_ids)


    record_ids = helpers.toArray(record_ids)

    record_ids = record_ids.map(x => (typeof x) == "string" ? { "@id": x } : x)

    record_ids = record_ids.filter(x => helpers.record_id(x))

    let filter = {
        "$or": record_ids
    }

    try {

        const database = client.db(databaseID);
        const collection = database.collection(tenantID);

        let records = await collection.deleteMany(filter);

        action.object = filter
        action.setCompleted()
        return action?.record || action


    } catch (err) {
        action.setFailed(String(err))
        return action?.record || action
    }

}

// ------------------------------------------------
// Cleanup
// ------------------------------------------------

function _cleanMongoRecord(record) {

    if (Array.isArray(record) && typeof record != "string") {
        return record.map(x => _cleanMongoRecord(x))
    }

    record = record?.['data']
    return record
}





/**
 * Return an array of flatten records
 * @param {*} records 
 * @returns 
 */
function getFlatRecords(records) {

    // init action
    

    if(helpers.isArray(records)){
        records = records.map(x => x?.record ?? x)
    } else {
        records = records?.record ?? records
    }

    records = helpers.clone(records)
   
    let db = new helpers.DB()

    records = helpers.toArray(records)
    records = records.map(x => x?.record || x)

    db.post(records)

    records = db.getRecords(false)

    records = records.map(x => x?.record || x)

    return records
}