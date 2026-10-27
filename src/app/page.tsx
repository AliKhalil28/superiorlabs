import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  let isAuthenticated = false;

  // 1. Check Supabase session server-side
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      isAuthenticated = true;
    }
  } catch {
    // Supabase auth check fallback if unconfigured or network issue
  }

  // 2. Fallback check for application session cookie
  if (!isAuthenticated) {
    try {
      const appSession = await getSession();
      if (appSession?.isActive) {
        isAuthenticated = true;
      }
    } catch {
      // Session fallback
    }
  }

  // 3. Server-side redirect based on session state
  if (isAuthenticated) {
    redirect('/dashboard');
  }

  redirect('/login');
}

