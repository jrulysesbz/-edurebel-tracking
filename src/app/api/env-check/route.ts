import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ hasAdminToken: !!process.env.ADMIN_BEARER_TOKEN });
}
