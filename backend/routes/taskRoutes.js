const express = require('express');
const { body } = require('express-validator');
const {
  getTasks,
  getStats,
  getTask,
  createTask,
  updateTask,
  updateStatus,
  deleteTask
} = require('../controllers/taskController');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const { uploadAttachment, deleteAttachment } = require('../controllers/attachmentController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

const taskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'pending', 'completed']).withMessage('Status must be todo, pending, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('members')
    .optional()
    .isArray().withMessage('Members must be an array')
];

const commentValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters')
];

router.use(protect);

router.get('/', getTasks);
router.get('/stats', getStats);
router.get('/:id', getTask);
router.post('/', taskValidation, createTask);
router.put('/:id', taskValidation, updateTask);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteTask);

router.get('/:id/comments', getComments);
router.post('/:id/comments', commentValidation, addComment);
router.delete('/:id/comments/:commentId', deleteComment);

router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

module.exports = router;
