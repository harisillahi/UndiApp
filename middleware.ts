import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Always redirect to maintenance page for now - FORCE MAINTENANCE MODE
    console.log(`[MIDDLEWARE] Intercepting: ${request.method} ${request.nextUrl.pathname}`);
    
    // Skip maintenance check ONLY for the maintenance page itself and static files
    if (
        request.nextUrl.pathname === '/maintenance.html' ||
        request.nextUrl.pathname.startsWith('/_next/') ||
        request.nextUrl.pathname.startsWith('/api/') ||
        (request.nextUrl.pathname.includes('.') && !request.nextUrl.pathname.endsWith('/'))
    ) {
        console.log(`[MIDDLEWARE] Allowing: ${request.nextUrl.pathname}`);
        return NextResponse.next();
    }

    // Check for admin bypass
    const bypass = request.nextUrl.searchParams.get('bypass');
    if (bypass === 'admin123') {
        console.log(`[MIDDLEWARE] Admin bypass granted`);
        const response = NextResponse.next();
        response.cookies.set('maintenance_bypass', 'true', { 
            maxAge: 60 * 60, // 1 hour
            httpOnly: true 
        });
        return response;
    }

    // Check if user has valid bypass cookie
    const bypassCookie = request.cookies.get('maintenance_bypass');
    if (bypassCookie?.value === 'true') {
        console.log(`[MIDDLEWARE] Cookie bypass active`);
        return NextResponse.next();
    }

    // Force redirect to maintenance page
    console.log(`[MIDDLEWARE] REDIRECTING TO MAINTENANCE PAGE`);
    return NextResponse.redirect(new URL('/maintenance.html', request.url));
}

export const config = {
    // Match ALL routes except static files and API routes
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};