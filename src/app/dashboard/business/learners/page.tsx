'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Users, RefreshCw, MoreVertical, Mail, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useUsersFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User as LearnerUser } from '@/lib/user-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addBusinessLearner } from '@/app/actions/b2b-learners';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BusinessLearnersPage() {
  const { user: currentUser, loading: adminLoading } = useUser();
  const firestore = useUsersFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'BusinessAdmin';

  const learnersQuery = useMemo(() => {
    if (!firestore || !currentUser?.organizationId) return null;
    return query(collection(firestore, 'users'), where('organizationId', '==', currentUser.organizationId));
  }, [firestore, currentUser]);

  const { data: allMembers, loading: learnersLoading } = useCollection<LearnerUser>(learnersQuery as any);

  const filteredMembers = useMemo(() => {
    if (!allMembers) return [];
    return allMembers.filter(m =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allMembers, searchQuery]);

  const activeLearners = allMembers?.filter(m => m.status === 'Active' && m.role === 'BusinessLearner') || [];
  const adminCount = allMembers?.filter(m => m.role === 'BusinessAdmin') || [];

  const loading = adminLoading || learnersLoading;

  const handleAddLearner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser?.organizationId) return;

    setAddLoading(true);
    setAddError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('organizationId', currentUser.organizationId);

    const result = await addBusinessLearner(formData);

    if (result.success) {
      toast({
        title: "Learner Added!",
        description: "They have been added to your organization. They'll need to set up their login when they first access KSS."
      });
      setIsAddDialogOpen(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setAddError(result.error || 'An unknown error occurred.');
    }

    setAddLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Add Learner Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl text-primary">Add New Team Member</DialogTitle>
            <DialogDescription className="text-primary/60">
              Enter the learner's details. They'll receive an email to set up their account and access KSS programs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLearner} className="grid gap-4 pt-2">
            <div className="grid gap-1.5">
              <Label htmlFor="addName" className="text-xs font-bold text-primary/60 uppercase tracking-widest">Full Name *</Label>
              <Input
                id="addName"
                name="name"
                placeholder="Jane Mwangi"
                required
                disabled={addLoading}
                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="addEmail" className="text-xs font-bold text-primary/60 uppercase tracking-widest">Email Address *</Label>
              <Input
                id="addEmail"
                name="email"
                type="email"
                placeholder="jane@company.com"
                required
                disabled={addLoading}
                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
              />
            </div>
            {addError && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 leading-relaxed">
              <strong>Note:</strong> The learner will be added to your organization. They can log in at{' '}
              <strong>/login</strong> once their account is activated.
            </div>
            <Button
              type="submit"
              disabled={addLoading}
              className="w-full h-11 bg-accent hover:bg-accent/90 text-white font-bold rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
            >
              {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {addLoading ? 'Adding...' : 'Add Learner'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 lg:p-6">
        {/* Hero */}
        <div className="bg-primary text-white p-6 mb-6 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Team Learners</h1>
                <p className="text-white/70 text-sm mt-1">
                  {allMembers?.length || 0} total members • {activeLearners.length} active learners
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button
                className="bg-secondary hover:bg-secondary/90 text-white font-bold h-11 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none shadow-lg"
                onClick={() => {
                  setAddError(null);
                  setIsAddDialogOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Learner
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Members', value: allMembers?.length || 0, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Active Learners', value: activeLearners.length, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Admin Users', value: adminCount.length, color: 'text-accent', bg: 'bg-accent/10' },
          ].map(stat => (
            <Card key={stat.label} className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm bg-white">
              <CardContent className="pt-4 pb-4 px-4 flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", stat.bg)}>
                  <Users className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
                  <p className="text-xs text-primary/50 font-semibold uppercase tracking-widest">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
          <Input
            placeholder="Search team members by name or email..."
            className="pl-11 h-12 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border border-primary/10 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-primary/5 border-b border-primary/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-primary">Member</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-primary">Role</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-primary">Status</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-primary text-right">
                  {isAdmin ? 'Actions' : ''}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-primary/10">
              {filteredMembers.map(member => (
                <TableRow key={member.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar || undefined} alt={member.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                          {member.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-primary">{member.name}</p>
                        <p className="text-xs text-primary/50">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge className={cn(
                      "text-[9px] font-black uppercase tracking-widest border-none px-2",
                      member.role === 'BusinessAdmin' ? 'bg-accent text-white' : 'bg-primary/10 text-primary'
                    )}>
                      {member.role === 'BusinessAdmin' ? 'Admin' : 'Learner'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        member.status === 'Active' ? 'bg-green-500' : 'bg-red-400'
                      )} />
                      <span className={cn(
                        "text-xs font-bold",
                        member.status === 'Active' ? 'text-green-600' : 'text-red-500'
                      )}>
                        {member.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    {isAdmin && member.id !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-primary/10">
                          <DropdownMenuItem className="flex items-center gap-2 text-primary/70 cursor-pointer">
                            <Mail className="h-4 w-4" />
                            Send Login Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-primary/40">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold uppercase text-xs tracking-widest">
                      {searchQuery ? 'No members match your search' : 'No team members yet'}
                    </p>
                    {isAdmin && !searchQuery && (
                      <Button
                        className="mt-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add First Learner
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
