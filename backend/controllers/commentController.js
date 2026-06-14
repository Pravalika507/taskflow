const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Task = require('../models/Task');

const getAccessibleTask = async (taskId, userId) => {
  return Task.findOne({
    _id: taskId,
    $or: [{ user: userId }, { members: userId }]
  });
};

// GET /api/tasks/:id/comments
const getComments = async (req, res) => {
  try {
    const task = await getAccessibleTask(req.params.id, req.user._id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comments = await Comment.find({ task: task._id })
      .populate('author', 'name email')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const task = await getAccessibleTask(req.params.id, req.user._id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = await Comment.create({
      task: task._id,
      author: req.user._id,
      text: req.body.text
    });

    const populated = await Comment.findById(comment._id).populate('author', 'name email');

    res.status(201).json({ success: true, message: 'Comment added', data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/tasks/:id/comments/:commentId
const deleteComment = async (req, res) => {
  try {
    const task = await getAccessibleTask(req.params.id, req.user._id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = await Comment.findOne({ _id: req.params.commentId, task: task._id });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (String(comment.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getComments, addComment, deleteComment };
