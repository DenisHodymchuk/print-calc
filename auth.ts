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
          // Check if promo trial is active
          const promo = await prisma.appSettings.findUnique({ where: { key: 'promoTrialDays' } })
          const premiumData = promo ? {
            isPremium: true,
            premiumUntil: new Date(Date.now() + parseInt(promo.value) * 86400000),
          } : {}
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name ?? null,
              password: crypto.randomUUID(),
              ...premiumData,
            },
          })
        }
        return true
      }
      return true
    },
    async jwt({ token, user, account }) {
      // On initial sign-in, resolve DB user
      if (account) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dbUser: any = null
        if (account.provider === 'google' && token.email) {
          dbUser = await prisma.user.findUnique({ where: { email: token.email } })
        } else if (user?.id) {
          dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        }
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role ?? 'USER'
          const premiumUntil = dbUser.premiumUntil as Date | null
          token.isPremium = (dbUser.isPremium ?? false) && (!premiumUntil || premiumUntil > new Date())
          token.premiumUntil = premiumUntil?.toISOString() || null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isPremium = token.isPremium as boolean
        session.user.premiumUntil = token.premiumUntil as string | null
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
