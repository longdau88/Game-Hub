import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/verify-email');
                     
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  if (isAuthPage && token) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isAuthPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdminPage && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.svg).*)'],
};
