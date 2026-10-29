import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

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
    const { password, currentPassword, fullName, role, isActive } = body;

    // 1. Fetch current target profile from database
    const { data: targetProfile, error: targetErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const isTargetAdmin = targetProfile.role === 'administrator';

    // 2. ENFORCE RULE: Admin role is permanent and NOT changeable
    if (isTargetAdmin) {
      if (role !== undefined && role !== 'administrator') {
        return NextResponse.json(
          { error: 'Administrator role is locked and cannot be modified or demoted.' },
          { status: 400 }
        );
      }
      if (isActive !== undefined && isActive === false) {
        return NextResponse.json(
          { error: 'Administrator accounts cannot be disabled.' },
          { status: 400 }
        );
      }
    }

    // 3. ENFORCE RULE: Password change logic
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      // If target is Administrator: PREVIOUS password is REQUIRED
      if (isTargetAdmin) {
        if (!currentPassword || typeof currentPassword !== 'string') {
          return NextResponse.json(
            { error: 'Current (previous) password is required to change administrator credentials.' },
            { status: 400 }
          );
        }

        // Verify current password against Supabase Auth
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
        });

        const { error: verifyErr } = await authClient.auth.signInWithPassword({
          email: targetProfile.email,
          password: currentPassword,
        });

        if (verifyErr) {
          return NextResponse.json(
            { error: 'Incorrect previous password. Please verify your current administrator password.' },
            { status: 400 }
          );
        }
      }
      // For non-admin (viewers): previous password is NOT required; admin directly overrides.

      const { error: pwdErr } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
      });

      if (pwdErr) {
        return NextResponse.json({ error: pwdErr.message }, { status: 400 });
      }
    }

    // 4. Profile metadata updates
    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        return NextResponse.json({ error: 'Full name cannot be empty' }, { status: 400 });
      }
      profileUpdates.full_name = fullName.trim();
    }

    if (role !== undefined && !isTargetAdmin) {
      if (!['administrator', 'viewer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      profileUpdates.role = role;
    }

    if (isActive !== undefined && !isTargetAdmin) {
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

      // Keep Auth metadata in sync
      const metaUpdates: Record<string, any> = {};
      if (fullName !== undefined) metaUpdates.full_name = fullName.trim();
      if (role !== undefined && !isTargetAdmin) metaUpdates.role = role;

      if (Object.keys(metaUpdates).length > 0) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: metaUpdates,
        });
      }
    }

    // Return the updated profile
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
    // Check if target is admin
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (targetProfile?.role === 'administrator') {
      return NextResponse.json({ error: 'Administrator accounts cannot be deleted' }, { status: 400 });
    }

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
