import { Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { ResponseUtil } from "../utils/response.util";
import { AuthRequest } from "../types";

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  updateFCMToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { fcm_token } = req.body;

      if (!fcm_token) {
        ResponseUtil.error(res, "FCM token is required", 400);
        return;
      }

      await this.notificationService.updateFCMToken(userId, fcm_token);
      ResponseUtil.success(res, null, "FCM token updated successfully");
    } catch (error) {
      next(error);
    }
  };

  removeFCMToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      await this.notificationService.removeFCMToken(userId);
      ResponseUtil.success(res, null, "FCM token removed successfully");
    } catch (error) {
      next(error);
    }
  };

  toggleNotifications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { enabled } = req.body;

      if (typeof enabled !== "boolean") {
        ResponseUtil.error(res, "enabled must be a boolean", 400);
        return;
      }

      await this.notificationService.toggleNotifications(userId, enabled);
      ResponseUtil.success(
        res,
        { enabled },
        `Notifications ${enabled ? "enabled" : "disabled"}`
      );
    } catch (error) {
      next(error);
    }
  };

  testNotification = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { title, body } = req.body;

      await this.notificationService.sendToUser(userId, {
        title: title || "Test Notification",
        body: body || "This is a test notification",
        type: "new_message" as any,
      });

      ResponseUtil.success(res, null, "Test notification sent");
    } catch (error) {
      next(error);
    }
  };
}
