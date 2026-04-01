const mongoose = require('mongoose');
require('dotenv').config();

const checkSupEval = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const SupervisorEvaluation = require('./models/SupervisorEvaluation');
        const docs = await SupervisorEvaluation.find({}).lean();
        console.log("SupervisorEvaluation count:", docs.length);
        docs.forEach(d => {
           if (JSON.stringify(d).includes("[object Object]")) {
              console.log("BAD DOC:", d._id);
              Object.keys(d).forEach(k => {
                 if (String(d[k]).includes("[object Object]")) {
                    console.log(`   Field: ${k}, Value: ${d[k]}`);
                 }
              });
           }
        });
        process.exit();
    } catch (e) {
        process.exit(1);
    }
}
checkSupEval();
