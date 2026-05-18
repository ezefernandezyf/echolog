import bcrypt from 'bcryptjs';
import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
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
        name: input.name ?? null,
        passwordHash,
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
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
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async me(userId: string): Promise<AuthSessionDTO | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    return {
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async updateProfile(userId: string, input: UpdateProfileDTO): Promise<UpdateProfileResult> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: input.name },
    });

    return {
      user: { id: updated.id, email: updated.email, name: updated.name },
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
      user: { id: updated.id, email: updated.email, name: updated.name },
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
}

export const authService = new AuthService();
