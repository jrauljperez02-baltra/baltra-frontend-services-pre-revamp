'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CandidateDocumentVerificationDialog } from '@/components/candidate-document-verification-dialog';
import {
    Phone,
    Mail,
    Calendar,
    MapPin,
    Star,
    Clock,
    FileText,
    User,
    GraduationCap,
    Download,
    ExternalLink,
    Shield,
} from 'lucide-react';
import { useCompanyID } from '@/context/CompanyContext';
import {
    getCandidatePhoneInterview,
    type PhoneInterviewCandidate,
    type PhoneInterviewData,
} from '@/lib/api';

interface CandidateDetailsModalProps {
    candidate: PhoneInterviewCandidate | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CandidateDetailsModal({
    candidate,
    isOpen,
    onClose,
}: CandidateDetailsModalProps) {
    const companyId = useCompanyID();
    const [detailedCandidate, setDetailedCandidate] =
        useState<PhoneInterviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDocumentVerificationOpen, setDocumentVerificationOpen] =
        useState(false);

    useEffect(() => {
        async function fetchCandidateDetails() {
            if (!candidate || !isOpen || !companyId) return;

            try {
                setLoading(true);
                setError(null);
                const details = await getCandidatePhoneInterview(
                    companyId,
                    candidate.id
                );
                setDetailedCandidate(details);
            } catch (err) {
                console.error('Error fetching candidate details:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error fetching candidate details'
                );
            } finally {
                setLoading(false);
            }
        }

        fetchCandidateDetails();
    }, [candidate, isOpen, companyId]);

    if (!candidate || !isOpen) return null;

    const displayCandidate = detailedCandidate || candidate;

    const getRecommendationVariant = (recommendation: string) => {
        switch (recommendation) {
            case 'Recomendado':
            case 'Muy Recomendado':
                return 'default';
            case 'No Recomendado':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback>
                                {displayCandidate.name
                                    ?.charAt(0)
                                    ?.toUpperCase() || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold">
                                {displayCandidate.name || 'Sin nombre'}
                            </h2>
                            <p className="text-gray-600">
                                {displayCandidate.role}
                            </p>
                        </div>
                        <Badge
                            variant={getRecommendationVariant(
                                displayCandidate.recommendation_display
                            )}
                            className="ml-auto"
                        >
                            {displayCandidate.recommendation_display}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="mt-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general">
                            Información General
                        </TabsTrigger>
                        <TabsTrigger value="interview">Entrevista</TabsTrigger>
                        <TabsTrigger value="documents">Documentos</TabsTrigger>
                        <TabsTrigger value="verification">
                            <Shield className="h-4 w-4 mr-2" />
                            Verificación
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Personal Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <User className="h-5 w-5 mr-2" />
                                        Información Personal
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {displayCandidate.phone}
                                        </span>
                                    </div>
                                    {displayCandidate.age && (
                                        <div className="flex items-center space-x-3">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {displayCandidate.age} años
                                            </span>
                                        </div>
                                    )}
                                    {displayCandidate.gender && (
                                        <div className="flex items-center space-x-3">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {displayCandidate.gender}
                                            </span>
                                        </div>
                                    )}
                                    {displayCandidate.education_level && (
                                        <div className="flex items-center space-x-3">
                                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {
                                                    displayCandidate.education_level
                                                }
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Interview Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <Phone className="h-5 w-5 mr-2" />
                                        Información de Llamada
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {displayCandidate.call_date} a las{' '}
                                            {displayCandidate.call_time}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            Duración:{' '}
                                            {displayCandidate.duration_display}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm">
                                            Estado:{' '}
                                            {
                                                displayCandidate.call_status_display
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Star className="h-4 w-4 text-baltra-500" />
                                        <span className="text-sm font-semibold">
                                            Score IA:{' '}
                                            {displayCandidate.ai_score !== null
                                                ? `${displayCandidate.ai_score}%`
                                                : 'No disponible'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="interview" className="mt-4">
                        <div className="space-y-6">
                            {loading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="ml-2">
                                        Cargando detalles de la entrevista...
                                    </span>
                                </div>
                            )}

                            {error && (
                                <Card>
                                    <CardContent className="p-6">
                                        <p className="text-destructive">
                                            Error: {error}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {!loading && !error && displayCandidate.summary && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center">
                                            <Star className="h-5 w-5 mr-2 text-baltra-600" />
                                            Resumen de IA
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-baltra-50 p-4 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {displayCandidate.summary}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {!loading &&
                                !error &&
                                detailedCandidate?.transcript && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <FileText className="h-5 w-5 mr-2" />
                                                    Transcripción de la
                                                    Entrevista
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Descargar
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                                                    {
                                                        detailedCandidate.transcript
                                                    }
                                                </pre>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            {!loading &&
                                !error &&
                                !detailedCandidate?.transcript && (
                                    <Card>
                                        <CardContent className="p-6 text-center">
                                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">
                                                No hay transcripción disponible
                                                para esta entrevista.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                        </div>
                    </TabsContent>

                    <TabsContent value="documents" className="mt-4">
                        <div className="space-y-4">
                            {displayCandidate.media_urls &&
                            displayCandidate.media_urls.length > 0 ? (
                                displayCandidate.media_urls.map(
                                    (media, index) => (
                                        <Card key={media.media_id || index}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <FileText className="h-8 w-8 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">
                                                                {media.file_name ||
                                                                    'Documento'}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {media.upload_timestamp
                                                                    ? new Date(
                                                                          media.upload_timestamp
                                                                      ).toLocaleDateString()
                                                                    : 'Fecha no disponible'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <a
                                                            href={media.s3_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Ver
                                                        </a>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                )
                            ) : (
                                <Card>
                                    <CardContent className="p-6 text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">
                                            No hay documentos disponibles para
                                            este candidato.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="verification" className="mt-4">
                        <div className="space-y-4">
                            <div className="text-center py-8">
                                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground mb-4">
                                    Ver el estado de verificación de documentos
                                    oficiales del candidato
                                </p>
                                <Button
                                    onClick={() =>
                                        setDocumentVerificationOpen(true)
                                    }
                                    className="bg-baltra-600 hover:bg-baltra-700 text-white"
                                >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Ver Verificación de Documentos
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                    *Si no está disponible, la verificación de
                                    documentos no está habilitada para esta
                                    compañía
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Document Verification Dialog */}
                <CandidateDocumentVerificationDialog
                    candidateId={displayCandidate.id}
                    candidateName={displayCandidate.name || 'Sin nombre'}
                    isOpen={isDocumentVerificationOpen}
                    onClose={() => setDocumentVerificationOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
