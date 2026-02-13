'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ExternalLink,
    Mic,
    Pause,
    Play,
    Save,
    Square,
    Video,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface InterviewActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    interviewData: {
        candidate: string;
        role: string;
        time: string;
        type: string;
        location: string;
    };
}

export function InterviewActionModal({
    isOpen,
    onClose,
    interviewData,
}: InterviewActionModalProps) {
    const [activeView, setActiveView] = useState<'menu' | 'recording'>('menu');
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Recording functions
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
            setActiveView('recording');

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

            mediaRecorder.ondataavailable = (event) => {
                // Handle recording data
                console.log('Recording data available', event.data.size);
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
        stopRecording();
        // Handle saving logic here
        console.log('Saving recording for', interviewData.candidate);
        onClose();
    };

    const openZoomCall = () => {
        // Open a mock Zoom link in a new tab
        window.open('https://zoom.us/j/123456789', '_blank');
        onClose();
    };

    const handleClose = () => {
        if (isRecording) {
            stopRecording();
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Entrevista con {interviewData.candidate}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                {activeView === 'menu' ? (
                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-slate-500">
                                Detalles de la Entrevista
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-md space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">
                                        Rol:
                                    </span>
                                    <span className="text-sm font-medium">
                                        {interviewData.role}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">
                                        Hora:
                                    </span>
                                    <span className="text-sm font-medium">
                                        {interviewData.time}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">
                                        Tipo:
                                    </span>
                                    <span className="text-sm font-medium capitalize">
                                        {interviewData.type}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">
                                        Ubicación:
                                    </span>
                                    <span className="text-sm font-medium">
                                        {interviewData.location}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Button
                                onClick={startRecording}
                                className="flex items-center justify-center gap-2 h-16 bg-red-600 hover:bg-red-700"
                            >
                                <Mic className="h-5 w-5" />
                                <span>Iniciar Grabación de Entrevista</span>
                            </Button>

                            <Button
                                onClick={openZoomCall}
                                variant="outline"
                                className="flex items-center justify-center gap-2 h-16 border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                                <Video className="h-5 w-5" />
                                <span>Ir a la Llamada</span>
                                <ExternalLink className="h-4 w-4 ml-1" />
                            </Button>
                        </div>

                        <p className="text-xs text-slate-500 text-center">
                            La grabación usará el micrófono de tu dispositivo.
                            Asegúrate de que los permisos estén habilitados.
                        </p>
                    </div>
                ) : (
                    <div className="py-6 space-y-6">
                        {/* Recording View */}
                        <div className="text-center space-y-2">
                            {isRecording && (
                                <Badge
                                    variant="destructive"
                                    className="animate-pulse"
                                >
                                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                                    {isPaused ? 'PAUSADO' : 'GRABANDO'}
                                </Badge>
                            )}

                            <div className="text-4xl font-mono font-bold text-slate-800">
                                {formatTime(recordingTime)}
                            </div>

                            <p className="text-sm text-slate-600">
                                {isPaused
                                    ? 'Grabación pausada'
                                    : `Grabando entrevista con ${interviewData.candidate}`}
                            </p>
                        </div>

                        {/* Recording Controls */}
                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={pauseRecording}
                                variant="outline"
                                size="lg"
                                className="rounded-full h-14 w-14 p-0"
                                disabled={!isRecording}
                            >
                                {isPaused ? (
                                    <Play className="h-6 w-6" />
                                ) : (
                                    <Pause className="h-6 w-6" />
                                )}
                            </Button>

                            <Button
                                onClick={stopRecording}
                                variant="destructive"
                                size="lg"
                                className="rounded-full h-14 w-14 p-0"
                                disabled={!isRecording}
                            >
                                <Square className="h-6 w-6" />
                            </Button>

                            <Button
                                onClick={saveRecording}
                                variant="default"
                                size="lg"
                                className="rounded-full h-14 w-14 p-0"
                                disabled={isRecording}
                            >
                                <Save className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="flex justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => setActiveView('menu')}
                                disabled={isRecording}
                            >
                                Volver a opciones
                            </Button>
                            <Button
                                variant="default"
                                onClick={saveRecording}
                                disabled={isRecording}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Grabación
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
