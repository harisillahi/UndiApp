import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Only protect API routes with API key
export function middleware(request: NextRequest) {
    // Only run for API license routes
    if (request.nextUrl.pathname.startsWith('/api/license/')) {
        const apiKey = request.headers.get('x-api-key');
        if (apiKey !== process.env.ADMIN_API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ['/api/license/:path*'],
};