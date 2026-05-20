import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize() {
        return null
      },
    }),
  ],
})