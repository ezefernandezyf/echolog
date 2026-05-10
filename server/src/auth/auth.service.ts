import bcrypt from 'bcryptjs';
import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import type {
  AuthLoginDTO,
  AuthRegisterDTO,
  AuthSessionDTO,
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
}

export const authService = new AuthService();
