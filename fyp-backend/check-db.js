const mongoose = require('mongoose');
require('dotenv').config();

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for exhaustive check");

        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const name = col.name;
            const collection = mongoose.connection.db.collection(name);
            const docs = await collection.find({}).toArray();
            let foundInCol = false;
            docs.forEach(doc => {
               const str = JSON.stringify(doc);
               if (str.includes("[object Object]")) {
                  if (!foundInCol) {
                      console.log(`Found [object Object] in collection: ${name}`);
                      foundInCol = true;
                  }
                  // Identify field
                  Object.keys(doc).forEach(key => {
                     const val = doc[key];
                     if (String(val) === "[object Object]") {
                        console.log(`   DocID: ${doc._id}, Field: ${key}, Value is exactly "[object Object]"`);
                     } else if (JSON.stringify(val).includes("[object Object]")) {
                        console.log(`   DocID: ${doc._id}, Field: ${key}, Nested "[object Object]" found`);
                     }
                  });
               }
            });
        }

        console.log("Exhaustive check finished.");
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDatabase();
