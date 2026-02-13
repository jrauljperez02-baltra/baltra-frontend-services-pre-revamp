'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';
import { useState } from 'react';

interface QRAttendanceDialogProps {
    qrUrl: string | null | undefined;
    companyName?: string;
    children?: React.ReactNode;
}

export function QRAttendanceDialog({
    qrUrl,
    companyName,
    children,
}: QRAttendanceDialogProps) {
    const [open, setOpen] = useState(false);

    const handleDownload = async () => {
        if (!qrUrl) return;

        try {
            // Fetch the image as a blob to handle CORS issues
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `qr-asistencia-${companyName || 'empresa'}.png`;
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading QR code:', error);
            // Fallback: open in new tab if download fails
            window.open(qrUrl, '_blank');
        }
    };

    if (!qrUrl) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="gap-2">
                        <QrCode className="h-4 w-4" />
                        Ver Código QR
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Código QR de Asistencia
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                        <img
                            src={qrUrl}
                            alt="Código QR de Asistencia"
                            className="w-64 h-64 object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cerrar
                    </Button>
                    <Button onClick={handleDownload} className="gap-2 bg-baltra-600 text-white">
                        <Download className="h-4 w-4" />
                        Descargar QR
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

