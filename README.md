


# MongoDB client


## How to use


```
npm install github:tactik8/helpers_mongodb

```


```
import { MongoDB } from "helpers_mongodb"

```


## Development
```
npx nodemon mongodb_v1/src/index.js
```


# Installation
```
npm install github:tactik8/helpers_mongodb
```

## Build
for packaging:
```
npm run build
```

## How to use

### init db
```
let URI = 'mongodb://tactik8:Temp4now@192.168.2.243:27017/?authMechanism=DEFAULT'

    let databaseID = "unitTestlibraryHelpers"
    let tenantID = "unitTestlibraryHelpersTenant0"
    let db = await MongoDB.getDB(URI, databaseID, tenantID)

```

### CRUD record
```
    let action 
    
    action = await db.post(record)

    action = await db.get(record_id)
    let record = action.result

    action = await db.search(filter, ...)
    let records = action.result

    action = await db.delete(filter)

    action = await db.deleteById(record_id)



```


### CRUD items in list
```

    let action

    action = await db.post(itemList)

    action = await db.apppendItem(itemList, item)

    action = await db.deleteItem(itemList, item)


```