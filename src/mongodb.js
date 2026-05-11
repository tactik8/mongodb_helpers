import { MongoClient } from 'mongodb'

import * as helpers from 'jsonld_helpers'

import { v4 as uuidv4 } from 'uuid';



// ------------------------------------------------------------------------------
// Mongo DB
// ------------------------------------------------------------------------------

// cloudflared access tcp --hostname mongodb.krknapi.com --url localhost:27018


export class MongoDB {
    constructor(uri, tenantID, databaseID) {

        this.url = undefined
        this.port = undefined
        this.userID = undefined
        this.password = undefined
        this._uri = uri
        this.tenantID = tenantID
        this.databaseID = databaseID


        this._client = undefined
        this._dbInitializedFlag = false

        //this.uri = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'
        //this.tenantID = tenantID || "test"

        //this.databaseID = 'n8n'
    }

    get uri() {

        if (this._uri) {
            return this._uri
        }

        let uri = `mongodb://${this.userID}:${this.password}@${this.url}:${this.port || "27017"}/?authMechanism=DEFAULT`
        return uri
    }

    set uri(value) {
        this._uri = value
    }

    async init() {

        if (this._dbInitializedFlag == true) {
            return true
        }
        let initAction = await dbInit(this.uri)
        if (initAction.actionStatus == "CompletedActionStatus") {
            this._dbInitializedFlag = true
            this._client = initAction.result?.[0]
        }

        return initAction

    }


    async get(record_ids) {


        return await dbGet(this._client, this.databaseID, this.tenantID, record_ids, true)

    }

    async search(filter, orderBy, orderDirection, limit, offset) {

        return await dbSearch(this._client, this.databaseID, this.tenantID, filter, orderBy, orderDirection, limit, offset, true)

    }

    async post(record) {

        return await dbInsert(this._client, this.databaseID, this.tenantID, record)

    }

    async delete(filter) {
        return await dbDelete(this._client, this.databaseID, this.tenantID, filter)
    }
}







let uri = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'

//const client = new MongoClient(uri);
//await client.connect();



async function dbGetNested(client, databaseID, tenantID, records) {

    let action = new helpers.Action("MongoDB Get nested", records)
    console.log(action.toString())

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
        console.log(action.toString())
        return action


    } catch (err) {
        action.setFailed(String(err))
        console.log(action.toString())
        return action
    }
}


// ---------------------------------------------
// DB functions
// ---------------------------------------------

async function dbInit(uri) {

    let action = new helpers.Action('MongoDB Init')

    let client
    try {
        client = new MongoClient(uri);
        let k = await client.connect();

        action.setCompleted(client)
        console.log(action.toString())
        return action

    } catch (err) {
        action.setFailed(String(err))
        console.log(action.toString())
        return action
    }

}



async function dbInsert(client, databaseID, tenantID, records) {


    // init action
    let action = new helpers.Action('MongoDB Insert', records)
    console.log(action.toString())

    tenantID = tenantID || 'test'

    let db = new helpers.DB()

    db.post(records)

    records = db.getRecords()

    // Retrieve
    let queries = []
    for (let r of records) {

        let q = {
            updateOne: {
                filter: { "data.@id": r?.['@id'] },
                update: {
                    $set: {
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

        action.setCompleted(r)
        console.log(action.toString())
        return action

    } catch (err) {
        action.setFailed(String(err))
        console.log(action.toString())
        return action
    }

    return r

}


async function dbSearch(client, databaseID, tenantID, filter, orderBy, orderDirection, limit, offset, expand = true) {


    // init action
    let action = new helpers.Action('MongoDB Search', filter)
    console.log(action.toString())

    tenantID = tenantID || 'test'
    filter = filter || {}
    orderBy = orderBy || "@id"
    orderDirection = orderDirection || 1
    offset = offset || 0
    limit = limit || 100

    for (let k of Object.keys(filter)) {
        filter['data.' + k] = filter[k]
        delete filter[k]
    }

    try {

        const database = client.db(databaseID);
        const collection = database.collection(tenantID);

        let ordering = {}
        ordering[orderBy] = orderDirection
        let records = await collection.find(filter).sort(ordering).skip(offset).limit(limit).toArray();

        // Clean records
        records = _cleanMongoRecord(records)

        // Expand
        if (expand == true) {
            records = await dbGetNested(client, databaseID, tenantID, records)
            records = records?.result || []
        }


        action.setCompleted(records)
        console.log(action.toString())
        return action


    } catch (err) {
        console.log('err', err)
        action.setFailed(String(err))
        console.log(action.toString())
        return action
    }


}



async function dbGet(client, databaseID, tenantID, record_ids, expand = true) {

    // init action
    let action = new helpers.Action('MongoDB Get', record_ids)
    console.log(action.toString())


    tenantID = tenantID || 'test'

    record_ids = Array.isArray(record_ids)  ? record_ids : [record_ids]

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
            records = await dbGetNested(client, databaseID, tenantID, records)
            records = records?.result
        }


        action.setCompleted(records)
        console.log(action.toString())
        return action




    } catch (err) {
        console.log('err', err)
        action.setFailed(String(err))
        console.log(action.toString())
        return action
    }

}


async function dbDelete(client, databaseID, tenantID, filter) {


    // init action
    let action = new helpers.Action('MongoDB Delete', filter)
    console.log(action.toString())

    filter = filter || {}
    for (let k of Object.keys(filter)) {
        filter['data.' + k] = filter[k]
        delete filter[k]
    }

    try {

        const database = client.db(databaseID);
        const collection = database.collection(tenantID);

        let records = await collection.deleteMany(filter);

        action.setCompleted()
        console.log(action.toString())
        return action


    } catch (err) {
        action.setFailed(String(err))
        console.log(action.toString())
        return action
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

