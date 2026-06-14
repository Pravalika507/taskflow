const Invitation = require('../models/Invitation');
const TeamMember = require('../models/TeamMember');

const getTeamUsersForUser = async (userId) => {
  const userKey = String(userId);
  const seen = new Set();
  const teamUsers = [];
  const workspaceOwnerIds = new Set([userKey]);

  const addUser = (otherUser) => {
    if (!otherUser || String(otherUser._id) === userKey) return;
    const key = String(otherUser._id);
    if (seen.has(key)) return;

    seen.add(key);
    teamUsers.push(otherUser);
  };

  const directTeamMembers = await TeamMember.find({
    $or: [
      { owner: userId },
      { member: userId }
    ]
  })
    .populate('owner', 'name email')
    .populate('member', 'name email')
    .sort({ createdAt: -1 });

  directTeamMembers.forEach((record) => {
    addUser(String(record.owner?._id) === userKey ? record.member : record.owner);
  });

  const directInvitations = await Invitation.find({
    status: 'accepted',
    $or: [
      { invitedBy: userId },
      { acceptedBy: userId }
    ]
  })
    .populate('invitedBy', 'name email')
    .populate('acceptedBy', 'name email')
    .sort({ updatedAt: -1 });

  directInvitations.forEach((invitation) => {
    if (invitation.invitedBy?._id) workspaceOwnerIds.add(String(invitation.invitedBy._id));
    addUser(String(invitation.invitedBy?._id) === userKey
      ? invitation.acceptedBy
      : invitation.invitedBy);
  });

  const workspaceInvitations = await Invitation.find({
    status: 'accepted',
    invitedBy: { $in: [...workspaceOwnerIds] }
  })
    .populate('invitedBy', 'name email')
    .populate('acceptedBy', 'name email')
    .sort({ updatedAt: -1 });

  workspaceInvitations.forEach((invitation) => {
    addUser(invitation.invitedBy);
    addUser(invitation.acceptedBy);
  });

  return teamUsers;
};

const getAssignableTeamUsers = async (userId, memberIds = []) => {
  if (!Array.isArray(memberIds) || !memberIds.length) return [];

  const requestedIds = new Set(memberIds.map((id) => String(id)));
  return (await getTeamUsersForUser(userId))
    .filter((member) => requestedIds.has(String(member._id)));
};

module.exports = { getTeamUsersForUser, getAssignableTeamUsers };
