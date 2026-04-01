const committeeEvaluationRoutes = require("c:/Users/PC/Downloads/Auto-FYP2/Auto-FYP/fyp-backend/routes/committeeEvaluation.js");
const express = require("express");
const app = express();
app.use("/api/committee-evaluation", committeeEvaluationRoutes);

// Trigger router initialization
app.get('/dummy', (req, res) => {});

console.log("Exploring router stack:");
const stack = app._router ? app._router.stack : (app.router ? app.router.stack : []);

function printStack(layers, prefix = "") {
    layers.forEach(layer => {
        if (layer.route) {
            console.log(`- ${Object.keys(layer.route.methods).join(",").toUpperCase()} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router') {
            const newPrefix = prefix + (layer.regexp.source.replace(/\\\//g, '/').replace(/\?\:\/\?\(\?\=\/\|\$\)/, '').replace(/^\^/, '').replace(/\/$/, ''));
            printStack(layer.handle.stack, newPrefix);
        }
    });
}

printStack(app._router.stack);
