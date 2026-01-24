// supervisorController.js


const Proposal = require("../models/StudentProposal");
const Group = require("../models/StudentGroup");
const User = require("../models/User");
const Template = require("../models/StudentUploadedTemplate");

// GET RECENT ACTIVITIES FOR SUPERVISOR
exports.getRecentActivities = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;

    // Get recent proposals reviewed (last 3)
    const recentProposals = await Proposal.find({
      projectSupervisor: supervisorEmail
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('groupId');

    // Get recent meetings (last 3)
    const recentMeetings = await Meeting.find({
      supervisorEmail: supervisorEmail
    })
    .sort({ createdAt: -1 })
    .limit(3);

    // Get recent groups assigned to this supervisor (last 3)
    const recentGroups = await Group.find({
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
      .populate("groupId");

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
        { name: 1, _id: 0 }
      );

      result.push({
        maskedGroupId: maskGroupId(group.groupId),
        groupId: (group._id),
        special: proposal.projectSpecialization,
        description: proposal.projectTitle || "No Description",
        members: users.map(u => u.name)
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
    const {groupId} = req.params;
    try {
        const submissions = await Template.find({groupId});
        res.json({submissions});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Failed to fetch submissions"});
    }

}

exports.SubmitGroupreview = async (req, res) => {
    try {
        const { groupId, code } = req.params;
        const { note, status } = req.body;

        if (!groupId || !code) {
            return res.status(400).json({ success: false, message: "Missing groupId or templateCode" });
        }

        const submission = await Template.findOne({ groupId, templateCode: code });
        if (!submission) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }


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





