'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CompanyData, RoleData } from '@/lib/api';
import {
    useCompanyData,
    useEditCompany,
    usePostCompanyFAQs,
} from '@/querys/company';
import { useRolesData } from '@/querys/roles';
import { Building, Edit, Plus, Trash2 } from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useImmer } from 'use-immer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCompanyID } from '@/context/CompanyContext';
import { toast } from 'sonner';

const CustomTooltip = ({
    children,
    content,
}: {
    children: React.ReactNode;
    content: string;
}) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent>{content}</TooltipContent>
        </Tooltip>
    );
};

interface CompanyInfoFAQsDialogProps {
    defaultRole?: string;
    deleteDefaultRole?: () => void;
    savedRole?: (data: RoleData) => void;
}

export function CompanyInfoFAQsDialog({
    defaultRole,
    deleteDefaultRole,
    savedRole,
}: CompanyInfoFAQsDialogProps) {
    const companyId = useCompanyID();

    const { data: companyData } = useCompanyData(companyId);

    const { data: rolesData } = useRolesData(companyId);

    const { mutateAsync: editCompany } = useEditCompany(companyId);

    const { mutateAsync: postCompanyFAQs } = usePostCompanyFAQs(companyId);

    const [isOpen, _setIsOpen] = useState(!!defaultRole);

    const setIsOpen = (value: boolean) => {
        _setIsOpen(value);
        if (!value) {
            deleteDefaultRole?.();
        }
    };

    const [selectedRole, setSelectedRole] = useState<string | undefined>(
        defaultRole
    );

    const [companyInfo, setCompanyInfo] = useImmer<CompanyData | undefined>(
        companyData
    );

    const [description, setDescription] = useState(
        companyData?.description || ''
    );

    const [companyFAQs, setCompanyFAQs] = useImmer<
        CompanyData['general_faq'] | undefined
    >(companyData?.general_faq);

    const saveCompanyFAQs = () => {
        if (!companyFAQs) return;
        toast.promise(
            postCompanyFAQs({
                faqs: companyFAQs,
            }),
            {
                loading: 'Guardando preguntas frecuentes...',
                success: () => {
                    return 'Preguntas frecuentes guardadas exitosamente';
                },
                error: (error) => {
                    return `Error al guardar preguntas frecuentes: ${error.message}`;
                },
            }
        );
    };

    const addCompanyFAQ = () => {
        setCompanyFAQs((state) => {
            const existingFAQs = state ?? [];

            existingFAQs.push({
                index: (existingFAQs.length + 1).toString(),
                question: '',
                answer: '',
            });

            return existingFAQs;
        });
    };

    const removeCompanyFAQ = (index: string) => {
        setCompanyFAQs((state) => {
            if (!state) return state;
            const newData = state
                .filter((faq) => faq.index !== index)
                .map((faq, index) => ({
                    ...faq,
                    index: (index + 1).toString(),
                }));

            return newData;
        });
    };

    const updateCompanyFAQ = (
        index: number,
        field: 'question' | 'answer',
        value: string
    ) => {
        setCompanyFAQs((state) => {
            if (!state) return state;
            state[index][field] = value;
        });
    };

    const cancelCompanyFAQs = () => {
        setCompanyFAQs(companyData?.general_faq);
    };

    const updateCompany = (
        id: number,
        field: keyof CompanyData,
        value: unknown
    ) => {
        setCompanyInfo((state) => {
            if (!state) return state;
            if ('benefits' === field) {
                if (!Array.isArray(state.benefits)) {
                    state.benefits = [];
                }

                const {
                    index,
                    value: benefitValue,
                    delete: DeleteValue,
                } = value as {
                    index: number;
                    value: string;
                    delete?: boolean;
                };
                if (DeleteValue) {
                    state.benefits.splice(index, 1);
                    return;
                }

                if (index < state.benefits?.length) {
                    state.benefits[index] = benefitValue;
                } else {
                    state.benefits.push(benefitValue);
                }

                return;
            }

            return {
                ...state,
                [field]: value,
            };
        });
    };

    const saveCompanyEdits = () => {
        if (!companyInfo) return;
        toast.promise(editCompany(companyInfo), {
            loading: 'Guardando cambios...',
            success: () => {
                setEditingCompany(false);
                return 'Cambios guardados exitosamente';
            },
            error: (error) => {
                setEditingCompany(false);
                return `Error al guardar cambios: ${error.message}`;
            },
        });
    };

    const cancelEditing = () => {
        setCompanyInfo(companyData);
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        setCompanyInfo(companyData);
        setCompanyFAQs(companyData?.general_faq);
    }, [companyData]);

    useEffect(() => {
        // Solo establecer el rol inicial si no hay uno seleccionado y hay datos de roles
        if (!selectedRole && rolesData && rolesData.length > 0) {
            setSelectedRole(rolesData[0].id.toString());
        }
        // Si hay un defaultRole, asegurarse de que esté seleccionado
        if (
            defaultRole &&
            rolesData?.some((role) => role.id.toString() === defaultRole)
        ) {
            setSelectedRole(defaultRole);
        }
    }, [rolesData, selectedRole, defaultRole]);

    const [roleFAQs, setRoleFAQs] = useImmer<RoleData | null>(null);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const selectedRoleData = useMemo(() => {
        const role = rolesData?.find(
            (role) => role.id === Number(selectedRole)
        );
        if (selectedRole && role) {
            // Solo actualizar roleFAQs si realmente cambió el rol seleccionado
            if (!roleFAQs || roleFAQs.id !== role.id) {
                setRoleFAQs(role);
            }
            return role;
        }

        return undefined;
    }, [selectedRole, rolesData]);

    const [editingCompany, setEditingCompany] = useState(false);

    // Ref para mantener el scroll del contenedor de FAQs
    const faqScrollRef = useRef<HTMLDivElement>(null);

    const addFAQ = () => {
        if (selectedRole) {
            setRoleFAQs((state) => {
                if (!state) return state;
                state.info.push({
                    index: (state.info.length + 1).toString(),
                    question: '',
                    answer: '',
                });
            });
        }
    };

    const removeFAQ = (index: string) => {
        if (selectedRole) {
            setRoleFAQs((state) => {
                if (!state) return state;
                state.info = state.info.filter((faq) => faq.index !== index);
                state.info = state.info.map((faq, index) => ({
                    ...faq,
                    index: (index + 1).toString(),
                }));
            });
        }
    };

    const updateFAQ = (
        index: number,
        field: 'question' | 'answer',
        value: string
    ) => {
        if (selectedRole) {
            setRoleFAQs((state) => {
                if (!state) return state;
                state.info[index][field] = value;
            });
        }
    };

    const cancelFAQ = () => {
        setRoleFAQs(selectedRoleData ?? null);
    };

    const saveRoleFAQs = () => {
        if (!roleFAQs) return;

        // Mantener la posición del scroll
        const currentScrollPosition = faqScrollRef.current?.scrollTop || 0;

        // Guardar los datos
        savedRole?.(roleFAQs);

        // Restaurar la posición del scroll después de un breve delay para permitir re-render
        setTimeout(() => {
            if (faqScrollRef.current) {
                faqScrollRef.current.scrollTop = currentScrollPosition;
            }
        }, 100);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all duration-200"
                >
                    <Building className="mr-2 h-4 w-4" />
                    Editar información de la empresa y preguntas frecuentes
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Editar información de la empresa y preguntas frecuentes
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Side - Company Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    Información sobre la empresa
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setEditingCompany(!editingCompany)
                                    }
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium">
                                        Nombre de la empresa
                                    </Label>
                                    {editingCompany ? (
                                        <Input
                                            defaultValue={companyInfo?.name}
                                            onChange={(e) =>
                                                updateCompany(
                                                    companyId,
                                                    'name',
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1"
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {companyInfo?.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">
                                        Descripción
                                    </Label>
                                    {editingCompany ? (
                                        <>
                                            <Textarea
                                                value={companyInfo?.description}
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    if (value.length <= 250) {
                                                        setDescription(value);
                                                        updateCompany(
                                                            companyId,
                                                            'description',
                                                            value
                                                        );
                                                    } else {
                                                        toast.error(
                                                            'La descripción no puede tener más de 250 caracteres.'
                                                        );
                                                    }
                                                }}
                                                className="mt-1"
                                                rows={3}
                                                maxLength={250}
                                            />
                                            <div className="text-xs text-muted-foreground text-right">
                                                {description?.length || 0}/250
                                                caracteres
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {companyInfo?.description}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">
                                        Sitio Web
                                    </Label>
                                    {editingCompany ? (
                                        <Input
                                            value={companyInfo?.website}
                                            onChange={(e) =>
                                                updateCompany(
                                                    companyId,
                                                    'website',
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1"
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {companyInfo?.website}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">
                                        Beneficios
                                    </Label>
                                    {editingCompany ? (
                                        <div className="mt-1 space-y-2">
                                            {companyInfo?.benefits?.map(
                                                (benefit, index) => (
                                                    <div
                                                        key={`benefit-${index + 1}`}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Input
                                                            key={`benefit-${index + 1}`}
                                                            value={benefit}
                                                            onChange={(e) =>
                                                                updateCompany(
                                                                    companyId,
                                                                    'benefits',
                                                                    {
                                                                        value: e
                                                                            .target
                                                                            .value,
                                                                        index: index,
                                                                    }
                                                                )
                                                            }
                                                            className="text-sm"
                                                            placeholder="Ingrese un beneficio..."
                                                        />
                                                        <Button
                                                            size={'icon'}
                                                            onClick={() =>
                                                                updateCompany(
                                                                    companyId,
                                                                    'benefits',
                                                                    {
                                                                        value: '',
                                                                        index: index,
                                                                        delete: true,
                                                                    }
                                                                )
                                                            }
                                                            variant="ghost"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                            <Button
                                                onClick={() => {
                                                    updateCompany(
                                                        companyId,
                                                        'benefits',
                                                        {
                                                            value: '',
                                                            index:
                                                                companyInfo
                                                                    ?.benefits
                                                                    ?.length ??
                                                                0,
                                                        }
                                                    );
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Agregar Beneficio
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="mt-1 space-y-1">
                                            {companyInfo?.benefits?.map(
                                                (benefit, index) => (
                                                    <div
                                                        key={`benefit-${benefit}`}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {benefit}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <CustomTooltip content="Cancelar los cambios realizados">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            cancelEditing();
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </CustomTooltip>
                                <CustomTooltip content="Guardar los cambios realizados">
                                    <Button
                                        onClick={() => {
                                            saveCompanyEdits();
                                        }}
                                    >
                                        Guardar Cambios
                                    </Button>
                                </CustomTooltip>
                            </div>
                        </CardContent>
                    </Card>
                    <Tabs defaultValue={selectedRole ? 'role' : 'general'}>
                        <Card>
                            <CardHeader className="flex items-center justify-between flex-row">
                                <CardTitle className="text-lg">
                                    Preguntas Frecuentes
                                </CardTitle>
                                <TabsList>
                                    <TabsTrigger value="general">
                                        Generales
                                    </TabsTrigger>
                                    <TabsTrigger value="role">
                                        Por rol
                                    </TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <CardContent>
                                <TabsContent value="general">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div />
                                            <Button
                                                onClick={addCompanyFAQ}
                                                size="sm"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Agregar Pregunta Frecuente
                                            </Button>
                                        </div>

                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {companyFAQs?.map((faq, index) => (
                                                <div
                                                    key={`faq-${index}-role-${selectedRole}`}
                                                    className="border rounded-lg p-4 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <Label>
                                                            PREGUNTAS FRECUENTE{' '}
                                                            {faq.index}
                                                        </Label>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeCompanyFAQ(
                                                                    faq.index
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-xs">
                                                            Pregunta
                                                        </Label>
                                                        <Input
                                                            value={faq.question}
                                                            onChange={(e) =>
                                                                updateCompanyFAQ(
                                                                    Number(
                                                                        index
                                                                    ),
                                                                    'question',
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Ingrese la pregunta..."
                                                            className="min-h-[44px] text-base"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-xs">
                                                            Respuesta
                                                        </Label>
                                                        <Textarea
                                                            value={faq.answer}
                                                            onChange={(e) =>
                                                                updateCompanyFAQ(
                                                                    Number(
                                                                        index
                                                                    ),
                                                                    'answer',
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Ingrese la respuesta..."
                                                            rows={3}
                                                            className="min-h-[44px] text-base resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-4">
                                        <CustomTooltip content="Cancelar los cambios realizados">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    cancelCompanyFAQs();
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        </CustomTooltip>
                                        <CustomTooltip content="Guardar los cambios realizados">
                                            <Button
                                                onClick={() => {
                                                    saveCompanyFAQs();
                                                }}
                                            >
                                                Guardar Cambios
                                            </Button>
                                        </CustomTooltip>
                                    </div>
                                </TabsContent>
                                <TabsContent value="role" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role-select">
                                            Seleccionar Rol
                                        </Label>
                                        <Select
                                            value={selectedRole}
                                            onValueChange={setSelectedRole}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Elige un rol para editar las preguntas frecuentes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {rolesData?.map((role) => (
                                                    <SelectItem
                                                        key={role.id}
                                                        value={role.id.toString()}
                                                    >
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedRole && selectedRoleData && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium">
                                                    Preguntas Frecuentes para{' '}
                                                    {selectedRoleData.name}
                                                </h3>
                                                <Button
                                                    onClick={addFAQ}
                                                    size="sm"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Agregar Pregunta Frecuente
                                                </Button>
                                            </div>

                                            <div
                                                ref={faqScrollRef}
                                                className="space-y-4 max-h-96 overflow-y-auto"
                                            >
                                                {roleFAQs?.info.map(
                                                    (faq, index) => (
                                                        <div
                                                            key={`faq-${faq.index}-role-${selectedRole}`}
                                                            className="border rounded-lg p-4 space-y-3"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <Label>
                                                                    PREGUNTAS
                                                                    FRECUENTE{' '}
                                                                    {faq.index}
                                                                </Label>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        removeFAQ(
                                                                            faq.index
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-xs">
                                                                    Pregunta
                                                                </Label>
                                                                <Input
                                                                    value={
                                                                        faq.question
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateFAQ(
                                                                            index,
                                                                            'question',
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Ingrese la pregunta..."
                                                                    className="min-h-[44px] text-base"
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-xs">
                                                                    Respuesta
                                                                </Label>
                                                                <Textarea
                                                                    value={
                                                                        faq.answer
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateFAQ(
                                                                            index,
                                                                            'answer',
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Ingrese la respuesta..."
                                                                    rows={3}
                                                                    className="min-h-[44px] text-base resize-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-end space-x-2 pt-4">
                                        <CustomTooltip content="Cancelar los cambios realizados">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    cancelFAQ();
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        </CustomTooltip>
                                        <CustomTooltip content="Guardar los cambios realizados">
                                            <Button
                                                onClick={() => {
                                                    saveRoleFAQs();
                                                }}
                                            >
                                                Guardar Cambios
                                            </Button>
                                        </CustomTooltip>
                                    </div>
                                </TabsContent>
                            </CardContent>
                        </Card>
                    </Tabs>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <CustomTooltip content="Cerrar el diálogo los cambios no guardados se perderán">
                        <Button
                            onClick={() => {
                                setIsOpen(false);
                            }}
                        >
                            Cerrar
                        </Button>
                    </CustomTooltip>
                    {/* <Button>Save Changes</Button> */}
                </div>
            </DialogContent>
        </Dialog>
    );
}
