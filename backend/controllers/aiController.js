const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const { sendTaskAssignedEmail } = require('../utils/email');
const { getTeamUsersForUser } = require('../utils/team');

const SYSTEM_PROMPT = `You are TaskFlow AI, a friendly and smart task management assistant.
You help users manage their tasks by answering questions and performing actions.

IMPORTANT RULES:
- When the user wants to CREATE a task, respond with ONLY valid JSON (no extra text):
  {"action":"create","task":{"title":"...","description":"...","priority":"low|medium|high","status":"todo|pending","dueDate":"YYYY-MM-DD or null","assignees":["member name or email"]}}

- When the user wants to COMPLETE a task, respond with ONLY valid JSON:
  {"action":"complete","taskTitle":"..."}

- When the user wants to DELETE a task, respond with ONLY valid JSON:
  {"action":"delete","taskTitle":"..."}

- When the user wants to CHANGE a task priority or status, respond with ONLY valid JSON:
  {"action":"update","taskTitle":"...","updates":{"priority":"low|medium|high","status":"todo|pending|completed"}}

- When the user wants to ASSIGN an existing task to a team member, respond with ONLY valid JSON:
  {"action":"assign","taskTitle":"...","assignees":["member name or email"]}

- For all other requests (summaries, counts, questions, advice), respond with plain conversational text only. No JSON.

- Keep answers short, friendly, and helpful.
- For date calculations, today is {TODAY}.`;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const validPriority = (value) => ['low', 'medium', 'high'].includes(value);
const validStatus = (value) => ['todo', 'pending', 'completed'].includes(value);
const normalizeList = (value) => Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

const userMatchesName = (user, name) => {
  const memberName = user?.name?.toLowerCase() || '';
  const memberEmail = user?.email?.toLowerCase() || '';
  return memberName === name ||
    memberEmail === name ||
    (memberName && memberName.includes(name)) ||
    (memberName && name.includes(memberName));
};

const resolveAssignees = async (userId, assignees = []) => {
  const names = normalizeList(assignees).map(name => String(name).trim().toLowerCase()).filter(Boolean);
  if (!names.length) return { members: [], missing: [] };

  const team = await getTeamUsersForUser(userId);

  const members = [];
  const missing = [];

  names.forEach(name => {
    const match = team
      .find((member) => userMatchesName(member, name));

    if (match && !members.some(member => String(member._id) === String(match._id))) {
      members.push(match);
    } else if (!match) {
      missing.push(name);
    }
  });

  return { members, missing };
};

