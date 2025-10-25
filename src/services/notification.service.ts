import { getMessaging } from "../config/firebase";
import { UserRepository } from "../repositories/user.repository";
import admin from "firebase-admin";

export enum NotificationType {
  NEW_MESSAGE = "new_message",
  FRIEND_REQUEST = "friend_request",
  FRIEND_ACCEPT = "friend_accept",
  NEW_LIKE = "new_like",
}

interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
}

export class NotificationService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Send push notification to a single user
   */
  async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const messaging = getMessaging();
      if (!messaging) {
        console.warn("⚠️ Firebase messaging not initialized");
        return false;
      }

      // Get user's FCM token
      const user = await this.userRepository.findById(userId);
      if (!user || !user.fcm_token || !user.notifications_enabled) {
        console.log(
          `User ${userId} has no FCM token or notifications disabled`
        );
        return false;
      }

      const message: admin.messaging.Message = {
        token: user.fcm_token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          type: payload.type,
          ...payload.data,
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await messaging.send(message);
      console.log("✅ Notification sent successfully:", response);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending notification:", error);

      // If token is invalid, remove it from database
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        await this.userRepository.update(userId, { fcm_token: null });
        console.log(`Removed invalid FCM token for user ${userId}`);
      }

      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    payload: NotificationPayload
  ): Promise<{ success: number; failure: number }> {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, payload))
    );

    const success = results.filter(
      (r) => r.status === "fulfilled" && r.value
    ).length;
    const failure = results.length - success;

    return { success, failure };
  }

  /**
   * Send new message notification
   */
  async notifyNewMessage(
    receiverId: string,
    senderName: string,
    messagePreview: string
  ): Promise<boolean> {
    return await this.sendToUser(receiverId, {
      title: `New message from ${senderName}`,
      body:
        messagePreview.length > 100
          ? messagePreview.substring(0, 100) + "..."
          : messagePreview,
      type: NotificationType.NEW_MESSAGE,
      data: {
        screen: "Chat",
        senderId: receiverId,
      },
    });
  }

  /**
   * Send friend request notification
   */
  async notifyFriendRequest(
    receiverId: string,
    senderName: string,
    senderId: string
  ): Promise<boolean> {
    return await this.sendToUser(receiverId, {
      title: "New Friend Request",
      body: `${senderName} sent you a friend request`,
      type: NotificationType.FRIEND_REQUEST,
      data: {
        screen: "FriendRequests",
        senderId,
      },
    });
  }

  /**
   * Send friend request accepted notification
   */
  async notifyFriendAccept(
    receiverId: string,
    accepterName: string,
    accepterId: string
  ): Promise<boolean> {
    return await this.sendToUser(receiverId, {
      title: "Friend Request Accepted",
      body: `${accepterName} accepted your friend request`,
      type: NotificationType.FRIEND_ACCEPT,
      data: {
        screen: "Profile",
        userId: accepterId,
      },
    });
  }

  /**
   * Send like notification
   */
  async notifyLike(
    receiverId: string,
    likerName: string,
    likerId: string
  ): Promise<boolean> {
    return await this.sendToUser(receiverId, {
      title: "New Like",
      body: `${likerName} liked your profile`,
      type: NotificationType.NEW_LIKE,
      data: {
        screen: "Profile",
        userId: likerId,
      },
    });
  }

  /**
   * Update user's FCM token
   */
  async updateFCMToken(userId: string, fcmToken: string): Promise<void> {
    await this.userRepository.update(userId, { fcm_token: fcmToken });
    console.log(`✅ FCM token updated for user ${userId}`);
  }

  /**
   * Remove user's FCM token (on logout)
   */
  async removeFCMToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, { fcm_token: null });
    console.log(`✅ FCM token removed for user ${userId}`);
  }

  /**
   * Toggle notifications for user
   */
  async toggleNotifications(userId: string, enabled: boolean): Promise<void> {
    await this.userRepository.update(userId, {
      notifications_enabled: enabled,
    });
    console.log(
      `✅ Notifications ${enabled ? "enabled" : "disabled"} for user ${userId}`
    );
  }
}
