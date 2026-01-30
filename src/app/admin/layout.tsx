'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
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
import { LayoutDashboard, BookCopy, Users, LogOut, Globe, BarChart, Tag, Image as ImageIcon, User, UserCheck, Building } from 'lucide-react';

const menuItems = [
  { href: '/a', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/a/programs', label: 'PROGRAMS', icon: BookCopy },
  { href: '/a/crm', label: 'CRM', icon: BarChart },
  { href: '/a/admissions', label: 'ADMISSIONS', icon: UserCheck },
  { href: '/a/learners', label: 'LEARNERS', icon: Users },
  { href: '/a/finance', label: 'FINANCE', icon: Tag },
  { href: '/a/b2b', label: 'B2B', icon: Building },
  { href: '/a/gallery', label: 'GALLERY', icon: ImageIcon },
  { href: '/a/users', label: 'USERS', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

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
                    isActive={pathname === item.href || (item.href !== '/a' && pathname.startsWith(item.href))}
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
                        <Link href="/a/profile">
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
                    <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                        <LogOut />
                        <span className="font-bold uppercase">Logout</span>
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
