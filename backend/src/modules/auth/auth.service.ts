import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Role, User } from '@prisma/client';
import { authRepository } from './auth.repository';
import { config } from '../../config';
import { JwtPayload, AuthUser } from '../../types';
import { GraphQLError } from 'graphql';

export class AuthService {
  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcryptRounds);
  }

  private comparePasswords(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  generateAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
    } as jwt.SignOptions);
  }

  generateRefreshToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    } catch {
      throw new GraphQLError('Invalid or expired access token', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      throw new GraphQLError('Invalid or expired refresh token', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
  }

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: Role;
  }) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new GraphQLError('Email already registered', {
        extensions: { code: 'EMAIL_TAKEN' },
      });
    }

    this.validatePassword(input.password);

    const hashedPassword = await this.hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email.toLowerCase(),
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role || Role.EMPLOYEE,
    });

    const [accessToken, refreshToken] = await this.issueTokens(user);
    return { accessToken, refreshToken, user };
  }

  async login(input: { email: string; password: string }) {
    const user = await authRepository.findUserByEmail(input.email.toLowerCase());
    if (!user) {
      throw new GraphQLError('Invalid email or password', {
        extensions: { code: 'INVALID_CREDENTIALS' },
      });
    }

    if (!user.isActive) {
      throw new GraphQLError('Account is deactivated. Contact support.', {
        extensions: { code: 'ACCOUNT_DEACTIVATED' },
      });
    }

    const isValid = await this.comparePasswords(input.password, user.password);
    if (!isValid) {
      throw new GraphQLError('Invalid email or password', {
        extensions: { code: 'INVALID_CREDENTIALS' },
      });
    }

    await authRepository.updateUser(user.id, { lastLoginAt: new Date() });
    const [accessToken, refreshToken] = await this.issueTokens(user);
    await authRepository.logActivity(user.id, 'LOGIN', 'auth');

    return { accessToken, refreshToken, user };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await authRepository.deleteRefreshToken(refreshToken);
    } else {
      await authRepository.deleteUserRefreshTokens(userId);
    }
    await authRepository.logActivity(userId, 'LOGOUT', 'auth');
    return { success: true, message: 'Logged out successfully' };
  }

  async refreshTokens(token: string) {
    const payload = this.verifyRefreshToken(token);
    const storedToken = await authRepository.findRefreshToken(token);

    if (!storedToken) {
      throw new GraphQLError('Refresh token not found or revoked', {
        extensions: { code: 'INVALID_TOKEN' },
      });
    }

    if (new Date() > storedToken.expiresAt) {
      await authRepository.deleteRefreshToken(token);
      throw new GraphQLError('Refresh token expired', {
        extensions: { code: 'TOKEN_EXPIRED' },
      });
    }

    const user = await authRepository.findUserById(payload.userId);
    if (!user || !user.isActive) {
      throw new GraphQLError('User not found or inactive', {
        extensions: { code: 'USER_INACTIVE' },
      });
    }

    await authRepository.deleteRefreshToken(token);
    const [accessToken, newRefreshToken] = await this.issueTokens(user);
    return { accessToken, refreshToken: newRefreshToken, user };
  }

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email.toLowerCase());
    if (!user) {
      return { success: true, message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = uuidv4();
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await authRepository.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: expiry,
    });

    // In production, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { success: true, message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await authRepository.findUserByResetToken(token);
    if (!user) {
      throw new GraphQLError('Invalid or expired reset token', {
        extensions: { code: 'INVALID_TOKEN' },
      });
    }

    this.validatePassword(newPassword);
    const hashedPassword = await this.hashPassword(newPassword);

    await authRepository.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });

    await authRepository.deleteUserRefreshTokens(user.id);
    await authRepository.logActivity(user.id, 'PASSWORD_RESET', 'auth');

    return { success: true, message: 'Password reset successfully. Please login.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });

    const isValid = await this.comparePasswords(currentPassword, user.password);
    if (!isValid) {
      throw new GraphQLError('Current password is incorrect', {
        extensions: { code: 'INVALID_PASSWORD' },
      });
    }

    this.validatePassword(newPassword);
    const hashed = await this.hashPassword(newPassword);
    await authRepository.updateUser(userId, { password: hashed });
    await authRepository.deleteUserRefreshTokens(userId);
    await authRepository.logActivity(userId, 'CHANGE_PASSWORD', 'auth');

    return { success: true, message: 'Password changed successfully.' };
  }

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
    return user;
  }

  async updateProfile(userId: string, input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  }) {
    return authRepository.updateUser(userId, input);
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }

  async getUserFromToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = this.verifyAccessToken(token);
      const user = await authRepository.findUserById(payload.userId);
      if (!user || !user.isActive) return null;
      return { id: user.id, email: user.email, role: user.role };
    } catch {
      return null;
    }
  }

  private async issueTokens(user: User): Promise<[string, string]> {
    const accessToken = this.generateAccessToken(user);
    const refreshTokenStr = this.generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await authRepository.createRefreshToken({
      token: refreshTokenStr,
      user: { connect: { id: user.id } },
      expiresAt,
    });

    return [accessToken, refreshTokenStr];
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new GraphQLError('Password must be at least 8 characters', {
        extensions: { code: 'WEAK_PASSWORD' },
      });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new GraphQLError('Password must contain uppercase, lowercase, and number', {
        extensions: { code: 'WEAK_PASSWORD' },
      });
    }
  }
}

export const authService = new AuthService();
