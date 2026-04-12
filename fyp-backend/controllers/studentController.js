const User = require("../models/User");
const Group = require("../models/StudentGroup");
const Proposal = require("../models/StudentProposal");
const Template = require("../models/StudentUploadedTemplate");
const MeetingSlot = require("../models/MeetingSlot");

function maskGroupId(originalId) {
  if (!originalId) return 'group-00000';
  const strId = originalId.toString().toLowerCase();
  if (strId.startsWith('group-')) {
      const numericPart = strId.replace('group-', '');
      const lastFive = numericPart.slice(-5);
      return `group-${lastFive}`;
  }
  if (/^\d+$/.test(strId)) {
      return `group-${strId.slice(-5)}`;
  }
  return 'group-00000';
}


exports.getAvailableSupervisors = async (req, res) => {
  const { spec } = req.params;
  const specs = spec
      ? spec.split(",").map((s) => s.trim())
      : [];
  const query = { role: "supervisor" };
  if (specs.length > 0) {
    query.$or = specs.map((sp) => ({
      specialization: { $regex: sp, $options: "i" },
    }));
  }
  try {
    const supervisors = await User.find(query)
        .select("name department specialization availableSlots bookedSlots email");

    res.status(200).json({
      success: true,
      count: supervisors.length,
      data: supervisors,
    });
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getStudentStats = async (req, res) => {
  try {
    const email = req.user.email;
    const group = await Group.findOne({
      $or: [
        { "leader.email": email },
        { "member2.email": email },
        { "member3.email": email }
      ]
    });

    if (!group) {
      return res.status(200).json({
        success: true,
        stats: {
          groupStatus: "No Group",
          proposalStatus: "N/A",
          nextMeeting: "TBD",
          milestonesCompleted: 0
        }
      });
    }

    const proposal = await Proposal.findOne({ groupId: group._id });
    // Calculate completed milestones:
    // FYP-1: 6 templates (t01, t02, t03, t04, t05, t07)
    // FYP-2: 2 templates (t05, t06)
    // Total = 8
    const fyp1Count = await Template.countDocuments({
      groupId: group._id,
      fypPart: 1,
      templateCode: { $in: ["t01", "t02", "t03", "t04", "t05", "t07"] },
      status: "Approved"
    });

    const fyp2Count = await Template.countDocuments({
      groupId: group._id,
      fypPart: 2,
      templateCode: { $in: ["t05", "t06"] },
      status: "Approved"
    });

    const completedMilestones = fyp1Count + fyp2Count;

    const nextMeeting = await MeetingSlot.findOne({
      bookedBy: group._id.toString(),
      status: 1,
      date: { $gte: new Date().toISOString().split('T')[0] }
    }).sort({ date: 1, time: 1 });

    res.json({
      success: true,
      stats: {
        groupStatus: "Formed",
        maskedGroupId: maskGroupId(group.groupId),
        proposalStatus: proposal ? (proposal.projectStatus === 1 ? "Approved" : proposal.projectStatus === 2 ? "Rejected" : "Pending") : "No Proposal",
        nextMeeting: nextMeeting ? `${nextMeeting.date} ${nextMeeting.time}` : "TBD",
        milestonesCompleted: completedMilestones
      }
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const email = req.user.email;

    const group = await Group.findOne({
      $or: [
        { "leader.email": email },
        { "member2.email": email },
        { "member3.email": email }
      ]
    });

    if (!group) {
      return res.json({ success: true, activities: [] });
    }

    const activities = [];

    // ✅ Recent submissions
    const recentSubmissions = await Template.find({
      groupId: group._id
    })
      .sort({ uploadedAt: -1, createdAt: -1 }) // fallback sort
      .limit(3);

    for (const sub of recentSubmissions) {
      activities.push({
        type: "feedback",
        text: `Submitted ${sub.templateLabel || "template"}`,
        time: sub.uploadedAt || sub.createdAt || new Date()
      });
    }

    // ✅ Recent meetings (FIXED ObjectId issue)
    const recentMeetings = await MeetingSlot.find({
      bookedBy: group._id   // ❗ important fix (no toString)
    })
      .sort({ updatedAt: -1 })
      .limit(3);

    for (const m of recentMeetings) {
      activities.push({
        type: "meeting",
        text: `Meeting with supervisor ${m.status === 2 ? "completed" : "booked"}`,
        time: m.status === 2
          ? (m.doneAt || m.updatedAt || new Date())
          : (m.updatedAt || new Date())
      });
    }

    // ✅ Final sorting + limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
      .slice(0, 5);

    res.json({
      success: true,
      activities: sortedActivities
    });

  } catch (error) {
    console.error("Error fetching student activities:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};