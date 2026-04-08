import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = new URL(req.url).searchParams.get('tenantId')

  return NextResponse.json({
    conversations: [],
    tenantId: tenantId || 'default',
  })
}