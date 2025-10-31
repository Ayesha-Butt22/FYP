require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

/**
 * Serve uploaded files statically from /Filesk
 * Ensure the folder fyp-backend/Filesk exists (the FileRouter will create it if needed),
 * and files saved there will be available at: http://<server>/Filesk/<filename>
 */
app.use('/Filesk', express.static(path.join(__dirname, 'Filesk')));

// Route mounts
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Group CRUD routes
app.use('/api/groups', require('./routes/studentgroup'));

// Groups info route (groups + members + proposals)

app.use("/api/groups", require("./routes/groupsInfoRoutes"));


// Proposals routes (studentproposal)
app.use('/api/proposals', require('./routes/studentproposal'));

// Student routes
app.use("/api/student", require("./routes/student"));

// Other feature routes
app.use('/api/reports', require('./routes/reports'));
app.use('/api/files', require('./routes/FileRouter'));
app.use("/api/profile-pic", require("./routes/profile"));
app.use("/api/deadline", require("./routes/deadline"));

// Test route
app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));