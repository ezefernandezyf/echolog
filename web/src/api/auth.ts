import { createFetcher, createVoidFetcher, fetchJson } from './client';
import type {
  AuthSessionDTO,
  AuthLoginDTO,
  AuthRegisterDTO,
  UpdateProfileDTO,
  UpdateProfileResult,
  UpdateEmailDTO,
  UpdatePasswordDTO,
} from '../../../shared/contracts/index.js';

export const authApi = {
  me: createVoidFetcher<AuthSessionDTO>('GET', '/auth/me'),
  login: createFetcher<AuthSessionDTO, AuthLoginDTO>('POST', '/auth/login'),
  register: createFetcher<AuthSessionDTO, AuthRegisterDTO>('POST', '/auth/register'),
  logout: createVoidFetcher<void>('POST', '/auth/logout'),
  updateProfile: (data: UpdateProfileDTO) =>
    fetchJson<UpdateProfileResult, UpdateProfileDTO>({
      url: '/auth/profile',
      method: 'PATCH',
      data,
    }),
  updateEmail: (data: UpdateEmailDTO) =>
    fetchJson<{ user: { id: string; email: string; name: string | null } }, UpdateEmailDTO>({
      url: '/auth/email',
      method: 'PUT',
      data,
    }),
  updatePassword: (data: UpdatePasswordDTO) =>
    fetchJson<{ message: string }, UpdatePasswordDTO>({
      url: '/auth/password',
      method: 'PUT',
      data,
    }),
  resendVerification: () =>
    fetchJson<{ message: string }, void>({
      url: '/auth/resend-verification',
      method: 'POST',
    }),
};
