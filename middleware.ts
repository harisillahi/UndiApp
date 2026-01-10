import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware - let API routes handle their own authentication
export function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};