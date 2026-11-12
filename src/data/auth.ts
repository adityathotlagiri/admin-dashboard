import type { AdminUser } from '../types'
import { delay } from './delay'

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ token: string; user: AdminUser }> {
  await delay(600)

  if (email.trim().toLowerCase() === 'admin@edulearn.com' && password === 'Admin@123') {
    return {
      token: 'mock-jwt-token',
      user: { id: 'u-1', name: 'Super Admin', email: 'admin@edulearn.com', role: 'admin' },
    }
  }

  throw new Error('Invalid email or password')
}