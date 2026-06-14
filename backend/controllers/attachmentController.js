const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');

const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { members: req.user._id }]
    });

    if (!task) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const attachment = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.attachments.push(attachment);
    await task.save();

    const saved = task.attachments[task.attachments.length - 1];
    res.status(201).json({ success: true, message: 'File uploaded', data: saved });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { members: req.user._id }]
    });

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

    const filePath = path.join(__dirname, '..', 'uploads', attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    task.attachments.pull(req.params.attachmentId);
    await task.save();

    res.json({ success: true, message: 'Attachment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { uploadAttachment, deleteAttachment };
