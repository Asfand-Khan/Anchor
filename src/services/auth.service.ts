import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { EmailService } from './email.service';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { RegisterDto, LoginDto } from '../types';
import { AppError } from '../middleware/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private userRepository: UserRepository;
  private refreshTokenRepository: RefreshTokenRepository;
  private emailService: EmailService;

  constructor() {
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
    this.emailService = new EmailService();
  }

  async register(data: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password_hash: passwordHash,
      full_name: data.full_name,
      date_of_birth: new Date(data.date_of_birth),
      gender: data.gender,
    });

    // Generate tokens
    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    // Send welcome email (async, don't wait)
    this.emailService.sendWelcomeEmail(user.email, user.full_name).catch(console.error);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture,
        bio: user.bio,
        location: user.location,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async login(data: LoginDto) {
    // Find user with password
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        profile_picture: user.profile_picture,
        bio: user.bio,
        location: user.location,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if token exists in database
    const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!storedToken) {
      throw new AppError('Refresh token not found', 401);
    }

    // Check if token is expired
    if (storedToken.expires_at < new Date()) {
      await this.refreshTokenRepository.deleteByToken(refreshToken);
      throw new AppError('Refresh token expired', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken({ id: decoded.id, email: decoded.email });

    return {
      access_token: accessToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, reset link has been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store reset token
    await this.userRepository.setResetToken(user.id, resetToken, expiresAt);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If email exists, reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find user by reset token
    const user = await this.userRepository.findByResetToken(token);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await this.userRepository.update(user.id, { password_hash: passwordHash });
    await this.userRepository.clearResetToken(user.id);

    // Invalidate all refresh tokens
    await this.refreshTokenRepository.deleteByUserId(user.id);

    return { message: 'Password reset successful' };
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepository.deleteByToken(refreshToken);
    return { message: 'Logged out successfully' };
  }
}