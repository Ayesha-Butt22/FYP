const User = require("../models/User");
const Group = require("../models/StudentGroup");

exports.createGroup = async (req, res) => {
  try {
    const { groupId, leader, member2, member3 } = req.body;

    // ================= LEADER =================
    const leaderUser = await User.findOne({ email: leader.email });
    if (!leaderUser) {
      return res.status(400).json({ error: "Leader email not found in users" });
    }

    if (leaderUser.isGroupMade) {
      return res.status(400).json({ error: "Leader already has a group" });
    }

    const leaderDept = leaderUser.department;

    let member2User, member3User;

    // ================= MEMBER 2 =================
    if (member2?.email) {
      member2User = await User.findOne({ email: member2.email });

      if (!member2User) {
        return res.status(400).json({ error: "Member2 email not found" });
      }

      if (member2User.isGroupMade) {
        return res.status(400).json({ error: "Member2 already in a group" });
      }

      // ❌ Department mismatch check
      if (member2User.department !== leaderDept) {
        return res.status(400).json({
          error: "Different department: Group cannot be created"
        });
      }
    }

    // ================= MEMBER 3 =================
    if (member3?.email) {
      member3User = await User.findOne({ email: member3.email });

      if (!member3User) {
        return res.status(400).json({ error: "Member3 email not found" });
      }

      if (member3User.isGroupMade) {
        return res.status(400).json({ error: "Member3 already in a group" });
      }

      // ❌ Department mismatch check
      if (member3User.department !== leaderDept) {
        return res.status(400).json({
          error: "Different department: Group cannot be created"
        });
      }
    }

    // ================= CREATE GROUP =================
    const group = new Group({ groupId, leader, member2, member3 });
    await group.save();

    // mark users
    leaderUser.isGroupMade = true;
    await leaderUser.save();

    if (member2User) {
      member2User.isGroupMade = true;
      await member2User.save();
    }

    if (member3User) {
      member3User.isGroupMade = true;
      await member3User.save();
    }

    return res.status(201).json({
      message: "Group created successfully",
      group
    });

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

exports.getGroupByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const group = await Group.findOne({
      $or: [
        { "leader.email": email },
        { "member2.email": email },
        { "member3.email": email }
      ]
    }).lean();

    if (!group) return res.status(404).json({ error: "Group not found for this email" });

    const emails = [
      group.leader?.email,
      group.member2?.email,
      group.member3?.email
    ].filter(Boolean);

    const users = await User.find({ email: { $in: emails } }).select("email name");

    const emailNameMap = {};
    users.forEach(user => {
      emailNameMap[user.email] = user.name;
    });

    group.leader = {
      ...group.leader,
      name: emailNameMap[group.leader?.email] || "Not found"
    };
    group.member2 = {
      ...group.member2,
      name: emailNameMap[group.member2?.email] || "Not found"
    };
    group.member3 = {
      ...group.member3,
      name: emailNameMap[group.member3?.email] || "Not found"
    };

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

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({}).lean();
    
    // Get all leader emails
    const emails = groups.map(g => g.leader?.email).filter(Boolean);
    
    // Fetch users (names) for these emails
    const users = await User.find({ email: { $in: emails } }).select("email name");
    const emailNameMap = {};
    users.forEach(u => { emailNameMap[u.email] = u.name; });

    // Map names back to groups
    const result = groups.map(g => ({
      ...g,
      leader: {
        ...g.leader,
        name: emailNameMap[g.leader?.email] || "Unknown"
      }
    }));

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};