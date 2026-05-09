import { randomUUID } from 'node:crypto';
import { HttpError } from '../../lib/http.js';
import type { AuthLoginDTO, AuthRegisterDTO, AuthSessionDTO, AuthUserDTO } from '../../../../shared/contracts/index.js';

type AuthRecord = AuthUserDTO & { password: string };

const users = new Map<string, AuthRecord>();

export class AuthService {
  private toUser(user: AuthRecord): AuthUserDTO {
    return { id: user.id, email: user.email, name: user.name };
  }

  register(input: AuthRegisterDTO): AuthSessionDTO {
    if ([...users.values()].some((user) => user.email === input.email)) {
      throw new HttpError('Email already registered', 409);
    }

    const user = {
      id: randomUUID(),
      email: input.email,
      name: input.name ?? null,
      password: input.password,
    };

    users.set(user.id, user);
    return { user: this.toUser(user) };
  }

  login(input: AuthLoginDTO): AuthSessionDTO {
    const user = [...users.values()].find((candidate) => candidate.email === input.email);
    if (!user || user.password !== input.password) {
      throw new HttpError('Invalid credentials', 401);
    }

    return { user: this.toUser(user) };
  }

  me(userId: string): AuthSessionDTO | null {
    const user = users.get(userId);
    return user ? { user: this.toUser(user) } : null;
  }
}

export const authService = new AuthService();
