import { cookies } from 'next/headers';
import { AppUserRole } from '@/types/database.types';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: AppUserRole;
  isActive: boolean;
}

const SESSION_COOKIE_NAME = 'superior_lab_session';

/**
 * Returns current authenticated user session from SSR cookie
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(sessionCookie.value) as UserSession;
    if (parsed && parsed.id && parsed.email && parsed.isActive) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sets user session cookie
 */
export async function setSession(user: UserSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears user session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Guard: Requires an authenticated user session or redirects
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

/**
 * Guard: Requires administrator role or throws forbidden
 */
export async function requireAdmin(): Promise<UserSession> {
  const session = await requireAuth();
  if (session.role !== 'administrator') {
    throw new Error('FORBIDDEN');
  }
  return session;
}
