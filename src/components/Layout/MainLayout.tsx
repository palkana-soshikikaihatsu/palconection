import { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Navigation } from './Navigation'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
      <Navigation />
    </div>
  )
}
