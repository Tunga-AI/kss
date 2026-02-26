'use client';
import { useEffect, useRef, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { ContentItem } from '@/lib/content-library-types';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
    content: ContentItem;
    learnerId: string;
    onClose?: () => void;
    autoPlay?: boolean;
}

export function VideoPlayer({ content, learnerId, onClose, autoPlay = false }: VideoPlayerProps) {
    const firestore = useFirestore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const sessionStartTime = useRef<number>(Date.now());
    const watchTimeRef = useRef<number>(0);
    const lastSaveTime = useRef<number>(Date.now());

    useEffect(() => {
        if (autoPlay && videoRef.current) {
            videoRef.current.play();
        }

        // Auto-save progress every 10 seconds
        const saveInterval = setInterval(() => {
            saveProgress();
        }, 10000);

        // Save on unmount
        return () => {
            clearInterval(saveInterval);
            saveProgress(true);
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            watchTimeRef.current += (Date.now() - lastSaveTime.current) / 1000;
            lastSaveTime.current = Date.now();
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    const saveProgress = async (isClosing = false) => {
        if (!firestore) return;

        const progressId = `${content.id}_${learnerId}`;
        const progress = (currentTime / duration) * 100 || 0;
        const isCompleted = progress >= 90; // Consider 90% as completed

        const progressData = {
            id: progressId,
            contentId: content.id,
            learnerId,
            status: isCompleted ? 'completed' : currentTime > 0 ? 'in-progress' : 'not-started',
            progress: Math.round(progress),
            timeSpent: Math.round(watchTimeRef.current),
            lastPosition: String(currentTime),
            lastAccessedAt: Timestamp.now(),
            ...(isCompleted && !isClosing ? { completedAt: Timestamp.now() } : {}),
            ...(currentTime === 0 ? { startedAt: Timestamp.now() } : {}),
            attempts: 1,
        };

        try {
            await setDoc(doc(firestore, 'contentProgress', progressId), progressData, { merge: true });
        } catch (error) {
            console.error('Failed to save video progress:', error);
        }
    };

    const togglePlayPause = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const time = parseFloat(e.target.value);
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const vol = parseFloat(e.target.value);
        videoRef.current.volume = vol;
        setVolume(vol);
        setIsMuted(vol === 0);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        const newMuted = !isMuted;
        videoRef.current.muted = newMuted;
        setIsMuted(newMuted);
    };

    const skip = (seconds: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime += seconds;
    };

    const toggleFullscreen = () => {
        if (!videoRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            videoRef.current.requestFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between z-10">
                <div>
                    <h2 className="text-xl font-bold text-white">{content.title}</h2>
                    <p className="text-sm text-white/70">{content.description}</p>
                </div>
                {onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            saveProgress(true);
                            onClose();
                        }}
                        className="text-white hover:bg-white/10"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                )}
            </div>

            {/* Video */}
            <div className="flex-1 flex items-center justify-center">
                <video
                    ref={videoRef}
                    src={content.fileUrl}
                    className="max-w-full max-h-full"
                    onClick={togglePlayPause}
                    onMouseEnter={() => setShowControls(true)}
                />
            </div>

            {/* Controls */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity",
                    showControls ? "opacity-100" : "opacity-0"
                )}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                {/* Progress Bar */}
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 mb-4 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #00D4FF ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`,
                    }}
                />

                <div className="flex items-center justify-between">
                    {/* Left controls */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={togglePlayPause}
                            className="text-white hover:bg-white/10"
                        >
                            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => skip(-10)}
                            className="text-white hover:bg-white/10"
                        >
                            <SkipBack className="h-5 w-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => skip(10)}
                            className="text-white hover:bg-white/10"
                        >
                            <SkipForward className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleMute}
                                className="text-white hover:bg-white/10"
                            >
                                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </Button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <span className="text-white text-sm font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        <div className="text-white text-sm bg-accent/80 px-3 py-1 rounded-full">
                            {Math.round((currentTime / duration) * 100) || 0}% Complete
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleFullscreen}
                            className="text-white hover:bg-white/10"
                        >
                            <Maximize className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
