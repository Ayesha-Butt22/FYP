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

// 🆕 GET GROUPS WITH COMPLETE DETAILS FOR SUPERVISOR GROUPS PAGE
exports.getSupervisorGroupsWithDetails = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;
    
    console.log('🔍 Fetching groups for supervisor:', supervisorEmail);

    // Step 1: Find all proposals assigned to this supervisor
    const proposals = await Proposal.find({ projectSupervisor: supervisorEmail })
      .populate('groupId')
      .lean();

    console.log('📝 Proposals found:', proposals.length);

    if (!proposals || proposals.length === 0) {
      return res.json({
        success: true,
        count: 0,
        groups: []
      });
    }

    // Step 2: Get unique group IDs
    const groupIds = proposals
      .map(p => p.groupId)
      .filter(Boolean)
      .map(g => g._id);

    // Step 3: Get all groups
    const groups = await Group.find({ _id: { $in: groupIds } }).lean();

    // Step 4: Collect all member emails
    const emailsSet = new Set();
    groups.forEach(g => {
      if (g.leader?.email) emailsSet.add(g.leader.email);
      if (g.member2?.email) emailsSet.add(g.member2.email);
      if (g.member3?.email) emailsSet.add(g.member3.email);
    });

    // Step 5: Fetch user details for all members
    const emails = Array.from(emailsSet);
    const users = await User.find({ email: { $in: emails } })
      .select('email name sapId studentId')
      .lean();

    const userByEmail = {};
    users.forEach(u => {
      userByEmail[u.email] = u;
    });

    // Step 6: Build response with enriched data
    const enrichedGroups = groups.map((group, index) => {
      const gid = String(group._id);
      
      // Find proposal for this group
      const proposal = proposals.find(p => String(p.groupId._id) === gid);
      
      // Build members array with names
      const members = [];
      
      ['leader', 'member2', 'member3'].forEach(role => {
        if (group[role]?.email) {
          const user = userByEmail[group[role].email];
          members.push({
            name: user?.name || extractNameFromEmail(group[role].email),
            sapId: group[role].sapId || user?.sapId || user?.studentId || 'N/A',
            email: group[role].email,
            role: role
          });
        }
      });

      // Determine proposal status
      let proposalStatus = 'Pending';
      if (proposal?.projectStatus === 1) proposalStatus = 'Approved';
      else if (proposal?.projectStatus === 2) proposalStatus = 'Rejected';
      else if (proposal?.projectStatus === 0) proposalStatus = 'Pending';

      // Mock milestones data
      const milestonesTotal = 5;
      const milestonesCompleted = calculateMilestonesCompleted(proposal);

      return {
        groupNo: index + 1,
        groupId: group.groupId,
        _id: group._id,
        title: proposal?.projectTitle || 'Untitled Project',
        proposalStatus: proposalStatus,
        program: proposal?.projectSpecialization || 'Software Engineering',
        milestonesTotal: milestonesTotal,
        milestonesCompleted: milestonesCompleted,
        progress: Math.round((milestonesCompleted / milestonesTotal) * 100),
        members: members,
        projectDescription: proposal?.projectDescription || '',
        projectTools: proposal?.projectTools || '',
        supervisorComments: proposal?.projectSupervisorComments || '',
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        proposalId: proposal?._id
      };
    });

    console.log('✅ Returning', enrichedGroups.length, 'groups');

    res.json({
      success: true,
      count: enrichedGroups.length,
      groups: enrichedGroups
    });

  } catch (error) {
    console.error('❌ Error fetching supervisor groups:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

// Helper function to extract name from email
function extractNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'Student';
  const local = email.split('@')[0] || '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return local;
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to calculate milestones completed
function calculateMilestonesCompleted(proposal) {
  if (!proposal) return 0;
  
  // Basic calculation based on proposal status
  if (proposal.projectStatus === 1) return 4; // Approved = 4/5 milestones
  if (proposal.projectStatus === 0) return 2; // Pending = 2/5 milestones
  if (proposal.projectStatus === 2) return 1; // Rejected = 1/5 milestones
  
  return 0;
}

/**
 * Get supervisor's groups with their submission data for reports
 */
exports.getSupervisorGroupsForReports = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;

    console.log('🔍 Fetching report data for supervisor:', supervisorEmail);

    // Step 1: Find all proposals assigned to this supervisor
    const proposals = await Proposal.find({ projectSupervisor: supervisorEmail })
      .populate('groupId')
      .lean();

    if (!proposals || proposals.length === 0) {
      return res.json({
        success: true,
        count: 0,
        groups: []
      });
    }

    // Step 2: Process each group
    const groupsData = [];

    for (const proposal of proposals) {
      const group = proposal.groupId;
      if (!group) continue;

      // Get member names
      const emails = [
        group.leader?.email,
        group.member2?.email,
        group.member3?.email
      ].filter(Boolean);

      const users = await User.find({ email: { $in: emails } })
        .select('email name')
        .lean();

      const memberNames = users.map(u => u.name);

      // Get all submissions for this group
      const submissions = await Template.find({ 
        groupId: group._id 
      })
      .sort({ week: 1 })
      .lean();

      // Format submissions data
      const milestones = submissions.map(sub => ({
        week: sub.week,
        templateCode: sub.templateCode,
        templateLabel: sub.templateLabel,
        status: sub.status,
        feedback: sub.supervisorRemarks || '',
        uploadedAt: sub.uploadedAt,
        fileName: sub.originalName,
        filePath: sub.filePath
      }));

      groupsData.push({
        id: group.groupId,
        _id: group._id,
        title: proposal.projectTitle || 'Untitled Project',
        members: memberNames,
        milestones: milestones
      });
    }

    console.log('✅ Returning', groupsData.length, 'groups for reports');

    res.json({
      success: true,
      count: groupsData.length,
      groups: groupsData
    });

  } catch (error) {
    console.error('❌ Error fetching supervisor reports:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

/**
 * Get detailed report for a specific group
 */
exports.getGroupDetailedReport = async (req, res) => {
  try {
    const { groupId } = req.params;
    const supervisorEmail = req.user.email;

    // Find the group
    const group = await Group.findById(groupId).lean();
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Find proposal for this group
    const proposal = await Proposal.findOne({ 
      groupId: groupId,
      projectSupervisor: supervisorEmail 
    }).lean();

    if (!proposal) {
      return res.status(403).json({
        success: false,
        message: 'You are not the supervisor for this group'
      });
    }

    // Get member names
    const emails = [
      group.leader?.email,
      group.member2?.email,
      group.member3?.email
    ].filter(Boolean);

    const users = await User.find({ email: { $in: emails } })
      .select('email name')
      .lean();

    const memberNames = users.map(u => u.name);

    // Get all submissions
    const submissions = await Template.find({ 
      groupId: groupId 
    })
    .sort({ week: 1 })
    .lean();

    // Format response
    const reportData = {
      groupId: group.groupId,
      title: proposal.projectTitle || 'Untitled Project',
      members: memberNames,
      milestones: submissions.map(sub => ({
        week: sub.week,
        templateCode: sub.templateCode,
        templateLabel: sub.templateLabel,
        status: sub.status,
        feedback: sub.supervisorRemarks || '',
        uploadedAt: sub.uploadedAt,
        fileName: sub.originalName,
        filePath: sub.filePath
      })),
      proposalDetails: {
        description: proposal.projectDescription,
        specialization: proposal.projectSpecialization,
        tools: proposal.projectTools
      }
    };

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error fetching group detailed report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

/**
 * Update submission feedback/status
 */
exports.updateSubmissionFeedback = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, feedback } = req.body;

    const submission = await Template.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    if (status) submission.status = status;
    if (feedback !== undefined) submission.supervisorRemarks = feedback;

    await submission.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};


