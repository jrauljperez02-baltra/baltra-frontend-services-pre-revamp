'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipContentWithPortal,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Copy,
    Edit,
    Pencil,
    Power,
    PowerOff,
    Settings,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { RoleQuestionsDialog } from './role-questions-dialog';

interface Role {
    id: number; // Cambié de string a number para que coincida con RoleData
    name: string;
    questions: number;
    is_active: boolean;
}

interface EnhancedRoleCardProps {
    role: Role;
    onEdit?: (role: Role) => void;
    onDelete?: (role: Role) => void;
    onClone?: (role: Role) => void;
    onToggleActive?: (role: Role, newState: boolean) => void;
}

export function EnhancedRoleCard({
    role,
    onEdit,
    onDelete,
    onClone,
    onToggleActive,
}: EnhancedRoleCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const is_active = role.is_active;
    const handleEdit = () => {
        onEdit?.(role);
    };

    const handleDelete = () => {
        onDelete?.(role);
    };

    const handleClone = () => {
        onClone?.(role);
    };

    const handleToggleActive = () => {
        onToggleActive?.(role, !is_active);
    };

    return (
        <TooltipProvider delayDuration={300} disableHoverableContent>
            <Card
                className={`group hover:shadow-md transition-all duration-200 border-slate-200/60 backdrop-blur-sm ${
                    is_active
                        ? 'bg-white/80 border-slate-200/60'
                        : 'bg-gray-50/60 border-gray-300/60 opacity-75'
                }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <CardContent className="p-3">
                    <div className="space-y-2">
                        {/* Header with title and status */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4
                                        className={`font-semibold transition-colors truncate max-w-[140px] ${
                                            is_active
                                                ? 'text-slate-800 group-hover:text-baltra-600'
                                                : 'text-gray-500 group-hover:text-gray-600'
                                        }`}
                                    >
                                        {role.name}
                                    </h4>
                                    {!is_active && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-gray-100 text-gray-600 border-gray-300 flex-shrink-0"
                                        >
                                            Inactivo
                                        </Badge>
                                    )}
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={`text-xs ${
                                        is_active
                                            ? 'bg-baltra-50 text-baltra-600 border-baltra-200'
                                            : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}
                                >
                                    {role.questions} preguntas
                                </Badge>
                            </div>

                            {/* Toggle Active Button - Always visible */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleToggleActive}
                                        className={`h-7 w-7 p-0 flex-shrink-0 ${
                                            is_active
                                                ? 'hover:bg-orange-50 hover:text-orange-600'
                                                : 'hover:bg-green-50 hover:text-green-600'
                                        }`}
                                    >
                                        {is_active ? (
                                            <PowerOff className="h-3 w-3" />
                                        ) : (
                                            <Power className="h-3 w-3" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContentWithPortal
                                    side="top"
                                    sideOffset={5}
                                >
                                    <p>
                                        {is_active
                                            ? 'Desactivar rol'
                                            : 'Activar rol'}
                                    </p>
                                </TooltipContentWithPortal>
                            </Tooltip>
                        </div>

                        {/* Action buttons - Only visible on hover */}
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {/* Edit Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleEdit}
                                        className={`h-8 w-8 p-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-target ${
                                            is_active
                                                ? 'hover:bg-green-50 hover:text-green-600'
                                                : 'opacity-50'
                                        }`}
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContentWithPortal
                                    side="top"
                                    sideOffset={5}
                                >
                                    <p>Editar rol</p>
                                </TooltipContentWithPortal>
                            </Tooltip>

                            {/* Questions Dialog Button */}
                            <Tooltip>
                                <RoleQuestionsDialog
                                    roleId={role.id}
                                    roleName={role.name}
                                >
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-8 w-8 p-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-target ${
                                                is_active
                                                    ? 'hover:bg-purple-50 hover:text-purple-600'
                                                    : 'opacity-50'
                                            }`}
                                        >
                                            <Settings className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                </RoleQuestionsDialog>
                                <TooltipContentWithPortal
                                    side="top"
                                    sideOffset={5}
                                >
                                    <p>Criterios de preguntas generales</p>
                                </TooltipContentWithPortal>
                            </Tooltip>

                            {/* Clone Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClone}
                                        className={`h-8 w-8 p-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-target ${
                                            is_active
                                                ? 'hover:bg-blue-50 hover:text-blue-600'
                                                : 'opacity-50'
                                        }`}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContentWithPortal
                                    side="top"
                                    sideOffset={5}
                                >
                                    <p>Duplicar rol</p>
                                </TooltipContentWithPortal>
                            </Tooltip>

                            {/* Delete Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDelete}
                                        className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContentWithPortal
                                    side="top"
                                    sideOffset={5}
                                >
                                    <p>Eliminar rol</p>
                                </TooltipContentWithPortal>
                            </Tooltip>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
