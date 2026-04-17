const User = require("../models/User");
const Group = require("../models/StudentGroup");
const Proposal = require("../models/StudentProposal");
const Template = require("../models/StudentUploadedTemplate");
const MeetingSlot = require("../models/MeetingSlot");
const SemesterStartDate = require("../models/SemesterStartDate");
const CommitteeEvaluation = require("../models/CommitteeEvaluation");
const SupervisorEvaluation = require("../models/SupervisorEvaluation");

exports.getCoordinatorStats = async (req, res) => {
    try {
        const totalGroups = await Group.countDocuments();
        const totalSupervisors = await User.countDocuments({ role: "supervisor" });

        // Calculate current week
        const semesterStart = await SemesterStartDate.findOne();
        let currentWeek = 0;
        if (semesterStart && semesterStart.date) {
            const start = new Date(semesterStart.date);
            const now = new Date();
            const diffInMs = now - start;
            const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7)) + 1;
            currentWeek = diffInWeeks > 0 ? diffInWeeks : 0;
        }

        // Overdue Milestones (Just a count of groups with < expected milestones for current week)
        // For now, let's just count groups who haven't submitted anything in the last 7 days
        const recentSubmissions = await Template.distinct("groupId", {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        const overdueCount = Math.max(0, totalGroups - recentSubmissions.length);

        let overallProgress = 0;
        if (totalGroups > 0) {
            const allGroups = await Group.find({}, "_id");
            const groupIds = allGroups.map(g => g._id);

            const fyp1Count = await Template.countDocuments({
                groupId: { $in: groupIds },
                fypPart: 1,
                templateCode: { $in: ["t01", "t02", "t03", "t04", "t05", "t07"] },
                status: "Approved"
            });

            const fyp2Count = await Template.countDocuments({
                groupId: { $in: groupIds },
                fypPart: 2,
                templateCode: { $in: ["t05", "t06"] },
                status: "Approved"
            });

            const totalCompleted = fyp1Count + fyp2Count;
            const maxPossible = totalGroups * 8;
            overallProgress = Math.round((totalCompleted / maxPossible) * 100);
        }

        res.json({
            success: true,
            stats: {
                totalGroups,
                currentWeek,
                totalSupervisors,
                overdueCount,
                overallProgress
            }
        });
    } catch (error) {
        console.error("Error fetching coordinator stats:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getRecentActivities = async (req, res) => {
    try {
        const activities = [];

        // Most recent proposal
        const latestProposal = await Proposal.findOne().sort({ createdAt: -1 });
        if (latestProposal) {
            activities.push({
                type: "proposal",
                text: `New proposal submitted for "${latestProposal.projectTitle}"`,
                time: latestProposal.createdAt
            });
        }

        // Most recent group
        const latestGroup = await Group.findOne().sort({ createdAt: -1 });
        if (latestGroup) {
            activities.push({
                type: "group",
                text: `New group created: ${latestGroup.groupId}`,
                time: latestGroup.createdAt
            });
        }

        // Most recent submission
        const latestSub = await Template.findOne().sort({ createdAt: -1 });
        if (latestSub) {
            activities.push({
                type: "deadline",
                text: `Artifact "${latestSub.templateLabel}" uploaded by a student`,
                time: latestSub.createdAt
            });
        }

        res.json({
            success: true,
            activities: activities.sort((a, b) => b.time - a.time)
        });
    } catch (error) {
        console.error("Error fetching coordinator activities:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getFinalResults = async (req, res) => {
    try {
        // Show all groups in the results view so archived students can still see their results
        const groups = await Group.find().lean();

        // Fetch users to securely extract full names for students
        const allStudents = await User.find().lean();
        const studentNameMap = {};
        allStudents.forEach(u => studentNameMap[u.email] = u.name);

        // Fetch all committee evaluations (not just approved) to allow coordinator to publish them
        const committeeEvals = await CommitteeEvaluation.find()
            .populate("scheduleId")
            .lean();
        const supervisorEvals = await SupervisorEvaluation.find().populate("evaluatedBy", "name email").lean();

        const results = [];

        for (const group of groups) {
            const fyp1ApprovedCount = await Template.countDocuments({
                groupId: group._id,
                fypPart: 1,
                templateCode: { $in: ["t01", "t02", "t03", "t04", "t05", "t07"] },
                status: "Approved"
            });
            const isFyp1Approved = fyp1ApprovedCount >= 6;

            const fyp2ApprovedCount = await Template.countDocuments({
                groupId: group._id,
                fypPart: 2,
                templateCode: { $in: ["t05", "t06"] },
                status: "Approved"
            });
            const isFyp2Approved = fyp2ApprovedCount >= 2;

            const members = [];
            if (group.leader) members.push({ ...group.leader, name: (group.leader.email ? studentNameMap[group.leader.email] : null) || group.leader.name || "Student", role: "leader" });
            if (group.member2) members.push({ ...group.member2, name: (group.member2.email ? studentNameMap[group.member2.email] : null) || group.member2.name || "Student", role: "member" });
            if (group.member3) members.push({ ...group.member3, name: (group.member3.email ? studentNameMap[group.member3.email] : null) || group.member3.name || "Student", role: "member" });

            for (const part of ["fyp-1", "fyp-2"]) {
                // Relevant committee
                const relevantComm = committeeEvals.filter(d =>
                    String(d.groupId?._id || d.groupId) === String(group._id) &&
                    (d.scheduleId?.fypPart || "").toLowerCase().replace("-", "") === part.replace("-", "") &&
                    !/\b4\b/.test(d.scheduleId?.week)
                );

                // Relevant supervisor
                const relevantSup = supervisorEvals.find(s =>
                    (String(s.groupId) === String(group._id) || String(s.groupId) === String(group.groupId)) &&
                    s.fypYear?.replace("-", "").toLowerCase() === part.replace("-", "").toLowerCase()
                );

                if (relevantComm.length > 0 || relevantSup) {
                    members.forEach(member => {
                        let commScore = 0;
                        let supScore = 0;

                        if (relevantComm.length > 0) {
                            const doc = relevantComm[relevantComm.length - 1]; // Take latest
                            const evaluations = doc.evaluations || [];
                            // Sum of CLO marks for THIS student across all panel members
                            let studentSum = 0;
                            evaluations.forEach(ev => {
                                const stuMatch = ev.students.find(s => String(s.studentId) === String(member.sapId));
                                if (stuMatch) studentSum += (ev.totalCloMarks || 0);
                            });

                            // Use actual count of submissions for averaging as requested
                            const actualSubmissionCount = evaluations.length > 0 ? evaluations.length : 1;
                            const avgCloRaw = studentSum / actualSubmissionCount;

                            // Scale to 50 Marks base
                            const commPortion = +(avgCloRaw * 0.5).toFixed(2);

                            commScore = Math.min(50, commPortion);
                        }

                        if (relevantSup) {
                            // Match student by name in the evaluations array
                            const studentRows = (relevantSup.evaluations || []).filter(e =>
                                String(e.studentName || e.name).trim().toLowerCase() === String(member.name).trim().toLowerCase()
                            );
                            if (studentRows.length > 0) {
                                const marksSum = studentRows.reduce((acc, curr) => acc + (curr.marks || 0), 0);
                                const maxPossible = studentRows.reduce((acc, curr) => acc + (curr.maxMarks || 50), 0);
                                // Supervisor Rubric scales to 50
                                supScore = +((marksSum / maxPossible) * 50).toFixed(2);
                            }
                        }

                        const total = +(commScore + supScore).toFixed(2);

                        // Find feedback from committee evaluation
                        let feedback = "—";
                        if (relevantComm.length > 0) {
                            const doc = relevantComm[relevantComm.length - 1];
                            const comments = (doc.evaluations || []).map(e => e.comments).filter(c => c && c !== "—");
                            if (comments.length > 0) {
                                feedback = comments.join(" | ");
                            }
                        }

                        // Find supervisor remarks for this specific student
                        let supRemarks = "—";
                        if (relevantSup) {
                            const studentRow = (relevantSup.evaluations || []).find(e =>
                                String(e.studentName || e.name).trim().toLowerCase() === String(member.name).trim().toLowerCase()
                            );
                            if (studentRow && studentRow.feedback) {
                                supRemarks = studentRow.feedback;
                            }
                        }

                        results.push({
                            groupId: group.groupId,
                            studentName: member.name,
                            sapId: member.sapId,
                            year: part.toUpperCase(),
                            supervisorMarks: supScore,
                            committeeAverage: commScore,
                            finalScore: total,
                            remarks: feedback, // General remarks (usually committee)
                            supervisorRemarks: supRemarks, // Specific supervisor remarks
                            isPublished: relevantComm.length > 0 ? (relevantComm[relevantComm.length - 1].isApprovedByCoordinator || false) : false,
                            isSupPublished: relevantSup ? (relevantSup.isPublished || false) : false,
                            committeeEvalId: relevantComm.length > 0 ? (relevantComm[relevantComm.length - 1]._id) : null,
                            supEvalId: relevantSup ? relevantSup._id : null,
                            supervisorEvaluations: relevantSup ? (relevantSup.evaluations || []) : [],
                            supervisorName: relevantSup ? (relevantSup.evaluatedBy?.name || "Supervisor") : "N/A",
                            isFyp1Approved: isFyp1Approved,
                            isFyp2Approved: isFyp2Approved,
                            isArchived: group.isArchived || false
                        });
                    });
                }
            }
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error in getFinalResults:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.publishSupervisorResult = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, message: "Evaluation ID is required" });

        const evaluation = await SupervisorEvaluation.findById(id);
        if (!evaluation) return res.status(404).json({ success: false, message: "Evaluation not found" });

        evaluation.isPublished = true;
        evaluation.publishedAt = new Date();
        await evaluation.save();

        res.json({ success: true, message: "Supervisor evaluation published successfully" });
    } catch (error) {
        console.error("Error in publishSupervisorResult:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};