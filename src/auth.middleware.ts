/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.rol = (user as any).rol
        token.onboarding = (user as any).onboarding
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).rol = token.rol
        ;(session.user as any).onboarding = token.onboarding
      }
      return session
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize() { return null },
    }),
  ],
})