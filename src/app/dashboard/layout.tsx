'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { LayoutDashboard, BookCopy, Laptop, CalendarDays, TrendingUp, Sparkles, LogOut, Globe, User } from 'lucide-react';

const menuItems = [
  { href: '/l', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/l/courses', label: 'COURSES', icon: BookCopy },
  { href: '/l/e-learning', label: 'E-LEARNING', icon: Laptop },
  { href: '/l/events', label: 'EVENTS', icon: CalendarDays },
  { href: '/l/progress', label: 'PROGRESS', icon: TrendingUp },
  { href: '/l/recommendations', label: 'AI', icon: Sparkles },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent className="pt-8">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/l' && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span className="font-bold uppercase">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="My Profile">
                        <Link href="/l/profile">
                            <User />
                            <span className="font-bold uppercase">My Profile</span>
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Back to Website">
                        <Link href="/">
                            <Globe />
                            <span className="font-bold uppercase">Website</span>
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Logout">
                        <Link href="/login">
                            <LogOut />
                            <span className="font-bold uppercase">Logout</span>
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b bg-background px-4 sm:px-6 md:hidden">
            <SidebarTrigger />
          </header>
          <main className="p-4 sm:p-6 lg:p-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
