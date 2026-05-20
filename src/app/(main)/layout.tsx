import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import TrialBanner from '@/components/trial-banner'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 ml-60 flex flex-col">
          <Header />
          <TrialBanner />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}