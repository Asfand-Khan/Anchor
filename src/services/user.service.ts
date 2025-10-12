import { UserRepository } from '../repositories/user.repository';
import { UpdateProfileDto, UserListQuery, PaginatedResponse } from '../types';
import { AppError } from '../middleware/error.middleware';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Calculate age
    const age = this.calculateAge(user.date_of_birth);

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      age,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      bio: user.bio,
      profile_picture: user.profile_picture,
      location: user.location,
      is_online: user.is_online,
      last_seen: user.last_seen,
      created_at: user.created_at,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.userRepository.update(userId, data);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const age = this.calculateAge(user.date_of_birth);

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      age,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      bio: user.bio,
      profile_picture: user.profile_picture,
      location: user.location,
    };
  }

  async updateProfilePicture(userId: string, filePath: string) {
    const user = await this.userRepository.update(userId, {
      profile_picture: filePath,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      profile_picture: user.profile_picture,
    };
  }

  async getUserById(userId: string, _requestingUserId?: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const age = this.calculateAge(user.date_of_birth);

    return {
      id: user.id,
      full_name: user.full_name,
      age,
      gender: user.gender,
      bio: user.bio,
      profile_picture: user.profile_picture,
      location: user.location,
      is_online: user.is_online,
      last_seen: user.last_seen,
    };
  }

  async getAllUsers(
    query: UserListQuery,
    currentUserId: string
  ): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { users, total } = await this.userRepository.findAll(
      page,
      limit,
      query.gender,
      query.search,
      currentUserId
    );

    const items = users.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      age: this.calculateAge(user.date_of_birth),
      gender: user.gender,
      bio: user.bio,
      profile_picture: user.profile_picture,
      location: user.location,
      is_online: user.is_online,
      last_seen: user.last_seen,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async updateOnlineStatus(userId: string, isOnline: boolean) {
    await this.userRepository.updateOnlineStatus(userId, isOnline);
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}