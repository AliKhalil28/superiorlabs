import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { updateSubjectTeacher } from '@/lib/data/college-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'administrator') {
    return NextResponse.json(
      { error: 'Forbidden: Only administrators can assign or update subject teachers' },
      { status: 403 }
    );
  }

  try {
    const { subjectId } = await params;
    const body = await req.json();
    const teacherName = typeof body.teacherName === 'string' ? body.teacherName.trim() : '';

    const success = await updateSubjectTeacher(subjectId, teacherName);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update teacher name in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      teacherName: teacherName || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

