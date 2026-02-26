'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth, useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BrandingSettings } from '@/lib/settings-types';
import Image from 'next/image';
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
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, BookOpen, Calendar, CalendarDays, LogOut, Globe, User, Users, Folder, Layers, MessageSquare } from 'lucide-react';
import { NotificationBell } from '@/components/shared/notification-bell';

const menuItems = [
  { href: '/f', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/f/modules', label: 'MY MODULES', icon: BookOpen },
  { href: '/f/curriculum', label: 'CURRICULUM', icon: Layers },
  { href: '/f/classroom', label: 'TIMETABLE', icon: CalendarDays },
  { href: '/f/cohorts', label: 'INTAKES', icon: Users },
  { href: '/f/admissions', label: 'ADMISSIONS', icon: Users },
  { href: '/f/library', label: 'LIBRARY', icon: Folder },
  { href: '/f/feedback', label: 'FEEDBACK', icon: MessageSquare },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, loading } = useUser();
  const firestore = useFirestore();
  const settingsRef = firestore ? doc(firestore, 'settings', 'branding') : null;
  const { data: settings } = useDoc<BrandingSettings>(settingsRef as any);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 border-b border-white/10">
          <div className="flex items-center justify-center">
            <Link href="/f">
              {settings?.logoUrl ? (
                <div className="relative h-8 w-24 group-data-[state=collapsed]:h-6 group-data-[state=collapsed]:w-16 transition-all duration-300">
                  <Image
                    src={settings.logoUrl}
                    alt="Logo"
                    fill
                    sizes="200px"
                    className="object-contain brightness-0 invert"
                  />
                </div>
              ) : (
                <span className="font-bold text-white text-xl group-data-[state=collapsed]:text-base transition-all duration-300">
                  KSS
                </span>
              )}
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent className="pt-4">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/f' && pathname.startsWith(item.href))}
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
        <SidebarFooter className="px-0 border-t border-white/10">
          <div className="mb-1 group-data-[state=collapsed]:hidden">
            <div className="flex items-center space-x-3 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                  {user?.name?.split(' ')[0]?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {user?.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-white/50 truncate flex-1 leading-none uppercase tracking-tighter">
                    {user?.email}
                  </p>
                  <span className="text-[9px] font-black uppercase px-1 rounded bg-accent text-white">
                    Facilitator
                  </span>
                </div>
              </div>
            </div>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Notifications">
                <Link href="/f/notifications">
                  <MessageSquare />
                  <span className="font-bold uppercase">Notifications</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="My Profile">
                <Link href="/f/profile">
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
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout" className="hover:bg-accent hover:text-white transition-colors">
                <LogOut />
                <span className="font-bold uppercase">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 md:hidden">
          <SidebarTrigger />
          <NotificationBell href="/f/notifications" className="text-primary" />
        </header>
        <main className="p-0 sm:p-2 lg:p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
