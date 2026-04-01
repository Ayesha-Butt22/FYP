const mongoose = require('mongoose');
require('dotenv').config();

const findInDoc = (doc) => {
    const s = JSON.stringify(doc);
    return s && s.includes("[object Object]");
};

const runSearch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const cols = await db.listCollections().toArray();
        console.log(`Found ${cols.length} collections`);
        for (const c of cols) {
            const col = db.collection(c.name);
            const count = await col.countDocuments();
            process.stdout.write(`Checking ${c.name} (${count})... `);
            const docs = await col.find().toArray();
            let bad = 0;
            docs.forEach(d => {
                if (findInDoc(d)) {
                    console.log(`\nBAD DOC in ${c.name}: ID=${d._id}`);
                    bad++;
                    // Optional: Print where it is
                    Object.keys(d).forEach(k => {
                        const valJson = JSON.stringify(d[k]);
                        if (valJson && valJson.includes("[object Object]")) {
                            console.log(`   Field '${k}': ${valJson}`);
                        }
                    });
                }
            });
            if (bad === 0) {
                console.log("OK");
            }
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runSearch();
