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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Image as ImageIcon,
    ExternalLink,
    Download,
    Eye,
    Shield,
    IdCard,
    CreditCard,
    Building2,
} from 'lucide-react';
import { useCompanyID } from '@/context/CompanyContext';
import {
    getCandidateDocumentVerification,
    type DocumentVerificationData,
    type DocumentVerification,
} from '@/lib/api';

import {
    uploadCandidateMedia,
    verifyDocumentRFC,
    notifyIneExternal,
    notifyCurpExternal,
} from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CandidateDocumentVerificationDialogProps {
    candidateId: number | null;
    candidateName: string;
    isOpen: boolean;
    onClose: () => void;
    allowUpload?: boolean;
}

export function CandidateDocumentVerificationDialog({
    candidateId,
    candidateName,
    isOpen,
    onClose,
    allowUpload = true,
}: CandidateDocumentVerificationDialogProps) {
    const companyId = useCompanyID();
    const [verificationData, setVerificationData] =
        useState<DocumentVerificationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Upload/verify local states
    const [rfcValue, setRfcValue] = useState('');
    const [curpValue, setCurpValue] = useState('');
    const [ineFront, setIneFront] = useState<File | null>(null);
    const [ineBack, setIneBack] = useState<File | null>(null);
    // Additional docs
    const [curpFrontFile, setCurpFrontFile] = useState<File | null>(null);
    const [curpBackFile, setCurpBackFile] = useState<File | null>(null);
    const [fiscalFile, setFiscalFile] = useState<File | null>(null);
    const [domicilioFile, setDomicilioFile] = useState<File | null>(null);
    const [extra1File, setExtra1File] = useState<File | null>(null);
    const [extra2File, setExtra2File] = useState<File | null>(null);
    const [actionLoading, setActionLoading] = useState<
        | null
        | 'RFC'
        | 'CURP'
        | 'INE'
        | 'CURP_FRONT'
        | 'CURP_BACK'
        | 'CONSTANCIA_FISCAL'
        | 'DOMICILIO'
        | 'EXTRA_1'
        | 'EXTRA_2'
    >(null);

    async function fetchVerificationData() {
        if (!candidateId || !companyId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await getCandidateDocumentVerification(
                companyId,
                candidateId
            );
            setVerificationData(data);
        } catch (err) {
            console.error('Error fetching document verification:', err);
            if (
                err instanceof Error &&
                (err.message.includes('404') ||
                    err.message.includes('not available') ||
                    err.message.includes('Failed to fetch') ||
                    err.message.includes('Document verification not available'))
            ) {
                setError('not_available');
            } else if (
                err instanceof TypeError &&
                err.message.includes('Failed to fetch')
            ) {
                setError('not_available');
            } else {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error fetching document verification'
                );
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!candidateId || !isOpen || !companyId) return;
        fetchVerificationData();
    }, [candidateId, isOpen, companyId]);

    if (!candidateId || !isOpen) return null;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'verified':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const getDocumentIcon = (docType: string) => {
        switch (docType) {
            case 'RFC':
                return <Building2 className="h-5 w-5 text-blue-600" />;
            case 'INE':
                return <IdCard className="h-5 w-5 text-green-600" />;
            case 'CURP':
                return <CreditCard className="h-5 w-5 text-purple-600" />;
            case 'NSS':
                return <Shield className="h-5 w-5 text-orange-600" />;
            default:
                return <FileText className="h-5 w-5 text-gray-600" />;
        }
    };

    // Handlers
    async function handleVerifyRFC() {
        if (!rfcValue || rfcValue.length !== 13) {
            toast.error('El RFC debe tener 13 caracteres.');
            return;
        }
        try {
            setActionLoading('RFC');
            await verifyDocumentRFC(
                candidateId!,
                rfcValue.trim().toUpperCase()
            );
            toast.success('RFC enviado a verificación');
            setRfcValue('');
            await fetchVerificationData();
        } catch (e: any) {
            toast.error(e?.message || 'Error al verificar RFC');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleVerifyCURP() {
        if (!curpValue || curpValue.length !== 18) {
            toast.error('La CURP debe tener 18 caracteres.');
            return;
        }
        try {
            setActionLoading('CURP');
            const curpNorm = curpValue.trim().toUpperCase();
            // Enviar únicamente al servicio externo
            await notifyCurpExternal(candidateId!, curpNorm);
            toast.success(
                'CURP enviada a verificación (NSS se iniciará en segundo plano)'
            );
            setCurpValue('');
            await fetchVerificationData();
        } catch (e: any) {
            toast.error(e?.message || 'Error al verificar CURP');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleUploadAndVerifyINE() {
        if (!ineFront || !ineBack) {
            toast.error('Selecciona archivo de frente y reverso del INE.');
            return;
        }
        if (!companyId) return;

        try {
            setActionLoading('INE');
            const uploadRes = await uploadCandidateMedia(
                companyId,
                candidateId!,
                [ineFront, ineBack],
                'image',
                { flow_type: 'admin_upload' },
                'INE'
            );

            if (!uploadRes.success) {
                throw new Error('Error al subir archivos del INE');
            }

            if (uploadRes.data.failed_count > 0) {
                toast.warning(
                    `Algunos archivos fallaron al subir: ${uploadRes.data.errors.map((e) => e.message).join(', ')}`
                );
            }

            const mediaIds = uploadRes.data.media_ids;
            if (!mediaIds || mediaIds.length < 2) {
                throw new Error(
                    'Se requieren dos archivos (frente y reverso) para validar INE.'
                );
            }

            // 1) Notificar al servicio externo para verificación de INE
            let ineNotifyRes: any = null;
            try {
                ineNotifyRes = await notifyIneExternal(
                    candidateId!,
                    mediaIds[0],
                    mediaIds[1]
                );
            } catch (postErr: any) {
                console.error(
                    'Error al notificar INE a endpoint externo:',
                    postErr
                );
                // No bloquear el flujo principal por este error
            }

            // 2) Intentar disparar validación de CURP (externa) después del INE si viene en la respuesta
            try {
                const maybeCurp =
                    ineNotifyRes?.data?.curp ||
                    ineNotifyRes?.curp ||
                    ineNotifyRes?.verification_result?.curpData?.curp ||
                    ineNotifyRes?.data?.verification_result?.curpData?.curp ||
                    ineNotifyRes?.data?.verification_resul?.curpData?.curp ||
                    ineNotifyRes?.data?.curpData?.curp;
                if (maybeCurp) {
                    const curpNorm = String(maybeCurp).trim().toUpperCase();
                    await notifyCurpExternal(candidateId!, curpNorm);
                }
            } catch (curpErr: any) {
                console.error(
                    'Error al enviar verificación de CURP tras INE:',
                    curpErr
                );
                // No bloquear el flujo principal por este error
            }

            // 4) Continuar con el flujo actual (mostrar éxito y refrescar datos)
            toast.success('INE enviado a verificación');
            setIneFront(null);
            setIneBack(null);
            await fetchVerificationData();
        } catch (e: any) {
            toast.error(e?.message || 'Error en el flujo de INE');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleUploadAdditional(
        logicalType:
            | 'CURP_FRONT'
            | 'CURP_BACK'
            | 'CONSTANCIA_FISCAL'
            | 'DOMICILIO'
            | 'EXTRA_1'
            | 'EXTRA_2',
        file: File | null,
        mediaType: 'image' | 'document' = 'image'
    ) {
        if (!file) {
            toast.error('Selecciona un archivo.');
            return;
        }
        if (!companyId) return;
        try {
            setActionLoading(logicalType);
            const res = await uploadCandidateMedia(
                companyId,
                candidateId!,
                [file],
                mediaType,
                { flow_type: 'admin_upload' },
                logicalType
            );
            if (!res.success) throw new Error('Error al subir archivo');
            if (res.data.failed_count > 0) {
                toast.warning(
                    `Algunos archivos fallaron: ${res.data.errors.map((e) => e.message).join(', ')}`
                );
            }
            toast.success('Archivo subido');
            // limpiar estados
            if (logicalType === 'CURP_FRONT') setCurpFrontFile(null);
            if (logicalType === 'CURP_BACK') setCurpBackFile(null);
            if (logicalType === 'CONSTANCIA_FISCAL') setFiscalFile(null);
            if (logicalType === 'DOMICILIO') setDomicilioFile(null);
            if (logicalType === 'EXTRA_1') setExtra1File(null);
            if (logicalType === 'EXTRA_2') setExtra2File(null);
            await fetchVerificationData();
        } catch (e: any) {
            toast.error(e?.message || 'Error al subir documento');
        } finally {
            setActionLoading(null);
        }
    }

    const MissingRFCUI = allowUpload ? (
        <div className="mt-3 space-y-2">
            <Label htmlFor="rfc">RFC (13 caracteres)</Label>
            <div className="flex gap-2">
                <Input
                    id="rfc"
                    value={rfcValue}
                    onChange={(e) => setRfcValue(e.target.value)}
                    placeholder="ABCD001122H12"
                />
                <Button onClick={handleVerifyRFC} disabled={!!actionLoading}>
                    {actionLoading === 'RFC' ? 'Validando...' : 'Validar RFC'}
                </Button>
            </div>
        </div>
    ) : null;

    const MissingCURPUI = allowUpload ? (
        <div className="mt-3 space-y-2">
            <Label htmlFor="curp">CURP (18 caracteres)</Label>
            <div className="flex gap-2">
                <Input
                    id="curp"
                    value={curpValue}
                    onChange={(e) => setCurpValue(e.target.value)}
                    placeholder="ABCD000101HDFRLS09"
                />
                <Button onClick={handleVerifyCURP} disabled={!!actionLoading}>
                    {actionLoading === 'CURP' ? 'Validando...' : 'Validar CURP'}
                </Button>
            </div>
        </div>
    ) : null;

    const MissingINEUI = allowUpload ? (
        <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <Label htmlFor="ine-front">INE Frente (imagen)</Label>
                    <Input
                        id="ine-front"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            setIneFront(e.target.files?.[0] || null)
                        }
                    />
                </div>
                <div>
                    <Label htmlFor="ine-back">INE Reverso (imagen)</Label>
                    <Input
                        id="ine-back"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            setIneBack(e.target.files?.[0] || null)
                        }
                    />
                </div>
            </div>
            <Button
                onClick={handleUploadAndVerifyINE}
                disabled={!!actionLoading}
            >
                {actionLoading === 'INE'
                    ? 'Subiendo y validando...'
                    : 'Subir y validar INE'}
            </Button>
        </div>
    ) : null;

    const renderDocumentCard = (
        docType: string,
        document: DocumentVerification | DocumentVerification[] | null
    ) => {
        // Caso faltante para INE: arreglo vacío
        if (
            docType === 'INE' &&
            Array.isArray(document) &&
            document.length === 0
        ) {
            return (
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {getDocumentIcon(docType)}
                                <div>
                                    <h4 className="font-medium">
                                        INE - Identificación Oficial
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        No disponible
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-gray-500">
                                Sin enviar
                            </Badge>
                        </div>
                        {MissingINEUI}
                    </CardContent>
                </Card>
            );
        }

        if (!document) {
            return (
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {getDocumentIcon(docType)}
                                <div>
                                    <h4 className="font-medium">{docType}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        No disponible
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-gray-500">
                                Sin enviar
                            </Badge>
                        </div>
                        {docType === 'RFC' && MissingRFCUI}
                        {docType === 'CURP' && MissingCURPUI}
                        {docType === 'INE' && MissingINEUI}
                    </CardContent>
                </Card>
            );
        }

        // Handle INE documents (array of 2 images)
        if (Array.isArray(document)) {
            return (
                <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            {getDocumentIcon(docType)}
                            <span>{docType} - Identificación Oficial</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {document.map((doc, index) => (
                            <div
                                key={doc.media_id}
                                className="border rounded-lg p-3"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <ImageIcon className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">
                                            {index === 0 ? 'Frente' : 'Reverso'}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(doc.status)}
                                        <Badge
                                            variant={getStatusVariant(
                                                doc.status
                                            )}
                                        >
                                            {doc.status_message}
                                        </Badge>
                                    </div>
                                </div>

                                {doc.s3_url && (
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={doc.s3_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver
                                            </a>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={doc.s3_url}
                                                download={
                                                    doc.file_name ||
                                                    `INE_${index + 1}`
                                                }
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Descargar
                                            </a>
                                        </Button>
                                    </div>
                                )}

                                {doc.upload_timestamp && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Subido:{' '}
                                        {new Date(
                                            doc.upload_timestamp
                                        ).toLocaleString()}
                                    </p>
                                )}

                                {doc.status === 'rejected' && doc.warnings && (
                                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-800">
                                            {doc.warnings}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Permitir re-subir si está rechazado o incompleto */}
                        {allowUpload &&
                            (document.length < 2 ||
                                document.some(
                                    (d) => d.status === 'rejected'
                                )) && (
                                <div className="pt-2 border-t">
                                    <p className="text-sm font-medium mb-2">
                                        Actualizar INE
                                    </p>
                                    {MissingINEUI}
                                </div>
                            )}
                    </CardContent>
                </Card>
            );
        }

        // Handle single documents (RFC, CURP, NSS)
        const doc = document as DocumentVerification;
        return (
            <Card className="border-gray-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            {getDocumentIcon(docType)}
                            <div>
                                <h4 className="font-medium">{docType}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {docType === 'RFC'
                                        ? 'Registro Federal de Contribuyentes'
                                        : docType === 'CURP'
                                          ? 'Clave Única de Registro de Población'
                                          : docType === 'NSS'
                                            ? 'Número de Seguridad Social'
                                            : docType}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.status)}
                            <Badge variant={getStatusVariant(doc.status)}>
                                {doc.status_message}
                            </Badge>
                        </div>
                    </div>

                    {doc.string_submission && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-sm font-mono">
                                {doc.string_submission}
                            </p>
                        </div>
                    )}

                    {doc.s3_url && (
                        <div className="flex space-x-2 mb-3">
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={doc.s3_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Ver documento
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={doc.s3_url}
                                    download={doc.file_name || docType}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar
                                </a>
                            </Button>
                        </div>
                    )}

                    {doc.upload_timestamp && (
                        <p className="text-xs text-muted-foreground">
                            Subido:{' '}
                            {new Date(doc.upload_timestamp).toLocaleString()}
                        </p>
                    )}
                    {console.log('doc.warnings:', doc.warnings)}
                    {doc.status === 'rejected' && doc.warnings && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                {doc.warnings}
                            </p>
                        </div>
                    )}
                    {doc.status === 'pending' && docType === 'NSS' && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                La verificación NSS está en proceso. Los
                                resultados pueden tardar hasta 24 horas.
                            </p>
                        </div>
                    )}
                    {/* Permitir reenvío si está rechazado */}
                    {allowUpload &&
                        docType === 'RFC' &&
                        doc.status === 'rejected' &&
                        MissingRFCUI}
                    {allowUpload &&
                        docType === 'CURP' &&
                        doc.status === 'rejected' &&
                        MissingCURPUI}
                </CardContent>
            </Card>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Shield className="h-6 w-6 text-blue-600" />
                        <span>
                            Verificación de Documentos - {candidateName}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2">
                                Cargando verificación de documentos...
                            </span>
                        </div>
                    )}

                    {error && (
                        <Card>
                            <CardContent className="p-6">
                                {error === 'not_available' ? (
                                    <div className="text-center">
                                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">
                                            Verificación de documentos no
                                            habilitada
                                        </h3>
                                        <p className="text-muted-foreground">
                                            La verificación de documentos no
                                            está habilitada en esta compañía.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2 text-destructive">
                                        <XCircle className="h-5 w-5" />
                                        <p>Error: {error}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {!loading && !error && !verificationData && (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    La verificación de documentos no está
                                    disponible para este candidato.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {!loading && !error && verificationData && (
                        <>
                            {/* Overall Status Card */}
                            <Card className="border-2 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>
                                            Estado General de Verificación
                                        </span>
                                        <Badge
                                            variant={getStatusVariant(
                                                verificationData.overall_status
                                                    .status
                                            )}
                                            className="text-base px-3 py-1"
                                        >
                                            {
                                                verificationData.overall_status
                                                    .message
                                            }
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-4 gap-4 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-green-600">
                                                {
                                                    verificationData
                                                        .overall_status
                                                        .verified_count
                                                }
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Verificados
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-yellow-600">
                                                {
                                                    verificationData
                                                        .overall_status
                                                        .pending_count
                                                }
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Pendientes
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-red-600">
                                                {
                                                    verificationData
                                                        .overall_status
                                                        .rejected_count
                                                }
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Rechazados
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {
                                                    verificationData
                                                        .overall_status
                                                        .total_required
                                                }
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Total Requeridos
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Document Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Documentos Individuales
                                </h3>

                                {renderDocumentCard(
                                    'RFC',
                                    verificationData.documents.RFC
                                )}
                                {renderDocumentCard(
                                    'INE',
                                    verificationData.documents.INE
                                )}
                                {renderDocumentCard(
                                    'CURP',
                                    verificationData.documents.CURP
                                )}
                                {renderDocumentCard(
                                    'NSS',
                                    verificationData.documents.NSS
                                )}

                                {/* Documentos adicionales */}
                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle>
                                            Documentos adicionales
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>
                                                    CURP Frente (imagen)
                                                </Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) =>
                                                            setCurpFrontFile(
                                                                e.target
                                                                    .files?.[0] ||
                                                                    null
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        disabled={
                                                            !curpFrontFile ||
                                                            !!actionLoading
                                                        }
                                                        onClick={() =>
                                                            handleUploadAdditional(
                                                                'CURP_FRONT',
                                                                curpFrontFile,
                                                                'image'
                                                            )
                                                        }
                                                    >
                                                        {actionLoading ===
                                                        'CURP_FRONT'
                                                            ? 'Subiendo...'
                                                            : 'Subir'}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>
                                                    CURP Reverso (imagen)
                                                </Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) =>
                                                            setCurpBackFile(
                                                                e.target
                                                                    .files?.[0] ||
                                                                    null
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        disabled={
                                                            !curpBackFile ||
                                                            !!actionLoading
                                                        }
                                                        onClick={() =>
                                                            handleUploadAdditional(
                                                                'CURP_BACK',
                                                                curpBackFile,
                                                                'image'
                                                            )
                                                        }
                                                    >
                                                        {actionLoading ===
                                                        'CURP_BACK'
                                                            ? 'Subiendo...'
                                                            : 'Subir'}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>
                                                    Constancia de Situación
                                                    Fiscal (PDF)
                                                </Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        type="file"
                                                        accept="application/pdf"
                                                        onChange={(e) =>
                                                            setFiscalFile(
                                                                e.target
                                                                    .files?.[0] ||
                                                                    null
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        disabled={
                                                            !fiscalFile ||
                                                            !!actionLoading
                                                        }
                                                        onClick={() =>
                                                            handleUploadAdditional(
                                                                'CONSTANCIA_FISCAL',
                                                                fiscalFile,
                                                                'document'
                                                            )
                                                        }
                                                    >
                                                        {actionLoading ===
                                                        'CONSTANCIA_FISCAL'
                                                            ? 'Subiendo...'
                                                            : 'Subir'}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>
                                                    Comprobante de Domicilio
                                                    (imagen o PDF)
                                                </Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        onChange={(e) =>
                                                            setDomicilioFile(
                                                                e.target
                                                                    .files?.[0] ||
                                                                    null
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        disabled={
                                                            !domicilioFile ||
                                                            !!actionLoading
                                                        }
                                                        onClick={() =>
                                                            handleUploadAdditional(
                                                                'DOMICILIO',
                                                                domicilioFile,
                                                                domicilioFile?.type?.includes(
                                                                    'pdf'
                                                                )
                                                                    ? 'document'
                                                                    : 'image'
                                                            )
                                                        }
                                                    >
                                                        {actionLoading ===
                                                        'DOMICILIO'
                                                            ? 'Subiendo...'
                                                            : 'Subir'}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Otro documento 1</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        type="file"
                                                        onChange={(e) =>
                                                            setExtra1File(
                                                                e.target
                                                                    .files?.[0] ||
                                                                    null
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        disabled={
                                                            !extra1File ||
                                                            !!actionLoading
                                                        }
                                                        onClick={() =>
                                                            handleUploadAdditional(
                                                                'EXTRA_1',
                                                                extra1File,
                                                                extra1File?.type?.includes(
                                                                    'pdf'
                                                                )
                                                                    ? 'document'
                                                                    : 'image'
                                                            )
                                                        }
                                                    >
                                                        {actionLoading ===
                                                        'EXTRA_1'
                                                            ? 'Subiendo...'
                                                            : 'Subir'}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Otro documento 2</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        type="file"
                                                        onChange={(e) =>
                                                            setExtra2File(
                                                                e.target
                                                                    .files?.[0] ||
                                                                    null
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        disabled={
                                                            !extra2File ||
                                                            !!actionLoading
                                                        }
                                                        onClick={() =>
                                                            handleUploadAdditional(
                                                                'EXTRA_2',
                                                                extra2File,
                                                                extra2File?.type?.includes(
                                                                    'pdf'
                                                                )
                                                                    ? 'document'
                                                                    : 'image'
                                                            )
                                                        }
                                                    >
                                                        {actionLoading ===
                                                        'EXTRA_2'
                                                            ? 'Subiendo...'
                                                            : 'Subir'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Estos documentos se adjuntan al
                                            expediente del candidato. La
                                            verificación automática aplica solo
                                            a RFC/INE/CURP.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
