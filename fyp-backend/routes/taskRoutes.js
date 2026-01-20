const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Group = require("../models/StudentGroup");
const { protect } = require("../middlewares/authMiddleware");

// Helper function - directly in the file
const getStudentGroup = async (email) => {
  try {
    return await Group.findOne({
      $or: [
        { "leader.email": email },
        { "member2.email": email },
        { "member3.email": email }
      ]
    });
  } catch (error) {
    console.error("Error getting student group:", error);
    return null;
  }
};

// Test route
router.get("/test", protect, (req, res) => {
  console.log("✅ Tasks API test route called");
  res.json({
    success: true,
    message: "Tasks API is working!",
    user: req.user.email,
    timestamp: new Date().toISOString()
  });
});

// Get group members
router.get("/group-members", protect, async (req, res) => {
  try {
    console.log("🔍 Getting group members for:", req.user.email);
    
    const group = await getStudentGroup(req.user.email);
    
    if (!group) {
      console.log("⚠️ No group found for user");
      return res.json({
        success: true,
        members: [],
        message: "No group found"
      });
    }

    console.log("✅ Group found:", group.groupName);
    
    // Extract members
    const members = [];
    
    // Leader
    if (group.leader && group.leader.email) {
      members.push({
        display: `${group.leader.name || 'Leader'} (${group.leader.email})`,
        email: group.leader.email,
        name: group.leader.name
      });
    }

    // Member 2
    if (group.member2 && group.member2.email) {
      members.push({
        display: `${group.member2.name || 'Member 2'} (${group.member2.email})`,
        email: group.member2.email,
        name: group.member2.name
      });
    }

    // Member 3
    if (group.member3 && group.member3.email) {
      members.push({
        display: `${group.member3.name || 'Member 3'} (${group.member3.email})`,
        email: group.member3.email,
        name: group.member3.name
      });
    }

    console.log(`✅ Found ${members.length} group members`);
    
    res.json({
      success: true,
      members: members,
      groupName: group.groupName || "My Group"
    });

  } catch (error) {
    console.error("❌ Error in /group-members:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Create new task
router.post("/create", protect, async (req, res) => {
  try {
    console.log("📝 Creating task...");
    console.log("User:", req.user.email);
    
    const { title, assignee, comments } = req.body;

    if (!title || !assignee) {
      return res.status(400).json({
        success: false,
        message: "Title and assignee are required"
      });
    }

    // Extract email from "Name (Email)" format
    const emailMatch = assignee.match(/\(([^)]+)\)/);
    if (!emailMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignee format"
      });
    }
    
    const assigneeEmail = emailMatch[1];
    const assigneeName = assignee.split('(')[0].trim();

    // Get user's group
    const group = await getStudentGroup(req.user.email);
    
    if (!group) {
      return res.status(400).json({
        success: false,
        message: "You are not in any group"
      });
    }

    // Verify assignee is in same group
    const groupEmails = [
      group.leader.email,
      group.member2?.email,
      group.member3?.email
    ].filter(email => email);

    if (!groupEmails.includes(assigneeEmail)) {
      return res.status(400).json({
        success: false,
        message: "Assignee is not in your group"
      });
    }

    // Create the task with default progress 0
    const task = new Task({
      title: title.trim(),
      createdBy: req.user._id,
      createdByName: req.user.name,
      createdByEmail: req.user.email,
      assignedToEmail: assigneeEmail,
      assignedToName: assigneeName,
      groupId: group._id,
      progress: 0, // Default 0
      status: "Pending", // Default status
      comments: comments && comments.trim() ? [{
        text: comments.trim(),
        author: req.user.name,
        authorEmail: req.user.email
      }] : []
    });

    await task.save();
    console.log("✅ Task saved:", task._id);

    // Format response
    const formattedTask = {
      id: task._id,
      title: task.title,
      createdBy: task.createdByName,
      createDate: task.createDate.toLocaleString(),
      assignedTo: task.assignedToName,
      progress: task.progress,
      status: task.status, // Include status
      comments: task.comments.map(comment => ({
        text: comment.text,
        date: comment.date.toLocaleString(),
        author: comment.author
      }))
    };

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: formattedTask
    });

  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get all tasks
router.get("/", protect, async (req, res) => {
  try {
    console.log("📋 Getting tasks for:", req.user.email);
    
    const group = await getStudentGroup(req.user.email);
    
    if (!group) {
      return res.json({
        success: true,
        tasks: [],
        message: "No group found"
      });
    }

    const tasks = await Task.find({ groupId: group._id })
      .sort({ createDate: -1 });

    // Format tasks with status
    const formattedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      createdBy: task.createdByName,
      createDate: task.createDate.toLocaleString(),
      assignedTo: task.assignedToName,
      progress: task.progress,
      status: task.status || (() => {
        // Calculate status if not set
        if (task.progress === 100) return "Completed";
        if (task.progress > 0) return "In Progress";
        return "Pending";
      })(),
      comments: task.comments.map(comment => ({
        text: comment.text,
        date: comment.date.toLocaleString(),
        author: comment.author
      }))
    }));

    res.json({
      success: true,
      tasks: formattedTasks,
      groupName: group.groupName || "My Group"
    });

  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Update task progress - FIXED STATUS UPDATE
router.put("/:id/update", protect, async (req, res) => {
  try {
    console.log("🔄 Updating task:", req.params.id);
    console.log("Update data:", req.body);
    
    const { progress, comment } = req.body;

    if (progress === undefined || progress === "") {
      return res.status(400).json({
        success: false,
        message: "Progress is required"
      });
    }

    const progressNum = Math.max(0, Math.min(100, Number(progress)));

    // Find task
    const task = await Task.findById(req.params.id);
    if (!task) {
      console.log("❌ Task not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Update progress
    task.progress = progressNum;
    
    // Update status based on progress - FIXED LOGIC
    let newStatus = "Pending";
    if (progressNum === 100) {
      newStatus = "Completed";
    } else if (progressNum > 0) {
      newStatus = "In Progress";
    }
    
    task.status = newStatus;
    
    console.log(`✅ Progress: ${progressNum}% -> Status: ${newStatus}`);

    // Add comment if provided
    if (comment && comment.trim()) {
      task.comments.push({
        text: comment.trim(),
        author: req.user.name,
        authorEmail: req.user.email
      });
    }

    await task.save();
    console.log("✅ Task updated successfully");

    // Format updated task with status
    const formattedTask = {
      id: task._id,
      title: task.title,
      createdBy: task.createdByName,
      createDate: task.createDate.toLocaleString(),
      assignedTo: task.assignedToName,
      progress: task.progress,
      status: task.status, // Include updated status
      comments: task.comments.map(c => ({
        text: c.text,
        date: c.date.toLocaleString(),
        author: c.author
      }))
    };

    res.json({
      success: true,
      message: "Task updated successfully",
      task: formattedTask
    });

  } catch (error) {
    console.error("❌ Error updating task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;