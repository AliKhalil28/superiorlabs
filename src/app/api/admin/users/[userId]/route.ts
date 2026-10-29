import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== 'administrator') {
    return NextResponse.json({ error: 'Forbidden: Administrator privileges required' }, { status: 403 });
  }

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase admin client unavailable' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { password, fullName, role, isActive } = body;

    // Direct password reset / override (without previous password)
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const { error: pwdErr } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
      });

      if (pwdErr) {
        return NextResponse.json({ error: pwdErr.message }, { status: 400 });
      }
    }

    // Profile metadata / role / status update
    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        return NextResponse.json({ error: 'Full name cannot be empty' }, { status: 400 });
      }
      profileUpdates.full_name = fullName.trim();
    }

    if (role !== undefined) {
      if (!['administrator', 'viewer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      profileUpdates.role = role;
    }

    if (isActive !== undefined) {
      profileUpdates.is_active = Boolean(isActive);
    }

    // Apply profile table update
    if (Object.keys(profileUpdates).length > 1) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Also update Auth metadata to keep them in sync
      const metaUpdates: Record<string, any> = {};
      if (fullName !== undefined) metaUpdates.full_name = fullName.trim();
      if (role !== undefined) metaUpdates.role = role;

      if (Object.keys(metaUpdates).length > 0) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: metaUpdates,
        });
      }
    }

    // Fetch and return the updated profile
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json({ success: true, user: updatedProfile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== 'administrator') {
    return NextResponse.json({ error: 'Forbidden: Administrator privileges required' }, { status: 403 });
  }

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Prevent self-deletion
  if (session.id === userId) {
    return NextResponse.json({ error: 'Cannot delete your own active administrator account' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase admin client unavailable' }, { status: 500 });
  }

  try {
    // 1. Delete from Supabase Auth
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    // 2. Delete from public.profiles
    await supabase.from('profiles').delete().eq('id', userId);

    return NextResponse.json({ success: true, deletedId: userId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
