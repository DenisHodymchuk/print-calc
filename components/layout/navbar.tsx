'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Calculator, Layers, Printer, History, Settings, LogOut, LayoutDashboard, BookOpen, Shield, Crown, MessageSquare } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'
import { usePremium } from '@/lib/use-premium'

const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/calculator', label: 'Калькулятор', icon: Calculator },
  { href: '/calculations', label: 'Розрахунки', icon: History },
  { href: '/library', label: 'Бібліотека', icon: BookOpen },
  { href: '/materials', label: 'Філамент', icon: Layers },
  { href: '/printers', label: 'Принтери', icon: Printer },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isPremium, isAdmin } = usePremium()
  const name = session?.user?.name || session?.user?.email || '?'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Printer className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">
            3D Print <span className="text-primary">UA</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 h-9 px-3 rounded-md text-sm transition-colors cursor-pointer">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary text-white">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:block">{session?.user?.name || session?.user?.email}</span>
            {isPremium && (
              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                <Crown className="w-2.5 h-2.5" />PRO
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => window.location.href = '/admin'} className="gap-2 cursor-pointer">
                  <Shield className="w-4 h-4" /> Адмін панель
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/admin/support'} className="gap-2 cursor-pointer">
                  <MessageSquare className="w-4 h-4" /> Чати підтримки
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => window.location.href = '/support'} className="gap-2 cursor-pointer">
              <MessageSquare className="w-4 h-4" /> Підтримка
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/settings'} className="gap-2 cursor-pointer">
              <Settings className="w-4 h-4" /> Налаштування
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive gap-2"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="w-4 h-4" /> Вийти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
