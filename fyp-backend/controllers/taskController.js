// controllers/taskController.js
const Task = require("../models/Task");
const Group = require("../models/StudentGroup");
const User = require("../models/User");

// 1. Get current user's group and its members (for dropdown)
exports.getMyGroup = async (req, res) => {
  try {
    
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Try a simpler approach - get all groups and filter
    const allGroups = await Group.find({});
    
    // Log all groups for debugging
    allGroups.forEach((g, i) => {
      console.log(`Group ${i}:`, {
        groupId: g.groupId,
        leader: g.leader?.email,
        member2: g.member2?.email,
        member3: g.member3?.email
      });
    });
    
    // Find groups where user is a member
    const userGroups = allGroups.filter(group => {
      const emails = [
        group.leader?.email,
        group.member2?.email,
        group.member3?.email
      ].filter(Boolean);
      
      const userEmail = req.user.email.toLowerCase().trim();
      const groupEmails = emails.map(e => e.toLowerCase().trim());
      
      return groupEmails.includes(userEmail);
    });
    
    if (userGroups.length === 0) {
      return res.status(200).json({ 
        success: false,
        groupId: null,
        members: [],
        message: "You are not in any group yet. Please join or create a group first."
      });
    }
    
    // Take the first group (assuming user is only in one group)
    const group = userGroups[0];
    
    
    
    // Build members array directly from group data
    const members = [
      {
        email: group.leader.email,
        name: group.leader.email.split('@')[0], // Use email prefix as name
        sapId: group.leader.sapId || group.leader.email.split('@')[0] || "",
        role: "Leader"
      },
      group.member2 && group.member2.email
        ? {
            email: group.member2.email,
            name: group.member2.email.split('@')[0],
            sapId: group.member2.sapId || group.member2.email.split('@')[0] || "",
            role: "Member"
          }
        : null,
      group.member3 && group.member3.email
        ? {
            email: group.member3.email,
            name: group.member3.email.split('@')[0],
            sapId: group.member3.sapId || group.member3.email.split('@')[0] || "",
            role: "Member"
          }
        : null
    ].filter(Boolean);

    

    res.status(200).json({
      success: true,
      groupId: group.groupId,
      members
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: "Server error: " + err.message 
    });
  }
};

// 2. Create new task (with optional initial comment)
exports.createTask = async (req, res) => {
  try {
    const { title, assignedToEmail, groupId, comment, description, priority, dueDate } = req.body;
    const user = req.user;

    if (!title?.trim() || !assignedToEmail || !groupId) {
      return res.status(400).json({ error: "Title, assignedToEmail and groupId are required" });
    }

    // Find the group
    const group = await Group.findOne({ groupId });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if current user belongs to this group
    const memberEmails = [
      group.leader.email,
      group.member2?.email,
      group.member3?.email
    ].filter(Boolean);
    
    if (!memberEmails.includes(user.email)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Check if assigned user exists in the group
    if (!memberEmails.includes(assignedToEmail)) {
      return res.status(400).json({ error: "Assigned user is not a member of this group" });
    }

    const newTask = new Task({
      title: title.trim(),
      description: description?.trim() || "",
      createdBy: {
        email: user.email,
        name: user.email.split('@')[0], // Use email prefix as name
        sapId: user.email.split('@')[0] // Use email prefix as sapId
      },
      groupId: group.groupId,
      assignedTo: {
        email: assignedToEmail,
        name: assignedToEmail.split('@')[0], // Use email prefix as name
        sapId: assignedToEmail.split('@')[0] // Use email prefix as sapId
      },
      progress: 0,
      priority: priority || "Medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      history: [
        {
          action: "Task Created",
          details: `Task "${title.trim()}" created by ${user.email.split('@')[0]}`,
          changedBy: { 
            email: user.email, 
            name: user.email.split('@')[0]
          }
        }
      ]
    });

    // Add initial comment if provided
    if (comment?.trim()) {
      newTask.comments.push({
        text: comment.trim(),
        author: {
          email: user.email,
          name: user.email.split('@')[0],
          sapId: user.email.split('@')[0]
        },
        date: new Date().toLocaleString()
      });
      newTask.history.push({
        action: "Initial Comment Added",
        details: "Comment added during task creation",
        changedBy: { 
          email: user.email, 
          name: user.email.split('@')[0]
        }
      });
    }

    await newTask.save();

    res.status(201).json({
      message: "Task created successfully",
      task: newTask
    });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: err.message || "Failed to create task" });
  }
};

