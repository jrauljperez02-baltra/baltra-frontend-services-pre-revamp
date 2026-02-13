'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCompanyID } from '@/context/CompanyContext';
import type { RoleData } from '@/lib/api';
import { useAddRoleMutation } from '@/querys/roles';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { fetchUserAttributesSafe, type UserAttributes } from "@/lib/user-attributes";

export function AddRoleDialog({
    role,
    onSave,
    onClose,
}: {
    role?: RoleData;
    onSave?: (role: RoleData) => void;
    onClose?: () => void;
}) {
    const [roleName, setRoleName] = useState(role?.name || '');
    const [attrs, setAttrs] = useState<UserAttributes | null>(null);
    const [open, setOpen] = useState(!!role);

    const companyId = useCompanyID();

    const { mutateAsync: addRole } = useAddRoleMutation(companyId);
    const handleSubmit = () => {
        if (roleName.trim() && roleName.trim().length <= 24) {
            toast.promise(addRole(roleName.trim()), {
                loading: 'Creando rol...',
                success: () => {
                    setRoleName('');
                    setOpen(false);
                    return 'Rol creado exitosamente.';
                },
                error: (error) => {
                    console.error('Error creating role:', error);
                    return 'Error al crear el rol. Por favor, inténtalo de nuevo.';
                },
                position: 'top-center',
            });
        } else if (roleName.trim().length > 24) {
            toast.error(
                'El nombre del rol no puede tener más de 24 caracteres.'
            );
        }
    };

      useEffect(() => {
        fetchUserAttributesSafe().then(setAttrs);
      }, []);

      if (!attrs) return null; // o un loader

      const showButton =
        attrs.isGroupOne === true ? attrs.isAdmin === true :
        attrs.isGroupOne === false ? true :
        false;

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                if (!value) {
                    onClose?.();
                }
            }}
        >
            {((attrs.isGroupOne === true && attrs.isAdmin === true) || attrs.isGroupOne === false) && (
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-baltra-200 text-baltra-700 hover:bg-baltra-50 hover:border-baltra-300 transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar nuevo rol
                    </Button>
                  </DialogTrigger>
                )}
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Agregar nuevo rol</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role-name">Nombre del rol</Label>
                        <Input
                            id="role-name"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="p.e. Ayudante General"
                            maxLength={24}
                        />
                        <div className="text-xs text-muted-foreground text-right">
                            {roleName.length}/24 caracteres
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline">Cancelar</Button>
                        <Button
                            className='bg-baltra-600 hover:bg-baltra-700 text-white'
                            onClick={
                                !role
                                    ? handleSubmit
                                    : () => {
                                          onSave?.({
                                              ...role,
                                              name: roleName.trim(),
                                          });
                                      }
                            }
                            disabled={
                                !roleName.trim() || roleName.trim().length > 24
                            }
                        >
                            {role ? 'Guardar' : 'Crear'} rol
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
