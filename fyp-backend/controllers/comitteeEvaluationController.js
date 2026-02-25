//CommitteeEvaluationCOntroller
const CommiteeEvaluation = require("../models/CommiteeEvaluation");
const PresentationSchedule = require("../models/DeadlineSchedule");
const Group = require("../models/StudentGroup");

exports.submitEvaluation = async (req, res) => {
    try {
        const { scheduleId, slotId, groupId, evaluatedBy, students, comments } = req.body;

        if (!scheduleId || !slotId || !groupId || !evaluatedBy || !students)
            return res.status(400).json({ success: false, message: "Missing required fields" });

        let evaluation = await CommiteeEvaluation.findOne({ scheduleId, groupId });
        if (!evaluation) {
            evaluation = new CommiteeEvaluation({
                scheduleId,
                slotId,
                groupId,
                evaluations: [
                    {
                        evaluatedBy,
                        students,
                        comments,
                    },
                ],
            });

            await evaluation.save();
            return res
                .status(200)
                .json({ success: true, message: "Evaluation submitted successfully." });
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
        });

        await evaluation.save();
        return res
            .status(200)
            .json({ success: true, message: "Evaluation saved successfully." });
    } catch (err) {
        console.error("Submit Evaluation Error:", err);
        res
            .status(500)
            .json({ success: false, message: "Server Error", error: err.message });
    }
};



exports.getEvaluations = async (req, res) => {
    try {
        const evaluations = await CommiteeEvaluation.find()
            .populate("groupId")
            .populate("scheduleId")
            .populate("evaluations.evaluatedBy", "name email role");

        res.status(200).json({ success: true, data: evaluations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getApprovedEvaluations = async (req, res) => {
    try {
        const evaluations =await CommiteeEvaluation.find({ isApprovedByCoordinator: true })
            .populate("groupId")
            .populate("scheduleId")
            .populate("evaluations.evaluatedBy", "name email role");

        res.status(200).json({ success: true, data: evaluations });
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
        const groupId = group._id;
        const evaluations = await CommiteeEvaluation.find({
            groupId: groupId,
            isApprovedByCoordinator: true
        })
            .populate("evaluations.evaluatedBy", "name email role")
            .populate("scheduleId")
            .populate("scheduleId", "week fypPart venue slots");

        res.status(200).json({ success: true, data: evaluations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.approveEvaluation = async (req, res) => {
    try {
        const { id } = req.body;
        const evaluation = await CommiteeEvaluation.findByIdAndUpdate(
            id,
            { isApprovedByCoordinator: true, approvedAt: new Date() },
            { new: true }
        );

        if (!evaluation)
            return res.status(404).json({ success: false, message: "Evaluation not found" });

        res.status(200).json({ success: true, message: "Evaluation approved", data: evaluation });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getEvaluationByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const evaluation = await CommiteeEvaluation.findOne({ groupId })
            .populate("evaluations.evaluatedBy", "name email role")
            .populate("scheduleId", "week fypPart venue");

        if (!evaluation)
            return res.status(404).json({ success: false, message: "Evaluation not found" });

        res.status(200).json({ success: true, data: evaluation });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
