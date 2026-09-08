import { MongoDB } from '../src/mongodb.js'
import { helpers} from 'helpers_jsonld'


let URI = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'
let databaseID = "unitTestlibraryHelpers"
let tenantID = "unitTestlibraryHelpersTenant1"


describe('JSON-LD Module Unit Tests (Integration style - No Mocks)', () => {

    // -----------------------------------------------------------------------
    // isJsonld & isValid
    // -----------------------------------------------------------------------
    describe('CRUD Tests',  () => {


        let record = {
            "@type": "Thing",
            "@id": "https://www.test.com/thing1#thing",
            "name": "thing1"
        }
        let record_id = record?.["@id"]

        
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


        test('Patch', async () => {

            // Get db
            let db = await MongoDB.getDB(URI, databaseID, tenantID)

            // Post record
            action = await db.post(record)
            expect(helpers.isCompleted(action)).toBe(true)

            // Get record, ensure it is added
            action = await db.get(record_id)
            expect(action?.result?.['@id']).toBe(record_id)

            // Patch record with update
            let r = { "@id": record_id, "test": "test1" }
            action = await db.patch(r)

            // Get record, ensure values patched
            action = await db.get(record_id)
            expect(action?.result?.['@id']).toBe(record_id)
            expect(action?.result?.name).toBe(record?.name)
            expect(action?.result?.test).toBe(r?.test)

            // Delete record
            action = await db.delete(record_id)
            expect(helpers.isCompleted(action)).toBe(true)
            // Get record, ensure not existent
            action = await db.get(record_id)
            expect(action?.result).toBeUndefined()

            // Close db
            action = await db.close()
            expect(helpers.isCompleted(action)).toBe(true)

        });






    })
})




