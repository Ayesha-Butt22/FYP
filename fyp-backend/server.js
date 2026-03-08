require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// =============== CRITICAL: Add static file serving ===============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Filesk', express.static(path.join(__dirname, 'Filesk')));
// ================================================================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const NoticeboardRoutes = require("./routes/NoticeboardRoutes")
const SupervisorWhiteboardRoutes = require("./routes/SupervisorWhiteboardRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const committeeevaluationRoutes = require("./routes/committeEvalution");
const projectIdeasRoutes = require("./routes/projectIdeasRoutes");

app.use("/api/committee-evaluation", require("./routes/evaluationRoutes"));

const journalRoutes = require("./routes/journalRoutes");






// =============== NEW: Import Template Routes ===============
const templateRoutes = require("./routes/templateRoutes");

const taskRoutes = require("./routes/taskRoutes");



const meetingRoutes = require("./routes/meetingRoutes");

const activityRoutes = require("./routes/activityRoutes");




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
app.use("/api/deadline", require('./routes/deadline'));
app.use("/api/noticeboard", NoticeboardRoutes);
app.use("/api/supervisor", require("./routes/supervisorRoutes"));
app.use("/api/deadlineSchedule" , require("./routes/deadlineSchedule"));


app.use("/api/supervisor-whiteboard", SupervisorWhiteboardRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/committee-evaluation", committeeevaluationRoutes);
app.use("/api/project-ideas", projectIdeasRoutes);
app.use("/api/meetings", require("./routes/meetingRoutes"));

app.use("/api/semester-start", require("./routes/semesterStartRoutes"));
app.use("/uploads", express.static("uploads"));
app.use("/api/student-templates", require("./routes/studentTemplateRoutes"));


app.use("/api/journal", journalRoutes);


// =============== NEW: Add Template Routes Here ===============
app.use("/api/templates", templateRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activity", activityRoutes);

// Test route
app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));