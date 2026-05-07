import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 })
}
