import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import { sanitizeInput } from '../infra/sanitize.js';
import { emailService } from '../email/email.service.js';
import type {
  AuthLoginDTO,
  AuthRegisterDTO,
  AuthSessionDTO,
  UpdateEmailDTO,
  UpdatePasswordDTO,
  UpdateProfileDTO,
  UpdateProfileResult,
} from '../../../shared/contracts/index.js';

const SALT_ROUNDS = 10;

export class AuthService {
  async register(input: AuthRegisterDTO): Promise<AuthSessionDTO> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name ? sanitizeInput(input.name) : null,
        passwordHash,
      },
    });

    // Send welcome email (non-blocking — wrapper swallows errors)
    emailService.sendWelcomeEmail(user.email, user.name);

    // Generate and send verification email
    const verificationToken = await this.generateVerificationToken(user.id);
    emailService.sendVerificationEmail(verificationToken, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
    };
  }

  async login(input: AuthLoginDTO): Promise<AuthSessionDTO> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new HttpError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new HttpError('Invalid credentials', 401);
    }

    return {
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
    };
  }

  async me(userId: string): Promise<AuthSessionDTO | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    return {
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
    };
  }

  async updateProfile(userId: string, input: UpdateProfileDTO): Promise<UpdateProfileResult> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: sanitizeInput(input.name) },
    });

    return {
      user: { id: updated.id, email: updated.email, name: updated.name, emailVerified: updated.emailVerified },
    };
  }

  async updateEmail(userId: string, input: UpdateEmailDTO): Promise<UpdateProfileResult> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError('User not found', 404);

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new HttpError('Current password is incorrect', 401);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== userId) throw new HttpError('Email already in use', 409);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { email: input.email },
    });

    return {
      user: { id: updated.id, email: updated.email, name: updated.name, emailVerified: updated.emailVerified },
    };
  }

  async updatePassword(userId: string, input: UpdatePasswordDTO): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError('User not found', 404);

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new HttpError('Current password is incorrect', 401);

    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password updated' };
  }

  // ── Email Verification ──────────────────────────────────────────────

  async generateVerificationToken(userId: string): Promise<string> {
    // Delete any existing tokens for this user first
    await prisma.verificationToken.deleteMany({ where: { userId } });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: { userId, token, expiresAt },
    });

    return token;
  }

  async verifyEmail(token: string): Promise<{ id: string; email: string; name: string | null; emailVerified: boolean }> {
    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record) {
      throw new HttpError('Invalid verification token', 404);
    }

    if (record.expiresAt < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({ where: { id: record.id } });
      throw new HttpError('Verification token has expired', 400);
    }

    const user = await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });

    // Delete the used token
    await prisma.verificationToken.delete({ where: { id: record.id } });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: true,
    };
  }

  async resendVerification(userId: string): Promise<{ token: string; message: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError('User not found', 404);

    if (user.emailVerified) {
      throw new HttpError('Email already verified', 400);
    }

    const token = await this.generateVerificationToken(userId);

    // Send verification email (non-blocking — wrapper swallows errors)
    emailService.sendVerificationEmail(token, user.email);

    return { token, message: 'Verification email sent' };
  }
}

export const authService = new AuthService();
