import { AppDataSource } from "../config/database";
import { User } from "../entities/User.entity";
import { Gender } from "../types";

export class UserRepository {
  private repository = AppDataSource.getRepository(User);

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return await this.repository
      .createQueryBuilder("user")
      .addSelect("user.password_hash")
      .where("user.id = :id", { id })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await this.repository
      .createQueryBuilder("user")
      .addSelect("user.password_hash")
      .where("user.email = :email", { email })
      .getOne();
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    gender?: Gender,
    search?: string,
    excludeUserId?: string
  ): Promise<{ users: User[]; total: number }> {
    const query = this.repository.createQueryBuilder("user");

    if (excludeUserId) {
      query.andWhere("user.id != :excludeUserId", { excludeUserId });
    }

    if (gender) {
      query.andWhere("user.gender = :gender", { gender });
    }

    if (search) {
      query.andWhere(
        "(user.full_name LIKE :search OR user.location LIKE :search)",
        { search: `%${search}%` }
      );
    }

    const [users, total] = await query
      .orderBy("user.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData);
    return await this.findById(id);
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.repository.update(id, {
      is_online: isOnline,
      last_seen: isOnline ? null : new Date(),
    });
  }

  async setResetToken(
    id: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    await this.repository.update(id, {
      reset_token: token,
      reset_token_expires: expiresAt,
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return await this.repository
      .createQueryBuilder("user")
      .addSelect("user.reset_token")
      .addSelect("user.reset_token_expires")
      .where("user.reset_token = :token", { token })
      .andWhere("user.reset_token_expires > :now", { now: new Date() })
      .getOne();
  }

  async clearResetToken(id: string): Promise<void> {
    await this.repository.update(id, {
      reset_token: null,
      reset_token_expires: null,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
