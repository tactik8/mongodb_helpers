import { MongoDB } from './mongodb.js'

let URI = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'

console.log('Start')


async function test() {

    //let record = helpers.testRecord()


    let db = new MongoDB()
    db.uri = URI

    db.databaseID = "n8n"
    db.tenantID = "test"


    // init db
    let a_init = await db.init()


    let record = {
            "@type": "Thing",
            "@id": "https://test.com/thing1",
            "name": "thing1"
        }

        let a1 = await db.post(record)
        let action = await db.get(record?.['@id'])


        console.log('rr', action.result)


        
    



}

test()
