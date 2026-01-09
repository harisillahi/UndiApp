import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const validPassword = process.env.WEB_ACCESS_TOKEN || 'UndiApp2026!';

    if (password === validPassword) {
      const response = NextResponse.json({ success: true });
      
      // Set cookie that expires in 7 days
      response.cookies.set('access_token', validPassword, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
