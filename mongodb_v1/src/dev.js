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

    console.log('a', a_init.actionStatus )
    if(a_init.isCompleted == false){
        console.log('Error init')
    }


    let filter = undefined
    let orderBy = undefined
    let orderDirection = undefined
    let limit = undefined
    let offset = undefined


    let action = await db.search(filter, orderBy, orderDirection, limit, offset)

    console.log('a', action)






}

test()
