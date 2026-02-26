'use client';

import { useEffect, useRef, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { ContentItem, SCORMAttempt } from '@/lib/content-library-types';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface SCORMPlayerProps {
    content: ContentItem;
    learnerId: string;
    learnerName: string;
    onClose?: () => void;
}

export function SCORMPlayer({ content, learnerId, learnerName, onClose }: SCORMPlayerProps) {
    const firestore = useFirestore();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [attemptId, setAttemptId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const sessionStartTime = useRef<number>(Date.now());
    const scormDataRef = useRef<SCORMAttempt['cmi']>({
        core: {
            student_id: learnerId,
            student_name: learnerName,
            lesson_location: '',
            credit: 'credit',
            lesson_status: 'not attempted',
            entry: 'ab-initio',
            score_raw: undefined,
            score_max: undefined,
            score_min: undefined,
            total_time: '0000:00:00.00',
            lesson_mode: 'normal',
            exit: '',
            session_time: '0000:00:00.00',
        },
    });

    useEffect(() => {
        if (!firestore || !content.scormData) {
            setError('SCORM data not available');
            return;
        }

        // Initialize SCORM attempt
        const initAttempt = async () => {
            const newAttemptId = `${content.id}_${learnerId}_${Date.now()}`;
            setAttemptId(newAttemptId);

            const attemptData: SCORMAttempt = {
                id: newAttemptId,
                contentId: content.id,
                learnerId,
                sessionId: newAttemptId,
                cmi: scormDataRef.current,
                startedAt: Timestamp.now(),
                lastAccessedAt: Timestamp.now(),
                timeSpent: 0,
                progress: 0,
                passed: false,
            };

            try {
                await setDoc(doc(firestore, 'scormAttempts', newAttemptId), attemptData);
            } catch (err) {
                console.error('Failed to create SCORM attempt:', err);
                setError('Failed to initialize SCORM session');
            }
        };

        initAttempt();

        // Set up SCORM API for iframe
        setupSCORMAPI();

        // Auto-save interval
        const saveInterval = setInterval(() => {
            saveAttemptData();
        }, 30000); // Save every 30 seconds

        return () => {
            clearInterval(saveInterval);
            saveAttemptData(); // Final save on unmount
        };
    }, [content, learnerId, firestore]);

    const setupSCORMAPI = () => {
        // Expose SCORM API to iframe
        (window as any).API = {
            LMSInitialize: (param: string) => {
                console.log('LMSInitialize', param);
                scormDataRef.current.core.entry = 'resume';
                return 'true';
            },
            LMSFinish: (param: string) => {
                console.log('LMSFinish', param);
                saveAttemptData(true);
                return 'true';
            },
            LMSGetValue: (element: string) => {
                console.log('LMSGetValue', element);
                const value = getValueFromCMI(element);
                console.log('Value:', value);
                return value;
            },
            LMSSetValue: (element: string, value: string) => {
                console.log('LMSSetValue', element, value);
                setValueInCMI(element, value);
                return 'true';
            },
            LMSCommit: (param: string) => {
                console.log('LMSCommit', param);
                saveAttemptData();
                return 'true';
            },
            LMSGetLastError: () => {
                return '0';
            },
            LMSGetErrorString: (errorCode: string) => {
                return 'No error';
            },
            LMSGetDiagnostic: (errorCode: string) => {
                return 'No diagnostic';
            },
        };

        // Also support SCORM 2004 API
        (window as any).API_1484_11 = {
            Initialize: (param: string) => (window as any).API.LMSInitialize(param),
            Terminate: (param: string) => (window as any).API.LMSFinish(param),
            GetValue: (element: string) => (window as any).API.LMSGetValue(element),
            SetValue: (element: string, value: string) => (window as any).API.LMSSetValue(element, value),
            Commit: (param: string) => (window as any).API.LMSCommit(param),
            GetLastError: () => (window as any).API.LMSGetLastError(),
            GetErrorString: (errorCode: string) => (window as any).API.LMSGetErrorString(errorCode),
            GetDiagnostic: (errorCode: string) => (window as any).API.LMSGetDiagnostic(errorCode),
        };
    };

    const getValueFromCMI = (element: string): string => {
        const parts = element.split('.');
        let value: any = scormDataRef.current;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return '';
            }
        }

        return value !== undefined ? String(value) : '';
    };

    const setValueInCMI = (element: string, value: string) => {
        const parts = element.split('.');
        let obj: any = scormDataRef.current;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in obj)) {
                obj[part] = {};
            }
            obj = obj[part];
        }

        const lastPart = parts[parts.length - 1];

        // Handle specific conversions
        if (lastPart === 'score_raw' || lastPart === 'score_max' || lastPart === 'score_min') {
            obj[lastPart] = parseFloat(value);
        } else {
            obj[lastPart] = value;
        }

        // Calculate session time
        if (element === 'cmi.core.session_time') {
            updateTotalTime(value);
        }
    };

    const updateTotalTime = (sessionTime: string) => {
        // Add session time to total time
        const sessionSeconds = convertSCORMTimeToSeconds(sessionTime);
        const totalSeconds = convertSCORMTimeToSeconds(scormDataRef.current.core.total_time) + sessionSeconds;
        scormDataRef.current.core.total_time = convertSecondsToSCORMTime(totalSeconds);
    };

    const convertSCORMTimeToSeconds = (scormTime: string): number => {
        const parts = scormTime.split(':');
        if (parts.length !== 3) return 0;

        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseFloat(parts[2]);

        return hours * 3600 + minutes * 60 + seconds;
    };

    const convertSecondsToSCORMTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(4, '0')}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
    };

    const saveAttemptData = async (isFinishing = false) => {
        if (!firestore || !attemptId) return;

        try {
            const sessionTime = (Date.now() - sessionStartTime.current) / 1000; // seconds
            const status = scormDataRef.current.core.lesson_status;
            const scoreRaw = scormDataRef.current.core.score_raw;

            const updateData: Partial<SCORMAttempt> = {
                cmi: scormDataRef.current,
                lastAccessedAt: Timestamp.now(),
                timeSpent: sessionTime,
                progress: status === 'completed' || status === 'passed' ? 100 : 0,
                passed: status === 'passed',
                score: scoreRaw,
            };

            if (isFinishing) {
                updateData.completedAt = Timestamp.now();
            }

            await updateDoc(doc(firestore, 'scormAttempts', attemptId), updateData);

            // Also update content progress
            await updateContentProgress(sessionTime, status, scoreRaw);
        } catch (err) {
            console.error('Failed to save SCORM data:', err);
        }
    };

    const updateContentProgress = async (
        timeSpent: number,
        status: string,
        score?: number
    ) => {
        if (!firestore) return;

        const progressId = `${content.id}_${learnerId}`;
        const progressData = {
            id: progressId,
            contentId: content.id,
            learnerId,
            status: status === 'passed' ? 'passed' : status === 'completed' ? 'completed' : 'in-progress',
            progress: status === 'completed' || status === 'passed' ? 100 : 0,
            score,
            timeSpent,
            lastAccessedAt: Timestamp.now(),
            scormAttemptIds: [attemptId],
            currentAttemptId: attemptId,
            attempts: 1,
        };

        try {
            await setDoc(doc(firestore, 'contentProgress', progressId), progressData, { merge: true });
        } catch (err) {
            console.error('Failed to update content progress:', err);
        }
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center p-8">
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-primary mb-2">SCORM Error</h2>
                    <p className="text-primary/60 mb-6">{error}</p>
                    {onClose && (
                        <Button onClick={onClose}>Close Player</Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-primary text-white p-4 flex items-center justify-between z-10">
                <div>
                    <h2 className="text-xl font-bold">{content.title}</h2>
                    <p className="text-sm text-white/70">SCORM {content.scormData?.version} Content</p>
                </div>
                {onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            saveAttemptData(true);
                            onClose();
                        }}
                        className="text-white hover:bg-white/10"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                )}
            </div>

            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/90 z-20">
                    <div className="text-center text-white">
                        <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4" />
                        <p className="text-lg font-bold">Loading SCORM content...</p>
                    </div>
                </div>
            )}

            {/* SCORM Content iframe */}
            <iframe
                ref={iframeRef}
                src={content.scormData?.launchUrl}
                className="w-full h-full"
                style={{ paddingTop: '64px' }}
                onLoad={handleIframeLoad}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
        </div>
    );
}
