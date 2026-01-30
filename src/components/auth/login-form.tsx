'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const roles = [
    { value: 'l', label: 'Learner' },
    { value: 's', label: 'Staff' },
    { value: 'a', label: 'Admin' },
    { value: 'a', label: 'Sales' },
    { value: 'a', label: 'Finance' },
    { value: 'a', label: 'Business' },
    { value: 'a', label: 'Operations' },
];

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<string>('l');
  const router = useRouter();

  const handleLogin = () => {
    if (selectedRole) {
      router.push(`/${selectedRole}`);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Welcome to KSS</CardTitle>
        <CardDescription>Please select your portal to continue.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
            <Label htmlFor="role-select">Sign in as</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select">
                    <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                    {roles.map((role, index) => (
                        <SelectItem key={`${role.label}-${index}`} value={role.value}>{role.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <Button onClick={handleLogin} className="w-full">
            Login
        </Button>
      </CardContent>
    </Card>
  );
}
