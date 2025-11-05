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

const NoticeboardRoutes = require("./routes/NoticeboardRoutes")
const SupervisorWhiteboardRoutes = require("./routes/SupervisorWhiteboardRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const committeeevaluationRoutes = require("./routes/committeEvalution");



app.use('/Filesk', express.static(path.join(__dirname, 'Filesk')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/groups', require('./routes/studentgroup'));
app.use("/api/groupsinfo", require("./routes/groupsInfoRoutes"));
app.use('/api/proposals', require('./routes/studentproposal'));
app.use("/api/student", require("./routes/student"));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/files', require('./routes/FileRouter'));
app.use("/api/profile-pic", require("./routes/profile"));
app.use("/api/deadline", require("./routes/deadline"));
app.use("/api/noticeboard", NoticeboardRoutes);
app.use("/api/deadlineSchedule", require("./routes/deadlineSchedule"));

app.use("/api/supervisor-whiteboard", SupervisorWhiteboardRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/committee-evaluation", committeeevaluationRoutes);



// Test route
app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));