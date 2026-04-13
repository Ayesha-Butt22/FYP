require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// =============== Static file serving ===============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Filesk', express.static(path.join(__dirname, 'Filesk')));
// ================================================================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// =============== Import All Routes ===============
const NoticeboardRoutes = require("./routes/NoticeboardRoutes")
const SupervisorWhiteboardRoutes = require("./routes/SupervisorWhiteboardRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const committeeEvaluationRoutes = require("./routes/committeeEvaluation");
const projectIdeasRoutes = require("./routes/projectIdeasRoutes");
const journalRoutes = require("./routes/journalRoutes");
const templateRoutes = require("./routes/templateRoutes");
const taskRoutes = require("./routes/taskRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

// =============== Register All Routes ===============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/groups', require('./routes/studentgroup'));
app.use("/api/groupsinfo", require("./routes/groupsInfoRoutes"));
app.use('/api/proposals', require('./routes/studentproposal'));
app.use("/api/student", require("./routes/student"));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/files', require('./routes/FileRouter'));
app.use("/api/profile-pic", require("./routes/profile"));
app.use("/api/deadline", require('./routes/deadline'));
app.use("/api/noticeboard", NoticeboardRoutes);
app.use("/api/supervisor", require("./routes/supervisorRoutes"));
app.use("/api/coordinator", require("./routes/coordinatorRoutes"));
app.use("/api/deadlineSchedule", require("./routes/deadlineSchedule"));
app.use("/api/supervisor-whiteboard", SupervisorWhiteboardRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/committee-evaluation", committeeEvaluationRoutes);
app.use("/api/project-ideas", projectIdeasRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/semester-start", require("./routes/semesterStartRoutes"));
app.use("/api/student-templates", require("./routes/studentTemplateRoutes"));
app.use("/api/journal", journalRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/archive", require("./routes/archive"));

// =============== Test Routes ===============
app.get('/api/test-stats', (req, res) => res.json({ success: true, message: "API is reachable" }));

// Test route
app.get('/', (req, res) => res.send('API Running'));

// =============== 404 Handler ===============
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// =============== Global Error Handler ===============
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));