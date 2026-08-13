import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/verify-email');
                     
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  
  const isProtectedPage = request.nextUrl.pathname.startsWith('/admin') ||
                          request.nextUrl.pathname.startsWith('/profile') ||
                          request.nextUrl.pathname.startsWith('/creator');

  // Handle Auth redirection
  if (isAuthPage && token) {
    const url = new URL(role === 'admin' ? '/admin' : '/', request.url);
    return NextResponse.redirect(url);
  }

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isAdminPage && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Handle i18n Geo IP detection
  let response = NextResponse.next();
  const currentLocale = request.cookies.get('NEXT_LOCALE')?.value;

  if (!currentLocale) {
    // Attempt to get country from Vercel's geo object or header
    // @ts-ignore
    const country = request.geo?.country || request.headers.get('x-vercel-ip-country');
    
    // Default to 'vi' for Vietnam, 'en' for rest of the world
    const newLocale = country === 'VN' ? 'vi' : 'en';
    
    // We must clone the response to set the cookie since NextResponse.next() is read-only in some older contexts, 
    // but in newer Next.js we can just call cookies.set on the response object.
    response.cookies.set('NEXT_LOCALE', newLocale, { path: '/' });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.svg).*)'],
};
