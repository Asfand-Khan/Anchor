import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ResponseUtil } from '../utils/response.util';
import { AuthRequest, UpdateProfileDto, UserListQuery } from '../types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.userService.getProfile(userId);
      ResponseUtil.success(res, profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data: UpdateProfileDto = req.body;
      const profile = await this.userService.updateProfile(userId, data);
      ResponseUtil.success(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  uploadProfilePicture = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      
      if (!req.file) {
        ResponseUtil.error(res, 'No file uploaded', 400);
        return;
      }

      const filePath = `/uploads/${req.file.filename}`;
      const result = await this.userService.updateProfilePicture(userId, filePath);
      ResponseUtil.success(res, result, 'Profile picture uploaded successfully');
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user!.id;
      const user = await this.userService.getUserById(userId, requestingUserId);
      ResponseUtil.success(res, user);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const query: UserListQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        gender: req.query.gender as any,
        search: req.query.search as string,
      };

      const users = await this.userService.getAllUsers(query, currentUserId);
      ResponseUtil.success(res, users);
    } catch (error) {
      next(error);
    }
  };
}