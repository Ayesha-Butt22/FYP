const getStudentMetaData = require("./getStudentMetaData");
const MeetingSlot = require("../models/MeetingSlot");
const Task = require("../models/Task");
const Template = require("../models/Template");

exports.getFYPJournal = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Student email is required" });

    const { group } = await getStudentMetaData({ email });
    if (!group) return res.status(404).json({ message: "No group found for this student" });

    const groupId = group._id;

    const now = new Date();
    const lastMonths = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      lastMonths.push({
        monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        monthLabel: d.toLocaleString(undefined, { month: "long", year: "numeric" })
      });
    }

    const meetings = await MeetingSlot.find({ bookedBy: email }).sort({ date: -1 });
    const tasks = await Task.find({ groupId }).sort({ createDate: -1 });
    const templates = await Template.find({ uploadedBy: email }).sort({ createdAt: -1 });

    const monthsWithActivities = lastMonths.map(({ monthKey, monthLabel }) => {
      const [year, month] = monthKey.split("-").map(Number);

      const monthMeetings = meetings.filter((m) => {
        const d = new Date(m.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }).map((m) => ({
        type: "Meeting",
        title: `Meeting with ${m.supervisorEmail || "Supervisor"}`,
        description: `${m.date} ${m.time}`,
        raw: m
      }));

      const monthTasks = tasks.filter((t) => {
        const d = new Date(t.createDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }).map((t) => ({
        type: "Task",
        title: t.title,
        description: `Created: ${t.createDate.toISOString().slice(0,10)} • Status: ${t.status} • Last Comment: ${t.comments?.length ? t.comments[t.comments.length-1].text : "-"}`,
        raw: t
      }));

      const monthTemplates = templates.filter((tp) => {
        const d = new Date(tp.createdAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }).map((tp) => ({
        type: "Template",
        title: tp.template,
        description: `Uploaded: ${tp.createdAt.toISOString().slice(0,10)} • Supervisor Comment: -`,
        raw: tp
      }));

      const activities = [...monthMeetings, ...monthTasks, ...monthTemplates]
        .sort((a, b) => new Date(b.raw.createDate || b.raw.date || b.raw.createdAt) - new Date(a.raw.createDate || a.raw.date || a.raw.createdAt));

      return { monthKey, monthLabel, activities };
    });

    res.json({ months: monthsWithActivities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch journal", error: err.message });
  }
};
