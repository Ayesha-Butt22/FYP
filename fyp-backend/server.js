require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

/**
 * Serve uploaded files statically from /Filesk
 * Ensure the folder fyp-backend/Filesk exists (the FileRouter will create it if needed),
 * and files saved there will be available at: http://<server>/Filesk/<filename>
 */
app.use('/Filesk', express.static(path.join(__dirname, 'Filesk')));

/**
 * Existing API routes - keep these as in your project
 */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/groups', require('./routes/studentgroup'));       // Group CRUD
app.use('/api/proposals', require('./routes/studentproposal'));
app.use("/api/student", require("./routes/student"));

/**
 * Files API: upload/list/get/delete
 * FileRouter at: fyp-backend/routes/FileRouter.js
 */
app.use('/api/files', require('./routes/FileRouter'));

// Test route
app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));