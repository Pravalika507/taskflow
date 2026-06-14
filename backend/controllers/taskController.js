const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendTaskAssignedEmail, sendTaskDeletedEmail, sendTaskStatusChangedEmail } = require('../utils/email');
const { getAssignableTeamUsers } = require('../utils/team');

const getTasks = async (req, res) => {
  try {
    const { search, status, priority, dueToday, sortBy, page = 1, limit = 8 } = req.query;
    const query = { $or: [{ user: req.user._id }, { members: req.user._id }] };

    if (search) {
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (dueToday === 'true') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: start, $lte: end };
    }

    const sortOrder = sortBy === 'oldest' ? 1 : -1;
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('user', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: sortOrder })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const baseQuery = { $or: [{ user: userId }, { members: userId }] };

    const [total, pending, completed, overdue] = await Promise.all([
      Task.countDocuments({ ...baseQuery }),
      Task.countDocuments({ ...baseQuery, status: 'pending' }),
      Task.countDocuments({ ...baseQuery, status: 'completed' }),
      Task.countDocuments({ ...baseQuery, status: 'pending', dueDate: { $lt: now, $ne: null } })
    ]);

    res.json({ success: true, data: { total, pending, completed, overdue } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { members: req.user._id }]
    })
      .populate('user', 'name email')
      .populate('members', 'name email');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, status, priority, dueDate, members } = req.body;

    let memberIds = [];
    if (Array.isArray(members) && members.length) {
      const validMembers = await getAssignableTeamUsers(req.user._id, members);
      memberIds = validMembers.map((u) => u._id);
    }

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      user: req.user._id,
      members: memberIds
    });

    const populated = await Task.findById(task._id)
      .populate('user', 'name email')
      .populate('members', 'name email');

    // Notify newly assigned members by email (best-effort, don't block response)
    if (memberIds.length) {
      const memberUsers = await User.find({ _id: { $in: memberIds } }).select('name email');
      memberUsers
        .filter((m) => String(m._id) !== String(req.user._id))
        .forEach((m) => {
          sendTaskAssignedEmail(m.name, m.email, populated, req.user.name).catch((e) =>
            console.error('Failed to send task assignment email:', e.message)
          );
        });
    }

    res.status(201).json({ success: true, message: 'Task created successfully', data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, status, priority, dueDate, members } = req.body;

    const existing = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { members: req.user._id }]
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const update = { title, description, status, priority, dueDate: dueDate || null };

    let newlyAddedMembers = [];
    if (Array.isArray(members)) {
      const validMembers = await getAssignableTeamUsers(req.user._id, members);
      const newMemberIds = validMembers.map((u) => u._id);
      const previousIds = (existing.members || []).map((id) => String(id));
      newlyAddedMembers = validMembers.filter((u) => !previousIds.includes(String(u._id)));
      update.members = newMemberIds;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id },
      update,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('members', 'name email');

    if (newlyAddedMembers.length) {
      newlyAddedMembers
        .filter((m) => String(m._id) !== String(req.user._id))
        .forEach((m) => {
          sendTaskAssignedEmail(m.name, m.email, task, req.user.name).catch((e) =>
            console.error('Failed to send task assignment email:', e.message)
          );
        });
    }

    res.json({ success: true, message: 'Task updated successfully', data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'pending', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, $or: [{ user: req.user._id }, { members: req.user._id }] },
      { status },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('members', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Email rule: notify everyone involved EXCEPT the person who changed the status
    const changerId = String(req.user._id);
    const toNotify = [];
    if (String(task.user._id) !== changerId) toNotify.push(task.user);
    (task.members || []).forEach((m) => {
      if (String(m._id) !== changerId) toNotify.push(m);
    });

    toNotify.forEach((person) => {
      sendTaskStatusChangedEmail(person.name, person.email, task.title, status, req.user.name).catch((e) =>
        console.error('Failed to send status email:', e.message)
      );
    });

    res.json({ success: true, message: `Task marked as ${status}`, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { members: req.user._id }]
    })
      .populate('user', 'name email')
      .populate('members', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.deleteOne({ _id: task._id });

    const deleterId = String(req.user._id);
    const deleterName = req.user.name;

    // Notify everyone involved except the person who deleted it
    const toNotify = [];
    if (String(task.user._id) !== deleterId) {
      toNotify.push(task.user);
    }
    (task.members || []).forEach((m) => {
      if (String(m._id) !== deleterId) toNotify.push(m);
    });

    toNotify.forEach((person) => {
      sendTaskDeletedEmail(person.name, person.email, task.title, deleterName).catch((e) =>
        console.error('Failed to send task deleted email:', e.message)
      );
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getTasks, getStats, getTask, createTask, updateTask, updateStatus, deleteTask };
