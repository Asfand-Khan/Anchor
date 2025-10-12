import { FollowRepository } from "../repositories/follow.repository";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../middleware/error.middleware";

export class FollowService {
  private followRepository: FollowRepository;
  private userRepository: UserRepository;

  constructor() {
    this.followRepository = new FollowRepository();
    this.userRepository = new UserRepository();
  }

  async sendFollowRequest(followerId: string, followingId: string) {
    // Check if trying to follow self
    if (followerId === followingId) {
      throw new AppError("Cannot follow yourself", 400);
    }

    // Check if user exists
    const userToFollow = await this.userRepository.findById(followingId);
    if (!userToFollow) {
      throw new AppError("User not found", 404);
    }

    // Check if already following or request exists
    const existingFollow = await this.followRepository.findByUsers(
      followerId,
      followingId
    );
    if (existingFollow) {
      throw new AppError("Follow request already exists", 409);
    }

    // Create follow request
    const follow = await this.followRepository.create(followerId, followingId);

    return {
      id: follow.id,
      follower_id: follow.follower_id,
      following_id: follow.following_id,
      status: follow.status,
      created_at: follow.created_at,
    };
  }

  async acceptFollowRequest(followId: string, userId: string) {
    const follow = await this.followRepository.findById(followId);

    if (!follow) {
      throw new AppError("Follow request not found", 404);
    }

    // Check if user is the one being followed
    if (follow.following_id !== userId) {
      throw new AppError("Not authorized to accept this request", 403);
    }

    // Accept the follow request
    const updatedFollow = await this.followRepository.acceptFollow(followId);

    return {
      id: updatedFollow!.id,
      follower_id: updatedFollow!.follower_id,
      following_id: updatedFollow!.following_id,
      status: updatedFollow!.status,
      updated_at: updatedFollow!.updated_at,
    };
  }

  async removeFollow(followId: string, userId: string) {
    const follow = await this.followRepository.findById(followId);

    if (!follow) {
      throw new AppError("Follow not found", 404);
    }

    // Check if user is either the follower or the one being followed
    if (follow.follower_id !== userId && follow.following_id !== userId) {
      throw new AppError("Not authorized to remove this follow", 403);
    }

    await this.followRepository.delete(followId);

    return { message: "Follow removed successfully" };
  }

  async getPendingRequests(userId: string) {
    const follows = await this.followRepository.getPendingRequests(userId);

    return follows.map((follow) => ({
      id: follow.id,
      follower: {
        id: follow.follower.id,
        full_name: follow.follower.full_name,
        profile_picture: follow.follower.profile_picture,
        bio: follow.follower.bio,
      },
      created_at: follow.created_at,
    }));
  }

  async getMatches(userId: string) {
    const matches = await this.followRepository.getMatches(userId);

    return matches.map((match) => ({
      id: match.id,
      full_name: match.full_name,
      profile_picture: match.profile_picture,
      bio: match.bio,
      location: match.location,
      is_online: match.is_online,
      last_seen: match.last_seen,
    }));
  }

  async checkMutualFollow(user1Id: string, user2Id: string): Promise<boolean> {
    return await this.followRepository.checkMutualFollow(user1Id, user2Id);
  }
}
