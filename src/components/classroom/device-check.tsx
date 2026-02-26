'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Video, Wifi, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceCheckProps {
    onContinue: () => void;
    onCancel: () => void;
}

type DeviceStatus = 'checking' | 'success' | 'error' | 'warning';

interface CheckResult {
    status: DeviceStatus;
    message: string;
}

export function DeviceCheck({ onContinue, onCancel }: DeviceCheckProps) {
    const [micStatus, setMicStatus] = useState<CheckResult>({ status: 'checking', message: 'Checking microphone...' });
    const [cameraStatus, setCameraStatus] = useState<CheckResult>({ status: 'checking', message: 'Checking camera...' });
    const [connectionStatus, setConnectionStatus] = useState<CheckResult>({ status: 'checking', message: 'Checking connection...' });
    const [isCheckComplete, setIsCheckComplete] = useState(false);

    useEffect(() => {
        checkDevices();
    }, []);

    const checkDevices = async () => {
        // Check microphone
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicStatus({ status: 'success', message: 'Microphone is working' });
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            setMicStatus({ status: 'error', message: 'Microphone access denied or not available' });
        }

        // Check camera
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStatus({ status: 'success', message: 'Camera is working' });
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            setCameraStatus({ status: 'warning', message: 'Camera access denied or not available (optional)' });
        }

        // Check connection (simple check)
        try {
            const start = Date.now();
            await fetch('/api/health', { method: 'HEAD' });
            const latency = Date.now() - start;

            if (latency < 100) {
                setConnectionStatus({ status: 'success', message: `Excellent connection (${latency}ms)` });
            } else if (latency < 300) {
                setConnectionStatus({ status: 'success', message: `Good connection (${latency}ms)` });
            } else {
                setConnectionStatus({ status: 'warning', message: `Slow connection (${latency}ms)` });
            }
        } catch (error) {
            setConnectionStatus({ status: 'error', message: 'Connection check failed' });
        }

        setIsCheckComplete(true);
    };

    const getStatusIcon = (status: DeviceStatus) => {
        switch (status) {
            case 'checking':
                return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-destructive" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        }
    };

    const canProceed = micStatus.status !== 'error' && connectionStatus.status !== 'error';

    return (
        <Card className="p-8 max-w-2xl mx-auto">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Device Check</h2>
                    <p className="text-primary/60">We're checking your devices to ensure the best experience</p>
                </div>

                <div className="space-y-4">
                    {/* Microphone Check */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <Mic className="h-6 w-6 text-accent mt-1" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-primary">Microphone</p>
                                {getStatusIcon(micStatus.status)}
                            </div>
                            <p className="text-sm text-primary/60">{micStatus.message}</p>
                        </div>
                    </div>

                    {/* Camera Check */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <Video className="h-6 w-6 text-accent mt-1" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-primary">Camera</p>
                                {getStatusIcon(cameraStatus.status)}
                            </div>
                            <p className="text-sm text-primary/60">{cameraStatus.message}</p>
                        </div>
                    </div>

                    {/* Connection Check */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <Wifi className="h-6 w-6 text-accent mt-1" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-primary">Internet Connection</p>
                                {getStatusIcon(connectionStatus.status)}
                            </div>
                            <p className="text-sm text-primary/60">{connectionStatus.message}</p>
                        </div>
                    </div>
                </div>

                {isCheckComplete && (
                    <div className="flex justify-between gap-4 pt-4 border-t border-primary/10">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="rounded-tl-lg rounded-br-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onContinue}
                            disabled={!canProceed}
                            className="rounded-tl-lg rounded-br-lg bg-primary hover:bg-accent"
                        >
                            {canProceed ? 'Join Session' : 'Cannot Join - Fix Issues'}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
