'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Edit, AlertTriangle } from 'lucide-react';

interface Role {
    id: string;
    name: string;
    traits: string[];
    mustHaveTraits: string[];
}

const initialRoles: Role[] = [
    {
        id: 'operator',
        name: 'Operator',
        traits: [
            'Punctuality',
            'Attention to Detail',
            'Team Player',
            'Adaptability',
            'Safety Conscious',
        ],
        mustHaveTraits: [
            'High School Diploma',
            '2+ Years Manufacturing Experience',
            'Safety Certification',
        ],
    },
    {
        id: 'warehouse',
        name: 'Warehouse Staff',
        traits: [
            'Physical Stamina',
            'Organization',
            'Efficiency',
            'Problem Solving',
            'Reliability',
        ],
        mustHaveTraits: [
            'Forklift License',
            'Warehouse Management System Experience',
            'Physical Fitness',
        ],
    },
    {
        id: 'production',
        name: 'Production Line',
        traits: [
            'Focus',
            'Quality Oriented',
            'Process Adherence',
            'Speed',
            'Consistency',
        ],
        mustHaveTraits: [
            'Technical Training',
            'Quality Control Experience',
            'Machine Operation Skills',
        ],
    },
];

export function KeyTraitsDialog() {
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [newTrait, setNewTrait] = useState('');
    const [newMustHaveTrait, setNewMustHaveTrait] = useState('');

    const selectedRoleData = roles.find((role) => role.id === selectedRole);

    const addTrait = () => {
        if (newTrait.trim() && selectedRole) {
            setRoles(
                roles.map((role) =>
                    role.id === selectedRole
                        ? { ...role, traits: [...role.traits, newTrait.trim()] }
                        : role
                )
            );
            setNewTrait('');
        }
    };

    const addMustHaveTrait = () => {
        if (newMustHaveTrait.trim() && selectedRole) {
            setRoles(
                roles.map((role) =>
                    role.id === selectedRole
                        ? {
                              ...role,
                              mustHaveTraits: [
                                  ...role.mustHaveTraits,
                                  newMustHaveTrait.trim(),
                              ],
                          }
                        : role
                )
            );
            setNewMustHaveTrait('');
        }
    };

    const removeTrait = (traitToRemove: string) => {
        if (selectedRole) {
            setRoles(
                roles.map((role) =>
                    role.id === selectedRole
                        ? {
                              ...role,
                              traits: role.traits.filter(
                                  (trait) => trait !== traitToRemove
                              ),
                          }
                        : role
                )
            );
        }
    };

    const removeMustHaveTrait = (traitToRemove: string) => {
        if (selectedRole) {
            setRoles(
                roles.map((role) =>
                    role.id === selectedRole
                        ? {
                              ...role,
                              mustHaveTraits: role.mustHaveTraits.filter(
                                  (trait) => trait !== traitToRemove
                              ),
                          }
                        : role
                )
            );
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Características Clave
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Editar Características Clave para Alto Rendimiento
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="role-select">Seleccionar Rol</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={setSelectedRole}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Elige un rol para editar características" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRole && selectedRoleData && (
                        <div className="space-y-6">
                            {/* Must Have Traits Section */}
                            <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <Label className="text-red-800 font-semibold">
                                        Características Obligatorias
                                        (Eliminatorias)
                                    </Label>
                                </div>
                                <p className="text-sm text-red-700">
                                    Requisitos esenciales incluyendo habilidades
                                    técnicas, nivel educativo, experiencia
                                    crítica, etc.
                                </p>

                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-red-200 rounded-md bg-white">
                                        {selectedRoleData.mustHaveTraits.map(
                                            (trait, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="destructive"
                                                    className="flex items-center gap-1"
                                                >
                                                    {trait}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0 hover:bg-red-700 hover:text-white"
                                                        onClick={() =>
                                                            removeMustHaveTrait(
                                                                trait
                                                            )
                                                        }
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            )
                                        )}
                                        {selectedRoleData.mustHaveTraits
                                            .length === 0 && (
                                            <span className="text-muted-foreground text-sm">
                                                Aún no se han definido
                                                características obligatorias
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-must-have-trait">
                                        Agregar Nueva Característica Obligatoria
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="new-must-have-trait"
                                            value={newMustHaveTrait}
                                            onChange={(e) =>
                                                setNewMustHaveTrait(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="ej., Licenciatura, 5+ años de experiencia..."
                                            onKeyPress={(e) =>
                                                e.key === 'Enter' &&
                                                addMustHaveTrait()
                                            }
                                        />
                                        <Button
                                            onClick={addMustHaveTrait}
                                            disabled={!newMustHaveTrait.trim()}
                                            variant="destructive"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Preferred Traits Section */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>
                                        Características Preferidas para{' '}
                                        {selectedRoleData.name}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Cualidades deseables que ayudan a
                                        identificar alto rendimiento pero no son
                                        obligatorias.
                                    </p>
                                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md">
                                        {selectedRoleData.traits.map(
                                            (trait, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                    className="flex items-center gap-1"
                                                >
                                                    {trait}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                                        onClick={() =>
                                                            removeTrait(trait)
                                                        }
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            )
                                        )}
                                        {selectedRoleData.traits.length ===
                                            0 && (
                                            <span className="text-muted-foreground text-sm">
                                                Aún no se han definido
                                                características preferidas
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-trait">
                                        Agregar Nueva Característica Preferida
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="new-trait"
                                            value={newTrait}
                                            onChange={(e) =>
                                                setNewTrait(e.target.value)
                                            }
                                            placeholder="Ingresa una característica preferida..."
                                            onKeyPress={(e) =>
                                                e.key === 'Enter' && addTrait()
                                            }
                                        />
                                        <Button
                                            onClick={addTrait}
                                            disabled={!newTrait.trim()}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-md">
                                <p className="font-medium text-blue-800 mb-1">
                                    Cómo esto ayuda:
                                </p>
                                <ul className="text-blue-700 space-y-1">
                                    <li>
                                        •{' '}
                                        <strong>
                                            Características Obligatorias:
                                        </strong>{' '}
                                        Filtrar automáticamente candidatos no
                                        calificados
                                    </li>
                                    <li>
                                        •{' '}
                                        <strong>
                                            Características Preferidas:
                                        </strong>{' '}
                                        Ayudan a la IA a evaluar y clasificar
                                        candidatos calificados
                                    </li>
                                    <li>
                                        •{' '}
                                        <strong>Enfoque de Entrevista:</strong>{' '}
                                        Guían a los entrevistadores sobre qué
                                        evaluar
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline">Cancelar</Button>
                        <Button>Guardar Cambios</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
