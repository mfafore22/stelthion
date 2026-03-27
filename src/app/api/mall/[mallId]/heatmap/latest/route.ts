import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params

  // Return null data — heatmap not yet implemented for most malls
  return NextResponse.json(null, {
    headers: { 'Cache-Control': 'public, max-age=30' },
  })
}