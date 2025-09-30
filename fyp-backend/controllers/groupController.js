const User = require("../models/User");
const Group = require("../models/Group");

exports.createGroup = async (req, res) => {
  try {
    const { groupId, leader, member2, member3 } = req.body;

    // Leader email validate
    const leaderUser = await User.findOne({ email: leader.email });
    if (!leaderUser) return res.status(400).json({ error: "Leader email not found in users" });
    if (leaderUser.isGroupMade) return res.status(400).json({ error: "Leader already has a group" });

    // Member 2 email validate (if provided)
    let member2User;
    if (member2?.email) {
      member2User = await User.findOne({ email: member2.email });
      if (!member2User) return res.status(400).json({ error: "Member2 email not found" });
      if (member2User.isGroupMade) return res.status(400).json({ error: "Member2 already in a group" });
    }

    // Member 3 email validate (if provided)
    let member3User;
    if (member3?.email) {
      member3User = await User.findOne({ email: member3.email });
      if (!member3User) return res.status(400).json({ error: "Member3 email not found" });
      if (member3User.isGroupMade) return res.status(400).json({ error: "Member3 already in a group" });
    }

    // Create group
    const group = new Group({ groupId, leader, member2, member3 });
    await group.save();


    leaderUser.isGroupMade = true;
    await leaderUser.save();

    if (member2User) { member2User.isGroupMade = true; await member2User.save(); }
    if (member3User) { member3User.isGroupMade = true; await member3User.save(); }

    return res.status(201).json({ message: "Group created successfully", group });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    return res.json(group);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Reset users' isGroupMade
    const emails = [group.leader.email, group.member2?.email, group.member3?.email].filter(Boolean);
    await User.updateMany({ email: { $in: emails } }, { $set: { isGroupMade: false } });

    await group.deleteOne();
    return res.json({ message: "Group deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
