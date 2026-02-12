const getStudentMetaData = require("./getStudentMetaData");
const MeetingSlot = require("../models/MeetingSlot");
const Task = require("../models/Task");
const Template = require("../models/StudentUploadedTemplate");



exports.getFYPJournal = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // STEP 1: Get group metadata
    const { group } = await getStudentMetaData({ email });
    if (!group) return res.status(404).json({ message: "Student group not found" });

    const groupId = group._id;

    // STEP 2: Determine last 3 months (fixed with local time)
    const now = new Date();
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

      // Month key in YYYY-MM (local)
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0"); // getMonth() is 0-indexed
      const key = `${year}-${month}`;

      // Month label
      const monthName = d.toLocaleString("en-US", { month: "long" });
      months.push({
        key,
        label: `${monthName} ${year}`,
      });
    }

    // STEP 3: Fetch meetings
    const meetingsRaw = await MeetingSlot.find({ bookedBy: groupId }).lean();
    const meetings = meetingsRaw.map((m) => ({
      dateISO: new Date(m.date).toISOString().slice(0, 10),
      type: "Meeting",
      title: `Meeting with ${group.supervisorName || "Supervisor"}`,
      description: `${new Date(m.date).toLocaleDateString()} ${m.time}`,
    }));

    // STEP 4: Fetch tasks
    const tasksRaw = await Task.find({ groupId }).lean();
    const tasks = tasksRaw.map((t) => {
      const lastComment = t.comments?.length ? t.comments[t.comments.length - 1] : null;
      return {
        dateISO: new Date(t.createDate).toISOString().slice(0, 10),
        type: "Task",
        title: t.title,
        description: `Created by ${t.createdByName}${lastComment ? ` • Last comment by ${lastComment.author}` : ""}`,
      };
    });

    // STEP 5: Fetch templates
    const templatesRaw = await Template.find({groupId}).lean();
    const templates = templatesRaw.map((t) => ({
      dateISO: new Date(t.uploadedAt).toISOString().slice(0, 10),
      type: "Template",
      title: t.templateLabel,
      description: `Uploaded on ${new Date(t.uploadedAt).toLocaleDateString()}${t.supervisorRemarks ? ` • ${t.supervisorRemarks}` : ""}`,
    }));

    // STEP 6: Merge all activities
    const allActivities = [...meetings, ...tasks, ...templates];

    // STEP 7: Group by month correctly
    const grouped = months.map((m) => {
      const acts = allActivities
        .filter((a) => a.dateISO.startsWith(m.key))
        .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
      return {
        monthKey: m.key,
        monthLabel: m.label,
        activities: acts,
      };
    });

    res.json({ months: grouped });
  } catch (err) {
    console.error("getFYPJournal error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
