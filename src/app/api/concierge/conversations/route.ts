import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const tenantId = new URL(req.url).searchParams.get('tenantId')

  return NextResponse.json({
    conversations: [],
    tenantId: tenantId || 'default',
  })
}