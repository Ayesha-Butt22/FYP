// controllers/reportController.js
const User = require("../models/User");
const Group = require("../models/StudentGroup");
const Proposal = require("../models/StudentProposal");

// API 1: All Students + Group + Proposal
exports.getAllStudentsWithGroupAndProposal = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email studentId department specialization")
      .lean();

    // Get all group IDs where any student is member
    const studentEmails = students.map(s => s.email);
    const groups = await Group.find({
      $or: [
        { "leader.email": { $in: studentEmails } },
        { "member2.email": { $in: studentEmails } },
        { "member3.email": { $in: studentEmails } }
      ]
    }).lean();

    const groupIds = groups.map(g => g._id);
    const proposals = await Proposal.find({ groupId: { $in: groupIds } })
      .select("projectTitle projectStatus projectSupervisor projectSupervisorComments")
      .lean();

    // Map: email → student
    const studentMap = {};
    students.forEach(s => { studentMap[s.email] = s; });

    // Map: groupId → group
    const groupMap = {};
    groups.forEach(g => { groupMap[g._id.toString()] = g; });

    // Map: groupId → proposal
    const proposalMap = {};
    proposals.forEach(p => { proposalMap[p.groupId.toString()] = p; });

    // Build final result
    const result = groups.map(group => {
      const groupIdStr = group._id.toString();

      const leader = studentMap[group.leader?.email] || null;
      const member2 = group.member2?.email ? studentMap[group.member2.email] || null : null;
      const member3 = group.member3?.email ? studentMap[group.member3.email] || null : null;

      return {
        group: {
          groupId: group.groupId,
          leader,
          member2,
          member3
        },
        proposal: proposalMap[groupIdStr] || null
      };
    });

    // Add students without groups
    const groupedEmails = new Set(
      groups.flatMap(g => [g.leader?.email, g.member2?.email, g.member3?.email].filter(Boolean))
    );

    const studentsWithoutGroup = students
      .filter(s => !groupedEmails.has(s.email))
      .map(s => ({
        group: null,
        proposal: null,
        student: s
      }));

    // Combine: grouped + ungrouped
    const finalResult = [
      ...result.map(r => ({
        ...r,
        student: r.group.leader // leader as representative
      })),
      ...studentsWithoutGroup
    ];

    res.json({
      success: true,
      count: finalResult.length,
      data: finalResult
    });

  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ error: err.message || "Server Error" });
  }
};

// API 2: Search by Emails
exports.getStudentsByEmails = async (req, res) => {
  try {
    const { emails } = req.query;

    if (!emails) {
      return res.status(400).json({ error: "Query param 'emails' is required" });
    }

    const emailArray = emails
      .split(",")
      .map(e => e.trim())
      .filter(e => e.includes("@students.riphah.edu.pk"));

    if (emailArray.length === 0) {
      return res.status(400).json({ error: "No valid student emails provided" });
    }

    const students = await User.find({
      role: "student",
      email: { $in: emailArray }
    }).select("name email studentId department specialization").lean();

    const studentEmails = students.map(s => s.email);

    const groups = await Group.find({
      $or: [
        { "leader.email": { $in: studentEmails } },
        { "member2.email": { $in: studentEmails } },
        { "member3.email": { $in: studentEmails } }
      ]
    }).lean();

    const groupIds = groups.map(g => g._id);
    const proposals = await Proposal.find({ groupId: { $in: groupIds } })
      .select("projectTitle projectStatus projectSupervisor projectSupervisorComments")
      .lean();

    const studentMap = {};
    students.forEach(s => { studentMap[s.email] = s; });

    const groupMap = {};
    groups.forEach(g => { groupMap[g._id.toString()] = g; });

    const proposalMap = {};
    proposals.forEach(p => { proposalMap[p.groupId.toString()] = p; });

    const result = groups.map(group => {
      const groupIdStr = group._id.toString();

      const leader = studentMap[group.leader?.email] || null;
      const member2 = group.member2?.email ? studentMap[group.member2.email] || null : null;
      const member3 = group.member3?.email ? studentMap[group.member3.email] || null : null;

      return {
        group: {
          groupId: group.groupId,
          leader,
          member2,
          member3
        },
        proposal: proposalMap[groupIdStr] || null
      };
    });

    // Add students without group
    const groupedEmails = new Set(
      groups.flatMap(g => [g.leader?.email, g.member2?.email, g.member3?.email].filter(Boolean))
    );

    const studentsWithoutGroup = students
      .filter(s => !groupedEmails.has(s.email))
      .map(s => ({
        group: null,
        proposal: null,
        student: s
      }));

    const finalResult = [
      ...result.map(r => ({
        ...r,
        student: r.group.leader
      })),
      ...studentsWithoutGroup
    ];

    res.json({
      success: true,
      count: finalResult.length,
      data: finalResult
    });

  } catch (err) {
    console.error("Email Search Error:", err);
    res.status(500).json({ error: err.message || "Server Error" });
  }
};