import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    salt: process.env.AUTH_URL
      ? `${new URL(process.env.AUTH_URL).hostname}:authjs.session-token`
      : 'authjs.session-token',
  })

  const { pathname } = req.nextUrl

  const isAuthRoute = pathname.startsWith('/login') ||
                      pathname.startsWith('/registro') ||
                      pathname.startsWith('/forgot-password')

  const isPublicRoute = pathname === '/'

  if (!token && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}