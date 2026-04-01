const mongoose = require('mongoose');
require('dotenv').config();

const fixDoc = (doc) => {
    let changed = false;
    for (const key in doc) {
        if (typeof doc[key] === 'string' && doc[key].includes('[object Object]')) {
            console.log(`Found bad string in field ${key}: ${doc[key]}`);
            // Try to recover if possible, otherwise null it or use a fallback
            doc[key] = "Data Corruption Fixed"; 
            changed = true;
        } else if (typeof doc[key] === 'object' && doc[key] !== null) {
            if (fixDoc(doc[key])) changed = true;
        }
    }
    return changed;
};

const runFix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const cols = await db.listCollections().toArray();
        for (const c of cols) {
            const col = db.collection(c.name);
            const docs = await col.find().toArray();
            for (const d of docs) {
                const id = d._id;
                if (fixDoc(d)) {
                    console.log(`Fixing doc ${id} in ${c.name}`);
                    await col.replaceOne({ _id: id }, d);
                }
            }
        }
        console.log("Fix script finished.");
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runFix();
