import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    console.log('[Middleware] Path:', request.nextUrl.pathname);
    
    // Skip authentication for API routes (they have their own API key protection)
    if (request.nextUrl.pathname.startsWith('/api/')) {
        console.log('[Middleware] Skipping API route');
        return NextResponse.next();
    }

    // Check for access token in cookie
    const accessToken = request.cookies.get('access_token')?.value;
    const validToken = process.env.WEB_ACCESS_TOKEN || 'UndiApp2026!';
    
    console.log('[Middleware] Cookie token:', accessToken ? 'EXISTS' : 'NONE');
    console.log('[Middleware] Valid token:', validToken);

    // If valid token exists, allow access
    if (accessToken === validToken) {
        console.log('[Middleware] Token valid - allowing access');
        return NextResponse.next();
    }

    // If accessing login page, allow it
    if (request.nextUrl.pathname === '/login') {
        console.log('[Middleware] Login page - allowing access');
        return NextResponse.next();
    }

    // Redirect to login page
    console.log('[Middleware] No valid token - redirecting to login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};