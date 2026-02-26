'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth, useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, BookCopy, Users, LogOut, Globe, BarChart, Tag, Image as ImageIcon, User, UserCheck, Building, BookUser, Settings, Video, Award, FolderKanban, Folder, MessageSquare, FileText, Bell, Calendar, Briefcase, BookOpen, Monitor, GraduationCap, ChevronsUpDown, ChevronRight } from 'lucide-react';

const menuItems = [
  { href: '/a', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/a/customers', label: 'CUSTOMERS', icon: BarChart },
  { href: '/a/programs', label: 'PROGRAMS & EVENTS', icon: BookCopy },
  { href: '/a/cohorts', label: 'COHORTS', icon: Users },
  { href: '/a/curriculum', label: 'CURRICULUM', icon: BookOpen },
  { href: '/a/admissions', label: 'ADMISSIONS', icon: FolderKanban },
  { href: '/a/learning', label: 'TIMETABLE', icon: Calendar },
  { href: '/a/b2b', label: 'CORPORATE', icon: Building },
  { href: '/a/learners', label: 'LEARNERS', icon: UserCheck },
  { href: '/a/facilitators', label: 'FACILITATORS', icon: BookUser },
  { href: '/a/staff', label: 'STAFF', icon: Briefcase },
  { href: '/a/finance', label: 'FINANCE', icon: Tag },
  { href: '/a/library', label: 'LIBRARY', icon: Folder },
  { href: '/a/assessments', label: 'ASSESSMENTS', icon: FileText },
  { href: '/a/feedback', label: 'FEEDBACK', icon: MessageSquare },
  { href: '/a/certificates', label: 'CERTIFICATES', icon: Award },
  { href: '/a/gallery', label: 'GALLERY', icon: ImageIcon },
  { href: '/a/users', label: 'USERS', icon: Users },
  { href: '/a/settings', label: 'SETTINGS', icon: Settings },
  { href: '/a/notifications', label: 'NOTIFICATIONS', icon: Bell },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, loading } = useUser();
  const firestore = useFirestore();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  // Handle authentication redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'Admin') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

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

  // Return null while redirecting
  if (!user || user.role !== 'Admin') {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">

        <SidebarContent className="pt-4">
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
        <SidebarFooter className="p-2 border-t border-white/10">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-white/10 data-[state=open]:text-white"
                    tooltip="User Settings"
                  >
                    <ChevronRight className="mx-auto size-6 text-white hidden group-data-[state=collapsed]:block" />
                    <Avatar className="h-8 w-8 rounded-lg border border-white/10 group-data-[state=collapsed]:hidden">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                      <AvatarFallback className="rounded-lg bg-white/20 text-white font-bold">
                        {user?.name?.charAt(0) || user?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden ml-2">
                      <span className="truncate font-bold text-white capitalize">{user?.name}</span>
                      <p className="truncate text-[10px] text-white/50 leading-none mt-0.5 uppercase tracking-tighter">{user?.email}</p>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-white/50 group-data-[state=collapsed]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-primary text-white border-white/10 shadow-2xl p-2"
                  side={"right"}
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                      <Avatar className="h-10 w-10 rounded-lg border border-white/10">
                        <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                        <AvatarFallback className="rounded-lg bg-white/20 text-white font-bold">
                          {user?.name?.charAt(0) || user?.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-bold text-white capitalize">{user?.name}</span>
                        <span className="truncate text-xs text-white/50">{user?.email}</span>
                        <div className="mt-1">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-accent text-white">
                            {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10 my-2" />
                  <div className="space-y-1">
                    <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer transition-colors">
                      <Link href="/a/profile" className="flex w-full items-center gap-3 px-2 py-2">
                        <User className="size-4 text-accent" />
                        <span className="font-bold uppercase text-[10px] tracking-widest">My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer transition-colors">
                      <Link href="/" className="flex w-full items-center gap-3 px-2 py-2">
                        <Globe className="size-4 text-accent" />
                        <span className="font-bold uppercase text-[10px] tracking-widest">Website</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10 my-2" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500 rounded-lg cursor-pointer transition-colors px-2 py-2"
                  >
                    <LogOut className="size-4 mr-3" />
                    <span className="font-bold uppercase text-[10px] tracking-widest">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b bg-background px-4 sm:px-6 md:hidden">
          <SidebarTrigger />
        </header>
        <main className="p-0 sm:p-2 lg:p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
