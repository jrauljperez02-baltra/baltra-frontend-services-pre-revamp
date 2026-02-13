// components/hired-candidate-start-date-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HiredCandidateStartDateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (startDate: string) => void;
    candidateName: string;
}

export function HiredCandidateStartDateDialog({
    isOpen,
    onClose,
    onSave,
    candidateName,
}: HiredCandidateStartDateDialogProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const handleSave = () => {
        if (date) {
            onSave(format(date, "yyyy-MM-dd"));
        }
    };
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Reset month when dialog opens
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDate(undefined);
            setCurrentMonth(new Date());
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Fecha de Inicio para {candidateName}</DialogTitle>
                    <DialogDescription>
                        Selecciona la fecha de inicio para el candidato contratado.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">
                            Fecha de Inicio
                        </Label>
                        <div className="col-span-2">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                fromDate={fifteenDaysAgo}
                                locale={es}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button className="bg-baltra-600 hover:bg-baltra-700 text-white" onClick={handleSave} disabled={!date}>
                        Guardar Fecha
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
