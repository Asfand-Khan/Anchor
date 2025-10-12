import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { ValidationUtil } from '../utils/validation.util';
import { validate } from '../middleware/validation.middleware';
// import { upload } from '../middleware/upload.middleware';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/users
 * @desc    Get all users (with filters)
 * @access  Private
 */
router.get(
  '/',
  ValidationUtil.userListQuery(),
  validate,
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:userId', userController.getUserById);

export default router;