/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/auth.middleware'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const user = req.auth?.user as any

  const isAuthRoute = nextUrl.pathname.startsWith('/login') ||
                      nextUrl.pathname.startsWith('/registro') ||
                      nextUrl.pathname.startsWith('/forgot-password') ||
                      nextUrl.pathname.startsWith('/reset-password')

  const isPublicRoute = nextUrl.pathname === '/'
  const isAdminRoute  = nextUrl.pathname.startsWith('/admin')

  if (!isLoggedIn && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (isLoggedIn && isAdminRoute && user?.rol !== 'SUPERADMIN') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}