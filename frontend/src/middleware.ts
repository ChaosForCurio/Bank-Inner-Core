import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // Redirect to dashboard if logged in and trying to access auth pages
    if (token && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect to login if not logged in and trying to access dashboard
    if (!token && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/login', '/register', '/dashboard/:path*'],
}