// 3. Get all tasks of a group (categorized)
exports.getGroupTasks = async (req, res) => {
  try {
    const { groupId } = req.params;
    const user = req.user;

    const group = await Group.findOne({ groupId });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member of this group
    const memberEmails = [
      group.leader.email,
      group.member2?.email,
      group.member3?.email
    ].filter(Boolean);
    
    if (!memberEmails.includes(user.email)) {
      return res.status(403).json({ error: "Not authorized to view this group's tasks" });
    }

    const tasks = await Task.find({ groupId })
      .sort({ createdAt: -1 })
      .lean();

    const categorized = {
      pending: tasks.filter(t => t.status === "Pending"),
      inProgress: tasks.filter(t => t.status === "In Progress"),
      completed: tasks.filter(t => t.status === "Completed"),
      onHold: tasks.filter(t => t.status === "On Hold")
    };

    res.json({
      success: true,
      group: {
        groupId: group.groupId
      },
      tasks: categorized,
      totalTasks: tasks.length
    });
  } catch (err) {
    console.error("Get group tasks error:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// 4. Update task progress + optional comment
exports.updateTaskProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { progress, comment } = req.body;
    const user = req.user;

    if (progress === undefined || isNaN(Number(progress))) {
      return res.status(400).json({ error: "Valid progress percentage (0-100) is required" });
    }

    const progressValue = Math.max(0, Math.min(100, Number(progress)));
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Only creator or assignee can update progress
    const canUpdate = task.createdBy.email === user.email || task.assignedTo.email === user.email;
    if (!canUpdate) {
      return res.status(403).json({ error: "Not authorized to update this task" });
    }

    const oldProgress = task.progress;
    task.progress = progressValue;

    if (comment?.trim()) {
      task.comments.push({
        text: comment.trim(),
        author: {
          email: user.email,
          name: user.email.split('@')[0],
          sapId: user.email.split('@')[0]
        },
        date: new Date().toLocaleString()
      });
    }

    task.history.push({
      action: "Progress Updated",
      details: `Progress changed from ${oldProgress}% to ${progressValue}%`,
      changedBy: { 
        email: user.email, 
        name: user.email.split('@')[0]
      }
    });

    await task.save();

    res.json({
      message: "Task progress updated",
      task
    });
  } catch (err) {
    console.error("Update progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 5. Get single task
exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = req.user;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const group = await Group.findOne({ groupId: task.groupId });
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Check if user is a member of the group
    const memberEmails = [
      group.leader.email,
      group.member2?.email,
      group.member3?.email
    ].filter(Boolean);
    
    if (!memberEmails.includes(user.email)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// 6. Get tasks assigned to current user
exports.getMyTasks = async (req, res) => {
  try {
    const user = req.user;
    const tasks = await Task.find({ "assignedTo.email": user.email })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// 7. Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const user = req.user;

    if (!text?.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.comments.push({
      text: text.trim(),
      author: {
        email: user.email,
        name: user.email.split('@')[0],
        sapId: user.email.split('@')[0]
      },
      date: new Date().toLocaleString()
    });

    task.history.push({
      action: "Comment Added",
      details: "New comment added to task",
      changedBy: { 
        email: user.email, 
        name: user.email.split('@')[0]
      }
    });

    await task.save();
    res.json({ message: "Comment added", task });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// 8. Update task details
exports.updateTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, dueDate } = req.body;
    const user = req.user;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only creator can update task details
    if (task.createdBy.email !== user.email) {
      return res.status(403).json({ error: "Only task creator can update task details" });
    }

    if (title?.trim()) task.title = title.trim();
    if (description !== undefined) task.description = description?.trim() || "";
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    task.history.push({
      action: "Task Details Updated",
      details: "Task title, description, priority or due date was modified",
      changedBy: { 
        email: user.email, 
        name: user.email.split('@')[0]
      }
    });

    await task.save();
    res.json({ message: "Task updated", task });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// 9. Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = req.user;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only creator can delete the task
    if (task.createdBy.email !== user.email) {
      return res.status(403).json({ error: "Only task creator can delete this task" });
    }

    await Task.findByIdAndDelete(taskId);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};