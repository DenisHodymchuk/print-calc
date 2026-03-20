import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        })
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name ?? null,
              password: crypto.randomUUID(),
            },
          })
        }
        return true
      }
      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id
      }
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.isPremium = dbUser.isPremium
        }
      }
      // Refresh role/premium from DB on every token refresh
      if (token.id && (!account || trigger === 'update')) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isPremium: true, premiumUntil: true },
        })
        if (dbUser) {
          const premiumActive = dbUser.isPremium && (!dbUser.premiumUntil || dbUser.premiumUntil > new Date())
          token.role = dbUser.role
          token.isPremium = premiumActive
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isPremium = token.isPremium as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
