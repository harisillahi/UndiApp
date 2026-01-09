import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Skip authentication for API routes (they have their own API key protection)
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Check for access token in cookie
    const accessToken = request.cookies.get('access_token')?.value;
    const validToken = process.env.WEB_ACCESS_TOKEN || 'UndiApp2026!';

    // If valid token exists, allow access
    if (accessToken === validToken) {
        return NextResponse.next();
    }

    // If accessing login page, allow it
    if (request.nextUrl.pathname === '/login') {
        return NextResponse.next();
    }

    // Redirect to login page
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|login).*)',
    ],
};