exports.chat = async (req, res) => {
  try {
    const { message, tasks = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = SYSTEM_PROMPT.replace('{TODAY}', today);

    const taskSummary = tasks.length
      ? tasks
          .map(t =>
            `- "${t.title}" [${t.status}] [${t.priority} priority]${t.dueDate ? ` due ${t.dueDate.split('T')[0]}` : ''}`
          )
          .join('\n')
      : 'No tasks yet.';

    const prompt = `${systemPrompt}

Current tasks for ${req.user.name || req.user.email}:
${taskSummary}

User message: ${message.trim()}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Try to parse a JSON action from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.action === 'create' && parsed.task?.title) {
          const { members, missing } = await resolveAssignees(req.user._id, parsed.task.assignees);
          const newTask = await Task.create({
            title: parsed.task.title,
            description: parsed.task.description || '',
            priority: ['low', 'medium', 'high'].includes(parsed.task.priority) ? parsed.task.priority : 'medium',
            status: ['todo', 'pending', 'completed'].includes(parsed.task.status) ? parsed.task.status : 'todo',
            dueDate: parsed.task.dueDate || null,
            user: req.user._id,
            members: members.map(member => member._id),
          });
          const populated = await Task.findById(newTask._id).populate('members', 'name email');
          members.forEach(member => {
            sendTaskAssignedEmail(member.name, member.email, populated, req.user.name).catch((e) =>
              console.error('Task assignment email failed:', e.message)
            );
          });
          return res.json({
            success: true,
            reply: `Done! I created **"${newTask.title}"** with ${newTask.priority} priority.${members.length ? ` Assigned to ${members.map(member => member.name).join(', ')}.` : ''}${missing.length ? ` I couldn't find ${missing.join(', ')} in your team.` : ''}`,
            action: 'create',
            task: populated,
          });
        }

        if (parsed.action === 'complete' && parsed.taskTitle) {
          const task = await Task.findOneAndUpdate(
            {
              user: req.user._id,
              title: { $regex: escapeRegex(parsed.taskTitle), $options: 'i' },
              status: { $ne: 'completed' },
            },
            { status: 'completed' },
            { new: true }
          );
          return res.json({
            success: true,
            reply: task
              ? `Marked **"${task.title}"** as completed!`
              : `Couldn't find a task matching "${parsed.taskTitle}". Check the task name and try again.`,
            action: task ? 'complete' : null,
          });
        }

        if (parsed.action === 'update' && parsed.taskTitle && parsed.updates) {
          const updates = {};
          if (validPriority(parsed.updates.priority)) updates.priority = parsed.updates.priority;
          if (validStatus(parsed.updates.status)) updates.status = parsed.updates.status;

          if (!Object.keys(updates).length) {
            return res.json({
              success: true,
              reply: 'Tell me the new priority or status you want to set.',
              action: null,
            });
          }

          const task = await Task.findOneAndUpdate(
            {
              $or: [{ user: req.user._id }, { members: req.user._id }],
              title: { $regex: escapeRegex(parsed.taskTitle), $options: 'i' },
            },
            updates,
            { new: true }
          );

          const changed = [
            updates.priority ? `priority to ${updates.priority}` : null,
            updates.status ? `status to ${updates.status}` : null,
          ].filter(Boolean).join(' and ');

          return res.json({
            success: true,
            reply: task
              ? `Updated **"${task.title}"** ${changed}.`
              : `Couldn't find a task matching "${parsed.taskTitle}".`,
            action: task ? 'update' : null,
            task,
          });
        }

        if (parsed.action === 'assign' && parsed.taskTitle) {
          const task = await Task.findOne({
            user: req.user._id,
            title: { $regex: escapeRegex(parsed.taskTitle), $options: 'i' },
          }).populate('members', 'name email');

          if (!task) {
            return res.json({
              success: true,
              reply: `Couldn't find a task you own matching "${parsed.taskTitle}".`,
              action: null,
            });
          }

          const { members, missing } = await resolveAssignees(req.user._id, parsed.assignees);
          if (!members.length) {
            return res.json({
              success: true,
              reply: missing.length
                ? `I couldn't find ${missing.join(', ')} in your team. Invite them first or wait until they accept.`
                : 'Tell me which team member to assign.',
              action: null,
            });
          }

          const existingIds = (task.members || []).map(member => String(member._id || member));
          const newMembers = members.filter(member => !existingIds.includes(String(member._id)));
          task.members = [...existingIds, ...newMembers.map(member => member._id)];
          await task.save();

          const populated = await Task.findById(task._id)
            .populate('user', 'name email')
            .populate('members', 'name email');

          newMembers.forEach(member => {
            sendTaskAssignedEmail(member.name, member.email, populated, req.user.name).catch((e) =>
              console.error('Task assignment email failed:', e.message)
            );
          });

          return res.json({
            success: true,
            reply: `Assigned **"${populated.title}"** to ${members.map(member => member.name).join(', ')}.${missing.length ? ` I couldn't find ${missing.join(', ')}.` : ''}`,
            action: 'assign',
            task: populated,
          });
        }

        if (parsed.action === 'delete' && parsed.taskTitle) {
          const task = await Task.findOneAndDelete({
            user: req.user._id,
            title: { $regex: escapeRegex(parsed.taskTitle), $options: 'i' },
          });
          return res.json({
            success: true,
            reply: task
              ? `Deleted task **"${task.title}"**.`
              : `Couldn't find a task matching "${parsed.taskTitle}".`,
            action: task ? 'delete' : null,
          });
        }
      } catch (_) {
        // Not valid JSON — fall through to plain text reply
      }
    }

    return res.json({ success: true, reply: raw });
  } catch (err) {
    console.error('AI chat error:', err.message);
    if (err.message?.includes('API_KEY') || err.message?.includes('403')) {
      return res.status(500).json({ success: false, message: 'Invalid or missing GEMINI_API_KEY in .env' });
    }
    res.status(500).json({ success: false, message: 'AI service unavailable. Try again shortly.' });
  }
};
