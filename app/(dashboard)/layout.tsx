import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout/navbar'
import { Toaster } from '@/components/ui/sonner'
import { DonateFooter } from '@/components/layout/donate-footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <DonateFooter />
      </div>
      <Toaster richColors position="top-right" />
    </SessionProvider>
  )
}
