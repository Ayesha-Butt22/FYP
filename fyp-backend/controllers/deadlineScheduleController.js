const PresentationSchedule = require("../models/DeadlineSchedule");
const User = require("../models/User");
const Group = require("../models/StudentGroup")

exports.createOrUpdatePresentation = async (req, res) => {
    try {
        const { week, fypPart, facultyPanels = [], venue, slots = [] } = req.body;

        let schedule = await PresentationSchedule.findOne({ week, fypPart });

        if (schedule) {
            const existingFacultyIds = schedule.facultyPanels.map(f => f.toString());
            const newFaculty = facultyPanels.filter(
                id => !existingFacultyIds.includes(id.toString())
            );
            schedule.facultyPanels.push(...newFaculty);

            const existingSlots = schedule.slots.map(
                s => `${s.startTime.toISOString()}-${s.endTime.toISOString()}`
            );
            const newSlots = slots.filter(
                s => !existingSlots.includes(`${new Date(s.startTime).toISOString()}-${new Date(s.endTime).toISOString()}`)
            );
            schedule.slots.push(...newSlots);
            if (venue) schedule.venue = venue;
            await schedule.save();
            return res.json({ success: true, message: "Schedule updated", data: schedule });
        }


        const newSchedule = await PresentationSchedule.create({
            week,
            fypPart,
            facultyPanels,
            venue,
            slots,
        });

        res.json({ success: true, message: "Schedule created", data: newSchedule });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.getPresentation = async (req, res) => {
    try {
        const { week, fypPart } = req.query;
        const schedule = await PresentationSchedule.findOne({ week, fypPart })
            .populate("facultyPanels", "name email")
            .populate("slots.bookedBy", "leader member2 member3");

        if (!schedule) return res.json({ success: true, data: null });
        res.json({ success: true, data: schedule });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.bookSlot = async (req, res) => {
    try {
        const { slotId, groupId, scheduleId } = req.body;

        const schedule = await PresentationSchedule.findById(scheduleId);
        if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

        const slot = schedule.slots.id(slotId);
        if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });

        if (slot.bookedBy)
            return res.status(400).json({ success: false, message: "Slot already booked" });

        slot.bookedBy = groupId;
        await schedule.save();

        res.json({ success: true, message: "Slot booked successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getFaculty = async (req , res) => {
    try {
        const list = await User.find({
            role: { $in: ['coordinator', 'supervisor'] }
        }).select('-password');

        return res.json(list);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

}

exports.checkSlot = async (req, res) => {
    try {
        const { email } = req.params;

        const group = await Group.findOne({
            $or: [
                { "leader.email": email },
                { "member2.email": email },
                { "member3.email": email },
            ],
        });

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        const booked = await PresentationSchedule.findOne({
            "slots.bookedBy": group._id,
        });

        if (booked) {
            return res.json({ success: true, alreadyBooked: true, groupId: group._id , details:booked  });
        }
        const schedule = await PresentationSchedule.findOne({ fypPart: "fyp-1" });

        if (!schedule) {
            return res.json({ success: true, alreadyBooked: false, availableSlots: [] });
        }

        const availableSlots = schedule.slots.filter((slot) => !slot.bookedBy);

        return res.json({
            success: true,
            alreadyBooked: false,
            scheduleId: schedule._id,
            groupId:group._id,
            availableSlots,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}