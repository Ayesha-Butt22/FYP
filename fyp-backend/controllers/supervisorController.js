// supervisorController.js


const Proposal = require("../models/StudentProposal");
const Group = require("../models/StudentGroup");
const User = require("../models/User");
const Template = require("../models/StudentUploadedTemplate");
const MeetingSlot = require("../models/MeetingSlot"); // Use MeetingSlot instead of Meeting
const SupervisorEvaluation = require("../models/SupervisorEvaluation");
const CommitteeEvaluation = require("../models/CommitteeEvaluation");
const mongoose = require("mongoose");

// GET RECENT ACTIVITIES FOR SUPERVISOR
exports.getRecentActivities = async (req, res) => {
  try {
    console.log("getRecentActivities called by:", req.user?.email);
    const supervisorEmail = req.user.email;

    // Get recent proposals reviewed (last 3)
    const recentProposals = await Proposal.find({
      projectSupervisor: supervisorEmail
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('groupId');

    // Get recent meetings (last 3)
    const recentMeetings = await MeetingSlot.find({
      supervisorEmail: supervisorEmail
    })
      .sort({ createdAt: -1 })
      .limit(3);

    // Get recent groups assigned to this supervisor (last 3)
    const recentGroups = await Group.find({
      isArchived: { $ne: true },
      $or: [
        { supervisor: supervisorEmail },
        { 'leader.email': supervisorEmail }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(3);

    const activities = [];

    // Activity 1: Most Recent Proposal
    if (recentProposals.length > 0) {
      const proposal = recentProposals[0];
      const groupId = proposal.groupId?.groupId || 'Unknown Group';
      const maskedGroupId = maskGroupId(groupId);
      const timeAgo = getTimeAgo(proposal.updatedAt || proposal.createdAt);

      let action = 'submitted';
      if (proposal.projectStatus === 2) action = 'approved';
      else if (proposal.projectStatus === 3) action = 'rejected';
      else if (proposal.projectStatus === 1) action = 'reviewed';

      activities.push({
        type: "proposal",
        text: `${action.charAt(0).toUpperCase() + action.slice(1)} proposal for ${maskedGroupId}`,
        time: timeAgo
      });
    } else {
      activities.push({
        type: "proposal",
        text: "No proposals reviewed yet",
        time: "Recently"
      });
    }

    // Activity 2: Most Recent Meeting
    if (recentMeetings.length > 0) {
      const meeting = recentMeetings[0];
      const timeAgo = getTimeAgo(meeting.meetingDate || meeting.createdAt);
      const groupId = meeting.groupId || 'Unknown Group';
      const maskedGroupId = maskGroupId(groupId);

      activities.push({
        type: "meeting",
        text: `Scheduled meeting with ${maskedGroupId}`,
        time: timeAgo
      });
    } else {
      activities.push({
        type: "meeting",
        text: "No meetings scheduled yet",
        time: "Recently"
      });
    }

    // Activity 3: Most Recent Group Assignment
    if (recentGroups.length > 0) {
      const group = recentGroups[0];
      const timeAgo = getTimeAgo(group.createdAt);
      const groupId = group.groupId || 'New Group';
      const maskedGroupId = maskGroupId(groupId);

      activities.push({
        type: "evaluation",
        text: `Evaluated milestone for ${maskedGroupId}`,
        time: timeAgo
      });
    } else {
      activities.push({
        type: "evaluation",
        text: "No groups assigned yet",
        time: "Recently"
      });
    }

    res.status(200).json({
      success: true,
      activities
    });

  } catch (error) {
    console.error("Error fetching supervisor activities:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// GET SUPERVISOR STATS
exports.getSupervisorStats = async (req, res) => {
  try {
    console.log("getSupervisorStats called by:", req.user?.email);
    const supervisorEmail = req.user.email;

    // 1. Groups Assigned
    const proposals = await Proposal.find({ projectSupervisor: supervisorEmail });
    const groupsAssigned = proposals.length;

    // 2. Pending Proposals (for this supervisor's specialization/assigned groups)
    // Actually, usually supervisors only see their own groups' proposals.
    // If projectStatus is 1 (Under Review), it's pending.
    const pendingProposals = proposals.filter(p => p.projectStatus === 1).length;

    // 3. Upcoming Meetings
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const upcomingMeetings = await MeetingSlot.find({
      supervisorEmail,
      date: { $gte: todayStr },
      status: 1 // Booked
    }).countDocuments();

    const evaluationsDue = await Template.countDocuments({
      status: "Pending"
    });

    // 5. Aggregate Milestone Progress (Average % across all groups)
    let totalProgressPercent = 0;
    if (groupsAssigned > 0) {
      const allGroupProposals = await Proposal.find({ projectSupervisor: supervisorEmail }).select("groupId");
      const groupIds = allGroupProposals.map(p => p.groupId).filter(Boolean);

      for (const gid of groupIds) {
        // FYP-1: 6 milestones (t01, t02, t03, t04, t05, t07)
        const approvedFYP1 = await Template.countDocuments({ groupId: gid, fypPart: 1, templateCode: { $in: ["t01", "t02", "t03", "t04", "t05", "t07"] }, status: "Approved" });
        // FYP-2: 2 milestones (t05, t06)
        const approvedFYP2 = await Template.countDocuments({ groupId: gid, fypPart: 2, templateCode: { $in: ["t05", "t06"] }, status: "Approved" });
        totalProgressPercent += ((approvedFYP1 + approvedFYP2) / 8) * 100;
      }
      totalProgressPercent = Math.round(totalProgressPercent / groupsAssigned);
    }

    res.status(200).json({
      success: true,
      stats: {
        groupsAssigned,
        pendingProposals,
        upcomingMeetings,
        evaluationsDue,
        milestoneProgress: totalProgressPercent
      }
    });

  } catch (error) {
    console.error("Error fetching supervisor stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}


// GET GROUPS UNDER SUPERVISOR
exports.getSupervisorGroups = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;

    const proposals = await Proposal.find({ projectSupervisor: supervisorEmail })
      .populate({
        path: "groupId"
      });

    const result = [];

    for (const proposal of proposals) {
      const group = proposal.groupId;
      if (!group) continue;

      const emails = [
        group.leader?.email,
        group.member2?.email,
        group.member3?.email
      ].filter(Boolean);

      const users = await User.find(
        { email: { $in: emails } },
        { name: 1, sapId: 1, studentId: 1, _id: 0 }
      );

      // Fetch milestone progress (6 in FYP-1 + 2 in FYP-2 = 8 Total)
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

      // Check if group can be archived (all templates approved + committee results passed)
      const committeeEvals = await CommitteeEvaluation.find({
        groupId: group._id,
        isApprovedByCoordinator: true
      }).populate("scheduleId");

      const fyp1Passed = committeeEvals.some(e => e.scheduleId?.fypPart?.toLowerCase()?.replace("-", "") === "fyp1");
      const fyp2Passed = committeeEvals.some(e => e.scheduleId?.fypPart?.toLowerCase()?.replace("-", "") === "fyp2");

      const canArchive = (fyp1Count === 6 && fyp2Count === 2 && fyp1Passed && fyp2Passed);

      result.push({
        maskedGroupId: maskGroupId(group.groupId),
        groupId: (group._id),
        isArchived: group.isArchived || false,
        special: proposal.projectSpecialization,
        description: proposal.projectTitle || "No Description",
        members: users.map(u => ({ 
          name: u.name, 
          sapId: u.studentId || u.sapId || "N/A" 
        })),
        milestonesTotal: 8,
        milestonesCompleted: completedMilestones,
        canArchive: canArchive,
        status: proposal.projectStatus === 1 ? "Approved" : "Pending"
      });
    }

    res.status(200).json({
      success: true,
      groups: result
    });

  } catch (error) {
    console.error("Error fetching supervisor groups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch supervisor groups"
    });
  }
};

// Helper: Mask Group ID
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


exports.getGroupSubmission = async (req, res) => {
  const { groupId } = req.params;
  try {
    const submissions = await Template.find({ groupId });
    res.json({ submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }

}

exports.SubmitGroupreview = async (req, res) => {
  try {
    const { groupId, code } = req.params;
    const { note, status, fypPart } = req.body;

    if (!groupId || !code) {
      return res.status(400).json({ success: false, message: "Missing groupId or templateCode" });
    }

    const query = { groupId, templateCode: code };
    if (fypPart) query.fypPart = Number(fypPart);

    console.log(`[SubmitGroupreview] Querying for:`, query);
    
    const submission = await Template.findOne(query);
    if (!submission) {
      console.log(`[SubmitGroupreview] Submission NOT FOUND for query:`, query);
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    console.log(`[SubmitGroupreview] Found submission. Updating status to: ${status}`);
    submission.status = status;
    submission.supervisorRemarks = note || "";

    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Submission updated successfully",
      submission,
    });
  } catch (err) {
    console.error("Error updating submission:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// SUBMIT SUPERVISOR EVALUATION
exports.submitSupervisorEvaluation = async (req, res) => {
  try {
    const { groupId, fypYear, evaluations, totalMarks } = req.body;
    const evaluatedBy = req.user._id;

    if (!groupId || !fypYear || !evaluations || !Array.isArray(evaluations)) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Prevent duplicate evaluation for same group + fypYear by same supervisor
    const gidStr = typeof groupId === "object" ? (groupId._id || groupId.id) : String(groupId);

    const existing = await SupervisorEvaluation.findOne({
      groupId: gidStr,
      fypYear,
      evaluatedBy
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an evaluation for this group and FYP year."
      });
    }

    const newEvaluation = new SupervisorEvaluation({
      groupId: gidStr,  // store as display string
      fypYear,
      evaluations,
      totalMarks,
      evaluatedBy
    });

    await newEvaluation.save();

    res.status(201).json({
      success: true,
      message: "Evaluation submitted successfully",
      evaluation: newEvaluation
    });
  } catch (error) {
    console.error("Error submitting supervisor evaluation:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// GET SUPERVISOR EVALUATIONS (By Group ID)
exports.getSupervisorEvaluations = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if group is archived first
    const group = await Group.findOne({ 
      $or: [{ _id: mongoose.isValidObjectId(groupId) ? groupId : null }, { groupId: String(groupId) }] 
    });

    const isArchived = group?.isArchived || false;
    const filter = { groupId: String(groupId) };
    
    // If not archived: show only published OR my own evaluations
    if (!isArchived) {
      filter.$or = [
        { isPublished: true },
        { evaluatedBy: req.user._id }
      ];
    }

    const evaluations = await SupervisorEvaluation.find(filter)
      .populate("evaluatedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, evaluations });
  } catch (error) {
    console.error("Error fetching supervisor evaluations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET STUDENT SUPERVISOR EVALUATIONS (By Email)
exports.getStudentSupervisorEvaluations = async (req, res) => {
  try {
    const { email } = req.params;
    const Group = require("../models/StudentGroup");

    const group = await Group.findOne({
      $or: [
        { "leader.email": email },
        { "member2.email": email },
        { "member3.email": email }
      ]
    }).lean();

    if (!group) {
      return res.status(200).json({ success: true, evaluations: [] });
    }

    // Identify requesting student's official name from database
    const user = await User.findOne({ email }).select("name");
    const requesterMember = ["leader", "member2", "member3"].find(k => group[k]?.email === email);
    const officialName = user ? user.name : (requesterMember ? group[requesterMember]?.name : "");

    const rawEvaluations = await SupervisorEvaluation.find({
      groupId: { $in: [String(group._id), String(group.groupId)] },
      isPublished: true
    })
      .populate("evaluatedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Filter to only show requester's evaluation (case-insensitive)
    const evaluations = rawEvaluations.map(doc => {
      doc.evaluations = (doc.evaluations || []).filter(ev => {
        const evName = String(ev.studentName || ev.name || "").trim().toLowerCase();
        const reqName = String(officialName).trim().toLowerCase();
        return evName === reqName || evName.includes(reqName) || reqName.includes(evName);
      });
      return doc;
    });

    res.status(200).json({ success: true, evaluations });
  } catch (error) {
    console.error("Error fetching student supervisor evaluations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};





exports.archiveGroup = async (req, res) => {
  try {
    const { mongoId } = req.body;
    const supervisorEmail = req.user.email;

    if (!mongoId) return res.status(400).json({ success: false, message: "Group ID is required" });

    const group = await Group.findById(mongoId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const proposal = await Proposal.findOne({ groupId: mongoId });
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });

    // Verify ownership
    if (proposal.projectSupervisor !== supervisorEmail) {
      return res.status(403).json({ success: false, message: "You are not the supervisor of this group." });
    }

    // --- VALIDATION CHECK ---
    // 1. Check Templates
    // FYP 1: t01, t02, t03, t04, t05, t07 must be Approved
    const fyp1ApprovedTemplates = await Template.countDocuments({
      groupId: mongoId,
      fypPart: 1,
      templateCode: { $in: ["t01", "t02", "t03", "t04", "t05", "t07"] },
      status: "Approved"
    });

    if (fyp1ApprovedTemplates < 6) {
      return res.status(400).json({
        success: false,
        message: "Archiving failed: All 6 templates for FYP-1 (t01, t02, t03, t04, t05, t07) must be approved first."
      });
    }

    // FYP 2: t05 and t06 must be Approved
    const fyp2ApprovedTemplates = await Template.countDocuments({
      groupId: mongoId,
      fypPart: 2,
      templateCode: { $in: ["t05", "t06"] },
      status: "Approved"
    });

    if (fyp2ApprovedTemplates < 2) {
      return res.status(400).json({
        success: false,
        message: "Archiving failed: Both required templates (t05 and t06) for FYP-2 must be approved first."
      });
    }

    // 2. Check Committee Evaluations (Pass Check)
    const evals = await CommitteeEvaluation.find({
      groupId: mongoId,
      isApprovedByCoordinator: true
    }).populate("scheduleId");

    const fyp1Passed = evals.some(e => e.scheduleId?.fypPart?.toLowerCase()?.replace("-", "") === "fyp1");
    const fyp2Passed = evals.some(e => e.scheduleId?.fypPart?.toLowerCase()?.replace("-", "") === "fyp2");

    if (!fyp1Passed || !fyp2Passed) {
      return res.status(400).json({
        success: false,
        message: "Archiving failed: Both FYP-1 and FYP-2 must be officially passed (published results by coordinator)."
      });
    }

    // --- EXECUTE ARCHIVE ---

    // 1. Mark group as archived
    group.isArchived = true;
    await group.save();

    // 2. Create ArchiveProject
    const ArchiveProject = require("../models/ArchiveProject");
    const newArchive = new ArchiveProject({
      title: proposal.projectTitle,
      description: proposal.projectDescription,
      technologies: proposal.projectTools ? proposal.projectTools.split(",").map(s => s.trim()) : [],
      supervisor: proposal.projectSupervisor,
      archivedAt: new Date()
    });
    await newArchive.save();

    res.json({ success: true, message: "Group moved to archive successfully." });

  } catch (error) {
    console.error("ArchiveGroup Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};