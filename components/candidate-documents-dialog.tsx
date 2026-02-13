'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Candidate, CandidateMedia } from '@/lib/api';
import {
    CheckCircle,
    Clock,
    Download,
    ExternalLink,
    Eye,
    File,
    FileImage,
    FileText,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Document {
    id: string;
    name: string;
    type: string;
    status: 'verified' | 'pending' | 'rejected';
    size: string;
    uploadDate: string;
    url: string;
}

interface CandidateDocumentsDialogProps {
    candidate: Candidate;
    children: React.ReactNode;
}

// Componente para previsualización de archivos
const FilePreview = ({ document }: { document: Document }) => {
    const { type, url, name } = document;

    if (type.startsWith('image/')) {
        return (
            <div className="w-full max-h-96 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                    src={url}
                    alt={name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
            </div>
        );
    }

    // PDFs
    if (type === 'application/pdf') {
        return (
            <div className="w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
                <iframe
                    src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-0"
                    title={`Vista previa de ${name}`}
                />
            </div>
        );
    }

    // Texto plano
    if (type.startsWith('text/')) {
        return (
            <div className="w-full max-h-96 bg-gray-50 rounded-lg p-4 overflow-auto">
                <iframe
                    src={url}
                    className="w-full h-80 border-0"
                    title={`Vista previa de ${name}`}
                />
            </div>
        );
    }

    // Videos
    if (type.startsWith('video/')) {
        return (
            <div className="w-full bg-gray-50 rounded-lg overflow-hidden">
                <video controls className="w-full max-h-96" preload="metadata">
                    <source src={url} type={type} />
                    <track
                        kind="captions"
                        src=""
                        label="Sin subtítulos disponibles"
                    />
                    Tu navegador no soporta la reproducción de video.
                </video>
            </div>
        );
    }

    // Audio
    if (type.startsWith('audio/')) {
        return (
            <div className="w-full bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <audio controls className="w-full max-w-md mx-auto">
                    <source src={url} type={type} />
                    <track
                        kind="captions"
                        src=""
                        label="Sin subtítulos disponibles"
                    />
                    Tu navegador no soporta la reproducción de audio.
                </audio>
            </div>
        );
    }

    // Documentos de Office (Word, Excel, PowerPoint)
    if (
        type.includes('officedocument') ||
        type.includes('msword') ||
        type.includes('ms-excel') ||
        type.includes('ms-powerpoint')
    ) {
        return (
            <div className="w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
                <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                    className="w-full h-full border-0"
                    title={`Vista previa de ${name}`}
                />
            </div>
        );
    }

    // Archivos no previsualizables
    return (
        <div className="w-full bg-gray-50 rounded-lg p-8 text-center">
            <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
                No se puede mostrar una vista previa de este tipo de archivo
            </p>
            <p className="text-xs text-gray-500">{getFileTypeLabel(type)}</p>
        </div>
    );
};

// Función para convertir bytes a formato legible
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

// Función para convertir CandidateMedia a Document
const convertMediaToDocument = (media: CandidateMedia): Document => ({
    id: media.media_id.toString(),
    name: media.file_name,
    type: media.mime_type,
    status: 'verified', // Asumimos que los archivos existentes están verificados
    size: formatFileSize(media.file_size),
    uploadDate: media.upload_timestamp || new Date().toISOString(),
    url: media.s3_url,
});

const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
        return <FileText className="h-4 w-4 text-red-500" />;
    }
    if (type.includes('image')) {
        return <FileImage className="h-4 w-4 text-blue-500" />;
    }
    if (type.includes('word') || type.includes('document')) {
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
};

const getFileTypeLabel = (type: string) => {
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('word') || type.includes('document')) return 'Word';
    if (type.includes('image')) return 'Imagen';
    if (type.includes('zip')) return 'ZIP';
    return 'Archivo';
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'verified':
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'rejected':
            return <XCircle className="h-4 w-4 text-red-600" />;
        default:
            return <Clock className="h-4 w-4 text-yellow-600" />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'verified':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'rejected':
            return 'bg-red-100 text-red-800 border-red-200';
        default:
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'verified':
            return 'Verificado';
        case 'rejected':
            return 'Rechazado';
        default:
            return 'Pendiente';
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export function CandidateDocumentsDialog({
    candidate,
    children,
}: CandidateDocumentsDialogProps) {
    const [open, setOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<Document | null>(
        null
    );
    // Convertir los media del candidato a documentos
    const documents = candidate.media_urls?.map(convertMediaToDocument) ?? [];

    const handleDownload = (document: Document) => {
        // Descargar el documento usando la URL real
        console.log('Descargando documento:', document.name);
        window.open(document.url, '_blank');
    };

    const handlePreview = (document: Document) => {
        // Mostrar vista previa en el dialog
        setPreviewDocument(document);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Documentos de {candidate.name}
                    </DialogTitle>
                    <DialogDescription>
                        Archivos y documentos asociados al candidato
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[75vh]">
                    {/* Lista de documentos */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm">
                            Lista de Documentos
                        </h3>
                        <ScrollArea className="max-h-[65vh] pr-4">
                            <div className="space-y-3">
                                {documents.length > 0 ? (
                                    documents.map((document) => (
                                        <Card
                                            key={document.id}
                                            className={`border-l-4 cursor-pointer transition-all ${
                                                previewDocument?.id ===
                                                document.id
                                                    ? 'border-l-blue-600 bg-blue-50'
                                                    : 'border-l-blue-500'
                                            }`}
                                            onClick={() =>
                                                handlePreview(document)
                                            }
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        {getFileIcon(
                                                            document.type
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-sm truncate">
                                                                {document.name}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {getFileTypeLabel(
                                                                        document.type
                                                                    )}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        document.size
                                                                    }
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    •
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDate(
                                                                        document.uploadDate
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {getStatusIcon(
                                                                    document.status
                                                                )}
                                                                <Badge
                                                                    className={`text-xs ${getStatusColor(document.status)}`}
                                                                >
                                                                    {getStatusLabel(
                                                                        document.status
                                                                    )}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 ml-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(
                                                                    document
                                                                );
                                                            }}
                                                            className="h-8 w-8 p-0"
                                                            title="Descargar"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(
                                                                    document.url,
                                                                    '_blank'
                                                                );
                                                            }}
                                                            className="h-8 w-8 p-0"
                                                            title="Abrir en nueva pestaña"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>
                                            No hay documentos disponibles para
                                            este candidato
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Vista previa */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm">
                                Vista Previa
                            </h3>
                            {previewDocument && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewDocument(null)}
                                    className="text-muted-foreground"
                                >
                                    Cerrar vista previa
                                </Button>
                            )}
                        </div>

                        <div className="border rounded-lg">
                            {previewDocument ? (
                                <div className="p-4">
                                    <div className="mb-4">
                                        <h4 className="font-medium text-sm mb-1">
                                            {previewDocument.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            {getFileTypeLabel(
                                                previewDocument.type
                                            )}{' '}
                                            • {previewDocument.size}
                                        </p>
                                    </div>
                                    <Separator className="mb-4" />
                                    <FilePreview document={previewDocument} />
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>
                                        Selecciona un documento para ver su
                                        vista previa
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
