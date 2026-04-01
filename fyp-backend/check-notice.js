const mongoose = require('mongoose');
require('dotenv').config();

const checkNotice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const col = mongoose.connection.db.collection("noticeboards");
        const docs = await col.find({}).toArray();
        console.log("Notices found:", docs.length);
        docs.forEach(d => {
           console.log("Notice ID:", d._id, "postedBy:", d.postedBy);
        });
        process.exit();
    } catch (e) {
        process.exit(1);
    }
}
checkNotice();
