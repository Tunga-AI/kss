'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Mail, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailLog {
    id: string;
    to: string;
    subject: string;
    status: 'sent' | 'failed';
    sentAt: Timestamp;
    error?: string;
    messageId?: string;
}

export default function EmailLogsPage() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch email logs
    const logsQuery = firestore
        ? query(collection(firestore, 'email_logs'), orderBy('sentAt', 'desc'), limit(100))
        : null;

    const { data: logs, loading } = useCollection<EmailLog>(logsQuery as any);

    // Filter logs based on search
    const filteredLogs = logs?.filter(log =>
        log.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics
    const stats = {
        total: logs?.length || 0,
        sent: logs?.filter(log => log.status === 'sent').length || 0,
        failed: logs?.filter(log => log.status === 'failed').length || 0,
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">Email Logs</h1>
                <p className="text-gray-600 mt-2">Monitor all sent and failed emails</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Emails</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{stats.total}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Successfully Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-600">{stats.sent}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-2xl font-bold text-red-600">{stats.failed}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by email or subject..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Email Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Email History</CardTitle>
                    <CardDescription>Recent email activity (last 100 emails)</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">
                            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                            Loading emails...
                        </div>
                    ) : filteredLogs && filteredLogs.length > 0 ? (
                        <div className="space-y-3">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                                                    {log.status === 'sent' ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Sent
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Failed
                                                        </>
                                                    )}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {log.sentAt && formatDistanceToNow(log.sentAt.toDate(), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="font-medium text-sm truncate">{log.subject}</div>
                                            <div className="text-sm text-gray-600 truncate">To: {log.to}</div>
                                            {log.error && (
                                                <div className="text-xs text-red-600 mt-1 truncate">
                                                    Error: {log.error}
                                                </div>
                                            )}
                                            {log.messageId && (
                                                <div className="text-xs text-gray-400 mt-1 truncate font-mono">
                                                    ID: {log.messageId}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No emails match your search' : 'No emails sent yet'}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
