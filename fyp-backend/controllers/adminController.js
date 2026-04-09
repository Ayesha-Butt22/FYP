const bcrypt = require('bcryptjs');
const xlsx = require("xlsx");
const User = require('../models/User');
const Group = require('../models/StudentGroup');
const Proposal = require("../models/StudentProposal");
const StudentUploadedTemplate = require("../models/StudentUploadedTemplate");

const isValidOfficialEmail = email => /^[a-zA-Z0-9._]+@riphah\.edu\.pk$/.test(email);

// CREATE USER (Admin, Supervisor, Coordinator)
exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, role,
      department, specialization, availableSlots, bookedSlots,
      gender, contactNumber, designation // ADDED: designation
    } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Name, email, password and role are required" });

    if (!["admin", "supervisor", "coordinator"].includes(role))
      return res.status(400).json({ error: "Invalid role" });

    if (!isValidOfficialEmail(email))
      return res.status(400).json({ error: "Official email invalid" });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      role,
      department,
      designation,
      specialization,
      availableSlots,
      bookedSlots,
      gender: gender ? gender.toLowerCase() : null,
      contactNumber: contactNumber || null,
      mustChangePassword: true,
      first_login: true
    });

    // Auto Admin ID
    if (role === 'admin') {
      // Find last admin
      const lastAdmin = await User.find({ role: 'admin' })
        .sort({ createdAt: -1 }) // get the latest
        .limit(1);

      let nextId = 1; // default for first admin

      if (lastAdmin.length > 0 && lastAdmin[0].studentId) {
        // Extract the number from last admin ID
        const lastNum = parseInt(lastAdmin[0].studentId.split('-')[1]);
        nextId = lastNum + 1;
      }

      // Pad with zeros: adm-001, adm-002, etc.
      const padded = String(nextId).padStart(3, '0');
      newUser.studentId = `adm-${padded}`;
    }
    await newUser.save();
    const u = newUser.toObject();
    delete u.password;

    return res.status(201).json({
      message: `${role} created successfully`,
      user: u
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET COORDINATORS
exports.getCoordinators = async (req, res) => {
  try {
    const list = await User.find({ role: 'coordinator' }).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ADMINS
exports.getAdmins = async (req, res) => {
  try {
    const list = await User.find({ role: 'admin' })
      .select('studentId name email gender contactNumber department designation')
      .sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET SUPERVISORS (DESIGNATION INCLUDED)
exports.getSupervisors = async (req, res) => {
  try {
    const list = await User.find({ role: 'supervisor' })
      .select('name email department specialization availableSlots bookedSlots designation')
      .sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ALL STUDENTS
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// APPROVE STUDENT
exports.approveStudent = async (req, res) => {
  try {
    const { id } = req.body;
    const student = await User.findById(id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    student.IsApproved = true;
    await student.save();
    res.json({ message: "Student approved!", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const list = await User.find({}).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ALL GROUPS
exports.getAllGroups = async (req, res) => {
  try {
    const list = await Group.find({});
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const {
      name, email, department, specialization, password,
      availableSlots, bookedSlots, designation, // ADDED: designation
      gender, contactNumber, isProjectHead
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ error: "Email already taken" });
      user.email = email;
    }

    if (name && name.trim() !== "") user.name = name;
    if (department) user.department = department;
    if (specialization) user.specialization = specialization;
    if (designation) user.designation = designation; // ADDED: designation handling
    if (typeof bookedSlots !== "undefined") user.bookedSlots = bookedSlots;
    if (typeof availableSlots !== "undefined") user.availableSlots = availableSlots;

    if (typeof isProjectHead !== "undefined") {

      if (isProjectHead === true) {
        await User.updateMany(
          {
            department: user.department,
            isProjectHead: true,
            _id: { $ne: user._id }
          },
          { isProjectHead: false }
        );
      }
      user.isProjectHead = isProjectHead;
    }

    if (gender !== undefined) user.gender = gender ? gender.toLowerCase() : null;
    if (contactNumber !== undefined) user.contactNumber = contactNumber || null;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
      user.mustChangePassword = true;
      user.first_login = true;
    }

    await user.save();
    const u = user.toObject();
    delete u.password;

    return res.json({ message: "User updated successfully", user: u });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.deleteOne();
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// REMOVE COORDINATOR 
exports.removeCoordinator = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.role !== "coordinator") {
      return res.status(400).json({ error: "User is not a coordinator" });
    }

    // Change role to supervisor
    user.role = "supervisor";
    user.isAlsoCOR = false;
    await user.save();

    const u = user.toObject();
    delete u.password;

    return res.json({
      message: "Coordinator removed and converted to supervisor successfully",
      user: u
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


exports.getSystemStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalSupervisors = await User.countDocuments({ role: "supervisor" });
    const totalCoordinators = await User.countDocuments({ role: "coordinator" });
    const totalProposals = await require("../models/StudentProposal").countDocuments();

    // Only count active (non-archived) groups
    const totalGroups = await Group.countDocuments({ isArchived: { $ne: true } });

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalSupervisors,
        totalCoordinators,
        totalGroups,
        totalProposals
      },
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const activities = [];

    const recentUsers = await User.find({ role: { $in: ["supervisor", "coordinator"] } })
      .sort({ createdAt: -1 })
      .limit(5);

    recentUsers.forEach(u => {
      activities.push({
        type: u.role,
        text: `Added ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}: ${u.name}`,
        time: u.createdAt ? new Date(u.createdAt) : new Date()
      });
    });

    // 2. Recent Groups (last 5)
    const recentGroups = await Group.find()
      .sort({ createdAt: -1 })
      .limit(5);

    recentGroups.forEach(g => {
      activities.push({
        type: "group",
        text: `New Group created: ${g.groupId}`,
        time: g.createdAt ? new Date(g.createdAt) : new Date()
      });
    });

    // 3. Recent Proposals (last 5)
    const recentProposals = await Proposal.find()
      .sort({ createdAt: -1 })
      .limit(5);

    recentProposals.forEach(p => {
      activities.push({
        type: "proposal",
        text: `New Proposal: "${p.projectTitle}" submitted`,
        time: p.createdAt ? new Date(p.createdAt) : new Date()
      });
    });

    // 4. Recent Template Uploads (last 5)
    const recentUploads = await StudentUploadedTemplate.find()
      .sort({ createdAt: -1 })
      .limit(5);

    recentUploads.forEach(t => {
      activities.push({
        type: "upload",
        text: `File "${t.templateLabel}" uploaded by ${t.studentId}`,
        time: t.uploadedAt ? new Date(t.uploadedAt) : (t.createdAt ? new Date(t.createdAt) : new Date())
      });
    });

    // Sort all combined by time descending
    activities.sort((a, b) => b.time.getTime() - a.time.getTime());

    // Helper function for time ago (simple version or just return ISO)
    const timeAgo = (date) => {
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      return "Just now";
    };

    const formattedActivities = activities.slice(0, 10).map(act => ({
      ...act,
      time: timeAgo(act.time)
    }));

    res.status(200).json({
      success: true,
      activities: formattedActivities
    });

  } catch (error) {
    console.error("Error fetching admin activities:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// PROMOTE TO COORDINATOR
exports.makeCoordinator = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.role = "coordinator";
    user.isAlsoCOR = true;
    await user.save();
    return res.json({ message: "User promoted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// UPLOAD EXCEL & CREATE SUPERVISORS
exports.uploadExcelAndCreateUsers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (sheetData.length === 0)
      return res.status(400).json({ error: "Empty Excel file" });

    let createdUsers = [];
    let skippedUsers = [];
    const designationSlotsMap = {
      'dean': 0,
      'professor': 1,
      'associateprofessor': 2,
      'assistantprofessor': 3,
      'lecturer': 3,
      'sr.lecturer': 3,
      'srlecturer': 3,
      'juniorlecturer': 2,
      'researchassociate': 1,
      'researchassistant': 1,
      'teachingfellow': 1
    };

    for (const row of sheetData) {
      const { id, name, email, password, department, specialization, designation, bookedSlots } = row;

      if (!name || !email || !password) {
        skippedUsers.push({ email, reason: "Missing required fields" });
        continue;
      }

      if (!isValidOfficialEmail(email)) {
        skippedUsers.push({ email, reason: "Invalid email format" });
        continue;
      }

      const existing = await User.findOne({ email });
      if (existing) {
        skippedUsers.push({ email, reason: "Already exists" });
        continue;
      }

      let availableSlots = 0;
      let normalizedDesignation = '';

      if (designation) {
        normalizedDesignation = designation.toString().toLowerCase().replace(/\s+/g, '');
        if (designationSlotsMap.hasOwnProperty(normalizedDesignation)) {
          availableSlots = designationSlotsMap[normalizedDesignation];
        } else {
          skippedUsers.push({ email, reason: `Invalid designation: ${designation}` });
          continue;
        }
      } else {
        skippedUsers.push({ email, reason: "Missing designation" });
        continue;
      }

      const hashed = await bcrypt.hash(password.toString(), 10);

      const newUser = new User({
        studentId: id,
        name,
        email,
        password: hashed,
        role: 'supervisor',
        department,
        specialization,
        designation: designation,
        availableSlots: availableSlots,
        bookedSlots: bookedSlots || 0,
        mustChangePassword: true,
        first_login: true,
      });

      await newUser.save();
      createdUsers.push(email);
    }

    return res.status(201).json({
      message: "Excel processed successfully",
      createdCount: createdUsers.length,
      skippedCount: skippedUsers.length,
      createdUsers,
      skippedUsers,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE SUPERVISOR SLOTS USING EMAIL + DESIGNATION + BOOKED SLOTS
exports.updateSupervisorSlotsByEmail = async (req, res) => {
  try {
    const { email, designation, bookedSlots } = req.body;
    console.log("here");

    if (!email || !designation || bookedSlots === undefined) {
      return res.status(400).json({ error: "Email, designation and bookedSlots are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Supervisor with this email not found" });
    }

    if (user.role !== "supervisor") {
      return res.status(400).json({ error: "This email does not belong to a supervisor" });
    }

    // Normalize designation keys
    const designationSlotsMap = {
      'dean': 0,
      'professor': 1,
      'associateprofessor': 2,
      'assistantprofessor': 3,
      'lecturer': 3,
      'lecturerSr.lecturer': 3,
      'sr.lecturer': 3,
      'srlecturer': 3,
      'juniorlecturer': 2,
      'researchassociate': 1,
      'researchassociateassistant': 1,
      'researchassistant': 1,
      'teachingfellow': 1
    };

    const normalized = designation.toLowerCase().replace(/\s+/g, "");
    const availableSlots = designationSlotsMap[normalized];

    if (availableSlots === undefined) {
      return res.status(400).json({ error: "Invalid designation" });
    }

    if (bookedSlots > availableSlots) {
      return res.status(400).json({
        error: `Booked slots (${bookedSlots}) cannot exceed available slots (${availableSlots})`
      });
    }

    // Update supervisor
    user.designation = designation;
    user.availableSlots = availableSlots;
    user.bookedSlots = bookedSlots;

    await user.save();

    const u = user.toObject();
    delete u.password;

    return res.json({
      success: true,
      message: "Supervisor slots updated successfully",
      data: u
    });

  } catch (err) {
    console.error("Update Supervisor Slots Error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getSupervisorsForCoordinator = async (req, res) => {
  try {
    const supervisors = await User.find({ role: "supervisor" })
      .select("name email department specialization designation availableSlots bookedSlots")
      .sort({ createdAt: -1 });


    const DESIGNATION_DEFAULTS = {
      Dean: 0,
      Professor: 1,
      "Associate Professor": 2,
      "Assistant Professor": 3,
      "Lecturer/Sr. Lecturer": 3,
      "Junior Lecturer": 2,
      "Research Associate/Assistant": 1,
      "Teaching Fellow": 1,
    };

    const normalized = supervisors.map((sup) => {
      const available =
        sup.availableSlots ?? DESIGNATION_DEFAULTS[sup.designation] ?? 0;
      const booked = sup.bookedSlots ?? 0;
      return { ...sup.toObject(), availableSlots: available, bookedSlots: booked };
    });

    return res.json({ success: true, data: normalized });
  } catch (err) {
    console.error("Get Supervisors For Coordinator Error:", err);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};


// TOGGLE STUDENT APPROVAL (Approve / Unapprove)
exports.toggleStudentApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (student.role !== "student") {
      return res.status(400).json({ error: "This action is only for students" });
    }

    // Toggle approval
    student.IsApproved = !student.IsApproved;
    await student.save();

    return res.json({
      success: true,
      message: student.IsApproved
        ? "Student approved successfully"
        : "Student unapproved successfully",
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        IsApproved: student.IsApproved
      }
    });

  } catch (err) {
    console.error("Toggle approval error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};

// MAKE FYP INCHARGE
exports.makeFYPIncharge = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "coordinator") {
      return res.status(400).json({ error: "Only coordinators can be made FYP Incharge" });
    }


    await User.updateMany(
      {
        department: user.department,
        isProjectHead: true,
        _id: { $ne: id }
      },
      { isProjectHead: false }
    );


    user.isProjectHead = true;
    await user.save();

    const u = user.toObject();
    delete u.password;

    return res.json({
      success: true,
      message: `${user.name} is now FYP Incharge for ${user.department} department`,
      user: u
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};