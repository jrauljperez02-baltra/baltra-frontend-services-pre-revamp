'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Play, Pause, Save, X } from 'lucide-react';

interface InterviewRecordingDialogProps {
    candidateName: string;
    children: React.ReactNode;
}

export function InterviewRecordingDialog({
    candidateName,
    children,
}: InterviewRecordingDialogProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [hasRecording, setHasRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setHasRecording(true);
                }
            };
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream
                .getTracks()
                .forEach((track) => track.stop());
            setIsRecording(false);
            setIsPaused(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                timerRef.current = setInterval(() => {
                    setRecordingTime((prev) => prev + 1);
                }, 1000);
            } else {
                mediaRecorderRef.current.pause();
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            }
            setIsPaused(!isPaused);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const saveRecording = () => {
        // Handle saving logic here
        console.log('Saving recording for', candidateName);
        setHasRecording(false);
        setRecordingTime(0);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5" />
                        Record Interview - {candidateName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Recording Status */}
                    <div className="text-center space-y-2">
                        {isRecording && (
                            <Badge
                                variant="destructive"
                                className="animate-pulse"
                            >
                                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                                {isPaused ? 'PAUSED' : 'RECORDING'}
                            </Badge>
                        )}

                        <div className="text-3xl font-mono font-bold text-slate-800">
                            {formatTime(recordingTime)}
                        </div>

                        {!isRecording && !hasRecording && (
                            <p className="text-sm text-slate-600">
                                Click the microphone to start recording the
                                interview
                            </p>
                        )}
                    </div>

                    {/* Recording Controls */}
                    <div className="flex justify-center gap-3">
                        {!isRecording && !hasRecording && (
                            <Button
                                onClick={startRecording}
                                size="lg"
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 p-0"
                            >
                                <Mic className="h-6 w-6" />
                            </Button>
                        )}

                        {isRecording && (
                            <>
                                <Button
                                    onClick={pauseRecording}
                                    size="lg"
                                    variant="outline"
                                    className="rounded-full h-12 w-12 p-0"
                                >
                                    {isPaused ? (
                                        <Play className="h-5 w-5" />
                                    ) : (
                                        <Pause className="h-5 w-5" />
                                    )}
                                </Button>

                                <Button
                                    onClick={stopRecording}
                                    size="lg"
                                    variant="destructive"
                                    className="rounded-full h-12 w-12 p-0"
                                >
                                    <Square className="h-5 w-5" />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Recording Actions */}
                    {hasRecording && !isRecording && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setHasRecording(false)}
                                className="flex-1"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Discard
                            </Button>
                            <Button onClick={saveRecording} className="flex-1">
                                <Save className="mr-2 h-4 w-4" />
                                Save Recording
                            </Button>
                        </div>
                    )}

                    {/* Mobile-friendly note */}
                    <div className="text-xs text-slate-500 text-center bg-slate-50 p-3 rounded-lg">
                        <p>
                            💡 Make sure your device microphone is enabled for
                            recording
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
