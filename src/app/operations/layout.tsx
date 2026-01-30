
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DeprecatedPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="m-4 text-center">
        <CardHeader>
          <CardTitle>Portal Merged</CardTitle>
          <CardDescription>
            This portal has been merged into the main Admin Dashboard for a unified experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin">Go to Admin Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
