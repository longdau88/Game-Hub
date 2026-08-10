import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/verify-email');
  
  // If user is already logged in and tries to access login/register, redirect them based on role
  if (isAuthPage && token) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not logged in and tries to access protected pages (everything except auth pages)
  if (!isAuthPage && !token) {
    // Exclude static assets and api routes if any
    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api') && !pathname.includes('.')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If user tries to access admin but is not admin
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
