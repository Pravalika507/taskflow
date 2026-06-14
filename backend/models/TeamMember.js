const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

teamMemberSchema.index({ owner: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
