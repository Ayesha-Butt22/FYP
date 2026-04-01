const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const findInDoc = (doc, path = '') => {
  let found = [];
  if (doc && typeof doc === 'object') {
    Object.keys(doc).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const val = doc[key];
      if (typeof val === 'string' && val.includes('[object Object]')) {
        found.push({ path: currentPath, value: val });
      } else if (Array.isArray(val)) {
        val.forEach((item, i) => {
          found = found.concat(findInDoc(item, `${currentPath}[${i}]`));
        });
      } else if (typeof val === 'object' && val !== null) {
        found = found.concat(findInDoc(val, currentPath));
      }
    });
  }
  return found;
};

const runSearch = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    let finalReport = '';

    for (const c of collections) {
      const col = db.collection(c.name);
      const docs = await col.find().toArray();
      let colReport = '';
      docs.forEach(doc => {
        const issues = findInDoc(doc);
        if (issues.length > 0) {
          colReport += `Doc ID: ${doc._id}\n`;
          issues.forEach(iss => colReport += `  - ${iss.path}: ${iss.value}\n`);
        }
      });
      if (colReport) {
        finalReport += `Collection: ${c.name}\n${colReport}\n`;
      }
    }

    if (finalReport) {
      console.log("FOUND ISSUES!");
      console.log(finalReport);
    } else {
      console.log("NO ISSUES FOUND.");
    }
    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

runSearch();
