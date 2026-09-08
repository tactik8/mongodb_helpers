import { MongoDB } from './mongodb.js'
import helpers from 'helpers_jsonld'

let URI = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'




async function test4() {


    let URI = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'

    let databaseID = "unitTestlibraryHelpers"
    let tenantID = "unitTestlibraryHelpersTenant0"

    let db = await MongoDB.getDB(URI, databaseID, tenantID)


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


    record.itemListElement = {
        "@type": "ListItem",
        "@id": "Someif",
        "item": item
    }


    action = await db.post(record)

    //action = await db.appendItem(record, item)

    console.log('t', JSON.stringify(action, null, 4))
}
test4()
