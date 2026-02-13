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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCompanyID } from '@/context/CompanyContext';
import type { RejectReason } from '@/lib/api';
import {
    getRejectionReasonsMap,
    getRejectionReasonLabel,
} from '@/lib/rejection-reasons';
import { useState } from 'react';
interface RejectionReasonDialogProps {
    children: React.ReactNode;
    onReject: (reason: RejectReason, notes?: string) => void;
    disabled?: boolean;
}

export function RejectionReasonDialog({
    children,
    onReject,
    disabled = false,
}: RejectionReasonDialogProps) {
    const companyId = useCompanyID();
    const rejectionReasonsMap = getRejectionReasonsMap(companyId);
    const rejectionReasonKeys = Object.keys(rejectionReasonsMap) as string[];
    const [open, setOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState<RejectReason | ''>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) return;

        setIsSubmitting(true);
        try {
            await onReject(selectedReason, notes.trim() || undefined);
            setOpen(false);
            // Reset form
            setSelectedReason('');
            setNotes('');
        } catch (error) {
            console.error('Error rejecting candidate:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset form when closing
            setSelectedReason('');
            setNotes('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild disabled={disabled}>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rechazar Candidato</DialogTitle>
                    <DialogDescription>
                        Selecciona la razón por la cual estás rechazando a este
                        candidato. Esta información nos ayuda a mejorar nuestro
                        proceso de selección.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Razón de rechazo</Label>
                        <Select
                            value={selectedReason}
                            onValueChange={(value: RejectReason) =>
                                setSelectedReason(value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una razón" />
                            </SelectTrigger>
                            <SelectContent>
                                {rejectionReasonKeys.map((reason) => (
                                    <SelectItem key={reason} value={reason}>
                                        {getRejectionReasonLabel(
                                            reason,
                                            companyId
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* <div className="grid gap-2">
						<Label htmlFor="notes">Notas adicionales (opcional)</Label>
						<Textarea
							id="notes"
							placeholder="Agrega detalles adicionales sobre la razón del rechazo..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
						/>
					</div> */}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!selectedReason || isSubmitting}
                    >
                        {isSubmitting ? 'Rechazando...' : 'Rechazar Candidato'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
