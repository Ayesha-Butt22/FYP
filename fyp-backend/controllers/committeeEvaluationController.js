// committeeEvaluationController.js
const CommitteeEvaluation = require("../models/CommitteeEvaluation");
const PresentationSchedule = require("../models/DeadlineSchedule");
const Group = require("../models/StudentGroup");
const Proposal = require("../models/StudentProposal");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.submitEvaluation = async (req, res) => {
    try {
        const { scheduleId, slotId, groupId, evaluatedBy, students, comments, cloMarks, totalCloMarks } = req.body;

        if (!scheduleId || !slotId || !groupId || !evaluatedBy || !students)
            return res.status(400).json({ success: false, message: "Missing required fields" });

        // --- Block Archived Groups ---
        const groupCheck = await Group.findById(groupId);
        if (groupCheck?.isArchived) {
            return res.status(403).json({ success: false, message: "Evaluation blocked: This group has already been moved to the FYP Archive." });
        }

        // --- Date Pass Check (Strictly Date, Not Time) ---
        const scheduleDoc = await PresentationSchedule.findById(scheduleId);
        if (scheduleDoc) {
            const slot = scheduleDoc.slots.id(slotId);
            if (slot) {
                const now = new Date();
                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const slotDate = new Date(slot.startTime);
                const slotMidnight = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());

                if (todayMidnight > slotMidnight) {
                    return res.status(403).json({
                        success: false,
                        message: "Evaluation blocked: The scheduled date for this slot has passed."
                    });
                }
            }
        }

        let evaluation = await CommitteeEvaluation.findOne({ scheduleId, groupId });
        if (!evaluation) {
            evaluation = new CommitteeEvaluation({
                scheduleId,
                slotId,
                groupId,
                evaluations: [
                    {
                        evaluatedBy,
                        students,
                        comments,
                        cloMarks,
                        totalCloMarks,
                    },
                ],
            });

            await evaluation.save();
            return res.status(200).json({ success: true, message: "Evaluation submitted successfully." });
        }

        const alreadyEvaluated = evaluation.evaluations.some(
            (ev) => ev.evaluatedBy.toString() === evaluatedBy
        );

        if (alreadyEvaluated) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted an evaluation for this group.",
            });
        }

        evaluation.evaluations.push({
            evaluatedBy,
            students,
            comments,
            cloMarks,
            totalCloMarks,
        });

        await evaluation.save();
        return res.status(200).json({ success: true, message: "Evaluation saved successfully." });
    } catch (err) {
        console.error("Submit Evaluation Error:", err);
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

exports.getEvaluations = async (req, res) => {
    try {
        let evaluations = await CommitteeEvaluation.find()
            .populate({
                path: "groupId",
                match: { isArchived: { $ne: true } }
            })
            .populate("scheduleId")
            .populate("evaluations.evaluatedBy", "name email role")
            .lean();

        evaluations = evaluations.filter(doc => doc.groupId !== null);

        // Resolve student names
        const sapIds = new Set();
        evaluations.forEach(doc => {
            (doc.evaluations || []).forEach(ev => {
                (ev.students || []).forEach(s => { if (s.studentId) sapIds.add(s.studentId); });
            });
        });

        const studentsInDb = await User.find({ studentId: { $in: Array.from(sapIds) } }).select("studentId name");
        const sapToNameMap = {};
        studentsInDb.forEach(u => { sapToNameMap[u.studentId] = u.name; });

        const groupIdsForProposals = evaluations.map(d => d.groupId?._id || d.groupId);
        const proposals = await Proposal.find({ groupId: { $in: groupIdsForProposals } }).select("groupId projectSupervisor").lean();
        const groupToSupervisorMap = {};
        proposals.forEach(p => { groupToSupervisorMap[String(p.groupId)] = p.projectSupervisor; });

        const result = evaluations.map(doc => {
            const gid = String(doc.groupId?._id || doc.groupId);
            const assignedPanelSize = doc.scheduleId?.facultyPanels?.length || 0;
            return {
                ...doc,
                assignedPanelSize,
                supervisorEmail: groupToSupervisorMap[gid] || null,
                evaluations: (doc.evaluations || []).map(ev => ({
                    ...ev,
                    students: (ev.students || []).map(s => ({
                        ...s,
                        name: sapToNameMap[s.studentId] || s.name || "N/A"
                    }))
                }))
            };
        });

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getApprovedEvaluations = async (req, res) => {
    try {
        const { supervisor } = req.query;
        if (!supervisor || supervisor.trim() === "" || supervisor === "null" || supervisor === "undefined") {
            return res.status(200).json({ success: true, data: [] });
        }

        let query = { isApprovedByCoordinator: true };

        const supervisorUser = await User.findOne({
            $or: [{ email: supervisor }, { name: supervisor }]
        }).select("name email");

        const supervisorName = supervisorUser ? supervisorUser.name : supervisor;

        // Fetch supervised groups using case-insensitive matches for email or name
        const supervisedProposals = await Proposal.find({
            $or: [
                { projectSupervisor: { $regex: new RegExp(`^${supervisor}$`, "i") } },
                { projectSupervisor: { $regex: new RegExp(`^${supervisorName}$`, "i") } }
            ]
        }).select("groupId");

        const groupIds = supervisedProposals.map(p => p.groupId);

        // Strictly filter by supervised groups only
        query.groupId = { $in: groupIds };

        let evaluations = await CommitteeEvaluation.find(query)
            .populate({
                path: "groupId",
                match: { isArchived: { $ne: true } }
            })
            .populate("scheduleId")
            .populate("evaluations.evaluatedBy", "name email role")
            .lean();

        evaluations = evaluations.filter(doc => doc.groupId !== null);

        // Resolve student names
        const sapIds = new Set();
        evaluations.forEach(doc => {
            (doc.evaluations || []).forEach(ev => {
                (ev.students || []).forEach(s => { if (s.studentId) sapIds.add(s.studentId); });
            });
        });

        const studentsInDb = await User.find({ studentId: { $in: Array.from(sapIds) } }).select("studentId name");
        const sapToNameMap = {};
        studentsInDb.forEach(u => { sapToNameMap[u.studentId] = u.name; });

        const groupIdsForProposals = evaluations.map(d => d.groupId?._id || d.groupId);
        const proposals = await Proposal.find({ groupId: { $in: groupIdsForProposals } }).select("groupId projectSupervisor").lean();
        const groupToSupervisorMap = {};
        proposals.forEach(p => { groupToSupervisorMap[String(p.groupId)] = p.projectSupervisor; });

        const result = evaluations.map(doc => {
            const gid = String(doc.groupId?._id || doc.groupId);
            const assignedPanelSize = doc.scheduleId?.facultyPanels?.length || 0;
            return {
                ...doc,
                assignedPanelSize,
                supervisorEmail: groupToSupervisorMap[gid] || null,
                evaluations: (doc.evaluations || []).map(ev => ({
                    ...ev,
                    students: (ev.students || []).map(s => ({
                        ...s,
                        name: sapToNameMap[s.studentId] || s.name || "N/A"
                    }))
                }))
            };
        });

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getStudentEvaluations = async (req, res) => {
    try {
        const { email } = req.params;
        const group = await Group.findOne({
            $or: [
                { "leader.email": email },
                { "member2.email": email },
                { "member3.email": email }
            ]
        }).lean();

        if (!group) {
            return res.status(200).json({ success: true, data: [] });
        }

        const groupId = group._id;
        const evaluations = await CommitteeEvaluation.find({
            groupId: mongoose.Types.ObjectId.isValid(groupId) ? new mongoose.Types.ObjectId(groupId) : groupId,
            isApprovedByCoordinator: true
        })
            .populate("groupId", "groupId")
            .populate("evaluations.evaluatedBy", "name email role")
            .populate({
                path: "scheduleId",
                select: "week fypPart venue slots facultyPanels"
            })
            .lean();

        // 1️⃣ Collect all student SAP IDs from these evaluations
        const sapIds = new Set();
        evaluations.forEach(doc => {
            (doc.evaluations || []).forEach(ev => {
                (ev.students || []).forEach(s => {
                    if (s.studentId) sapIds.add(s.studentId);
                });
            });
        });

        // 2️⃣ Fetch real names from User collection
        const studentsInDb = await User.find({ studentId: { $in: Array.from(sapIds) } }).select("studentId name");
        const sapToNameMap = {};
        studentsInDb.forEach(u => {
            sapToNameMap[u.studentId] = u.name;
        });

        // 3️⃣ Map names back and FILTER to only show the requesting student's records
        const proposals = await Proposal.find({ groupId }).select("groupId projectSupervisor").lean();
        const groupToSupervisorMap = {};
        proposals.forEach(p => { groupToSupervisorMap[String(p.groupId)] = p.projectSupervisor; });

        // Identify the requesting student's SAP ID to filter results
        const matchingMember = ["leader", "member2", "member3"].find(k => group[k]?.email === email);
        const requesterSapId = group[matchingMember]?.sapId;

        const result = evaluations.map(doc => {
            const gid = String(doc.groupId?._id || doc.groupId);
            const assignedPanelSize = doc.scheduleId?.facultyPanels?.length || 0;
            return {
                ...doc,
                assignedPanelSize,
                supervisorEmail: groupToSupervisorMap[gid] || null,
                evaluations: (doc.evaluations || []).map(ev => ({
                    ...ev,
                    students: (ev.students || [])
                        .filter(s => String(s.studentId) === String(requesterSapId))
                        .map(s => ({
                            ...s,
                            name: sapToNameMap[s.studentId] || s.name || "N/A"
                        }))
                }))
            };
        });

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        console.error("❌ Error in getStudentEvaluations:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.approveEvaluation = async (req, res) => {
    try {
        const { id } = req.body;
        const evaluation = await CommitteeEvaluation.findById(id).populate("scheduleId");
        if (!evaluation)
            return res.status(404).json({ success: false, message: "Evaluation not found" });

        const schedule = evaluation.scheduleId;
        const assignedCount = schedule?.facultyPanels?.length || 0;
        const submittedCount = evaluation.evaluations?.length || 0;

        // Rule: All must submit OR deadline must have passed
        const allSubmitted = submittedCount >= assignedCount;

        // Find the slot to check its date
        const slot = schedule.slots.id(evaluation.slotId);
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const slotDate = slot?.startTime ? new Date(slot.startTime) : null;
        const slotMidnight = slotDate ? new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate()).getTime() : null;
        const isDatePassed = slotMidnight !== null && todayMidnight > slotMidnight;

        if (!allSubmitted && !isDatePassed) {
            return res.status(400).json({
                success: false,
                message: `Publishing blocked: Only ${submittedCount}/${assignedCount} members have submitted. You must wait for all submissions or until the scheduled date passes (${slotDate?.toLocaleDateString()}).`
            });
        }

        evaluation.isApprovedByCoordinator = true;
        evaluation.approvedAt = new Date();
        await evaluation.save();

        res.status(200).json({ success: true, message: "Evaluation published successfully", data: evaluation });
    } catch (err) {
        console.error("Approve Evaluation Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEvaluationByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const evaluation = await CommitteeEvaluation.findOne({ groupId })
            .populate("evaluations.evaluatedBy", "name email role")
            .populate("scheduleId", "week fypPart venue");

        if (!evaluation)
            return res.status(404).json({ success: false, message: "Evaluation not found" });

        res.status(200).json({ success: true, data: evaluation });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMySubmissions = async (req, res) => {
    try {
        const { facultyId } = req.params;
        if (!facultyId)
            return res.status(400).json({ success: false, message: "facultyId required" });

        const evaluations = await CommitteeEvaluation.find({
            "evaluations.evaluatedBy": facultyId
        }).select("slotId groupId");

        const submittedSlotIds = evaluations.map(e => e.slotId?.toString()).filter(Boolean);
        const submittedGroupIds = evaluations.map(e => e.groupId?.toString()).filter(Boolean);

        res.status(200).json({
            success: true,
            submittedSlotIds,
            submittedGroupIds
        });
    } catch (err) {
        console.error("getMySubmissions Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
