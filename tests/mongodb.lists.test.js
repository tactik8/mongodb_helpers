import { MongoDB } from '../src/mongodb.js'

import { helpers} from 'helpers_jsonld'

let URI = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'
let databaseID = "unitTestlibraryHelpers"
let tenantID = "unitTestlibraryHelpersTenant2"


describe('JSON-LD Module Unit Tests (Integration style - No Mocks)', () => {

    // -----------------------------------------------------------------------
    // isJsonld & isValid
    // -----------------------------------------------------------------------
    describe('CRUD Tests',  () => {


        let record = {
            "@type": "ItemList",
            "@id": "https://www.test.com/itemlist1#itemlist",
            "name": "itemlist1",
            "itemListElement": []
        }
        let record_id = record?.["@id"]


        let item = {
            "@type": "Thing",
            "@id": "https://www.test.com/thingitem1#thing",
            "name": "thingitem1"
        }

        
        let action


        test('Init Test DB', async () => {

            // Get db
            let db = await MongoDB.getDB(URI, databaseID, tenantID)

            // Delete record
            action = await db.purge()
            expect(helpers.isCompleted(action)).toBe(true)

            // Get record, ensure not existent
            action = await db.get(record_id)
            expect(action?.result).toBeUndefined()

            // Close db
            action = await db.close()
            expect(helpers.isCompleted(action)).toBe(true)

        })


        test('Create', async () => {

            // Get db
            let db = await MongoDB.getDB(URI, databaseID, tenantID)

            // Post record
            action = await db.post(record)
            expect(helpers.isCompleted(action)).toBe(true)

            // Get record, ensure it is added
            action = await db.get(record_id)
            expect(action?.result?.['@id']).toBe(record_id)

            // Delete record
            action = await db.delete(record_id)
            expect(helpers.isCompleted(action)).toBe(true)

            // Get record, ensure not existent
            action = await db.get(record_id)
            expect(action?.result).toBeUndefined()

            // Close db
            action = await db.close()
            expect(helpers.isCompleted(action)).toBe(true)

        })


        test('CRUD item - add', async () => {

            // Get db
            let db = await MongoDB.getDB(URI, databaseID, tenantID)

            // Post record
            action = await db.post(record)
            expect(helpers.isCompleted(action)).toBe(true)

            // Get record, ensure it is added
            action = await db.get(record_id)
            expect(action?.result?.['@id']).toBe(record_id)

            // Insert item record with update
            action = await db.appendItem(record, item)
            expect(helpers.isCompleted(action)).toBe(true)

            // Get record, ensure item added
            action = await db.get(record_id)
            expect(helpers.isCompleted(action)).toBe(true)
            expect(action?.result?.['@id']).toBe(record_id)
            expect(helpers.itemListElement(action?.result).length).toBe(1)
            expect(helpers.items(action?.result).length).toBe(1)
            expect(helpers.items(action?.result)[0]['@id']).toBe(item["@id"])

            // Delete item from list
            action = await db.deleteItem(record, item)
            expect(helpers.isCompleted(action)).toBe(true)


            // Get record, ensure item removed from list
            action = await db.get(record_id)
            expect(helpers.isCompleted(action)).toBe(true)
            expect(action?.result?.['@id']).toBe(record_id)
            expect(helpers.itemListElement(action?.result).length).toBe(0)
            expect(helpers.items(action?.result).length).toBe(0)
            expect(helpers.items(action?.result)?.[0]?.['@id']).toBeUndefined()
            

            // Ensure item record still exists in db
            action = await db.get(item['@id'])
            expect(helpers.isCompleted(action)).toBe(true)
            expect(action?.result?.['@id']).toBe(item['@id'])


            // Delete list
            action = await db.delete(record_id)
            expect(helpers.isCompleted(action)).toBe(true)

            // Get record, ensure not existent
            action = await db.get(record_id)
            expect(action?.result).toBeUndefined()

            // Delete item
            action = await db.delete(item?.["@id"])
            expect(helpers.isCompleted(action)).toBe(true)

            // Close db
            action = await db.close()
            expect(helpers.isCompleted(action)).toBe(true)

        });

    })
})


