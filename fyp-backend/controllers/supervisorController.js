// supervisorController.js


const Proposal = require("../models/StudentProposal");
const Group = require("../models/StudentGroup");
const User = require("../models/User");

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

// Helper function to mask group IDs
function maskGroupId(originalId) {
  if (!originalId) return 'Group-001';
  
  const strId = originalId.toString();
  

  if (strId.toLowerCase().startsWith('group-')) {
    return `Group-${strId.substring(6, 9)}`; 
  }
  
  if (strId.length > 5 && /^\d+$/.test(strId)) {
    const shortId = parseInt(strId.substring(strId.length - 3));
    return `Group-${String(shortId).padStart(3, '0')}`;
  }
  
  if (strId.length === 24) { 
    return `Group-${strId.substring(18, 21).toUpperCase()}`;
  }
  
  return `Group-${strId.substring(0, 3).toUpperCase()}`;
}

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
    console.log(supervisorEmail);
    // 1. Get proposals supervised by this supervisor
    const proposals = await Proposal.find({ projectSupervisor: supervisorEmail })
      .populate("groupId");

    const result = [];

    for (const proposal of proposals) {
      const group = proposal.groupId;
      if (!group) continue;

      // 2. Collect member emails safely
      const emails = [
        group.leader?.email,
        group.member2?.email,
        group.member3?.email
      ].filter(Boolean);

      // 3. Fetch user names from User collection
      const users = await User.find(
        { email: { $in: emails } },
        { name: 1, _id: 0 }
      );

      result.push({
        maskedGroupId: maskGroupId(group.groupId),
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
  if (!originalId) return 'Group-001';
  const strId = originalId.toString();

  if (strId.toLowerCase().startsWith('group-')) {
    return `Group-${strId.substring(6, 9)}`; 
  }
  
  if (strId.length > 5 && /^\d+$/.test(strId)) {
    const shortId = parseInt(strId.substring(strId.length - 3));
    return `Group-${String(shortId).padStart(3, '0')}`;
  }

  if (strId.length === 24) { 
    return `Group-${strId.substring(18, 21).toUpperCase()}`;
  }

  return `Group-${strId.substring(0, 3).toUpperCase()}`;
}
