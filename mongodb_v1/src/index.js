
import * as helpers from 'jsonld_helpers'

import { MongoDB } from './mongodb.js'

let URI = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'

console.log('Start')


async function test() {

    let record = helpers.testRecord()


    let db = new MongoDB()
    db.uri = URI

    db.databaseID = "n8n"
    db.tenantID = "test"


    // init db
    let action = await db.init()


    let act1 = await db.search()

    console.log('r', act1.actionStatus)
    



}

test()