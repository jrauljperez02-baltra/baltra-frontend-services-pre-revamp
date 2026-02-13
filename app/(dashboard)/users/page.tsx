// 'use client';

// import { DashboardTracker } from '@/components/dashboard-tracker';
// import { PageHeader } from '@/components/page-header';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from '@/components/ui/card';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from '@/components/ui/dialog';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from '@/components/ui/table';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import {
//     AlertCircle,
//     Calendar,
//     Edit,
//     Eye,
//     EyeOff,
//     Filter,
//     MapPin,
//     MessageSquare,
//     MoreHorizontal,
//     Plus,
//     Settings,
//     Trash2,
//     UserCheck,
//     Users,
// } from 'lucide-react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { toast } from 'sonner';
// import * as z from 'zod';

// const userSchema = z.object({
//     name: z
//         .string()
//         .min(1, 'El nombre es requerido')
//         .min(2, 'El nombre debe tener al menos 2 caracteres'),
//     email: z
//         .string()
//         .min(1, 'El correo electrónico es requerido')
//         .email('Ingresa un correo electrónico válido'),
//     password: z
//         .string()
//         .min(1, 'La contraseña es requerida')
//         .min(6, 'La contraseña debe tener al menos 6 caracteres'),
//     business_unit_id: z.number().min(1, 'El ID de la compañía es requerido'),
// });

// type UserFormData = z.infer<typeof userSchema>;

// export default function UsersPage() {
//     const router = useRouter();
//     const [offset, setOffset] = useState(0);
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);

//     const queryClient = useQueryClient();

//     const { data, isLoading, error, refetch } = useQuery({
//         queryKey: ['users', offset],
//         queryFn: async () => {
//             const { data, error } = await authClient.admin.listUsers({
//                 query: { offset, limit: 300 },
//             });
//             if (error) throw new Error(error.message);
//             return data;
//         },
//     });

//     // Form setup
//     const {
//         register,
//         handleSubmit,
//         formState: { errors, isValid },
//         reset,
//     } = useForm<UserFormData>({
//         resolver: zodResolver(userSchema),
//         mode: 'onChange',
//     });

//     // Optimistic Create User
//     const createUserMutation = useMutation({
//         mutationFn: async (newUser: UserFormData) => {
//             await authClient.admin.createUser({
//                 name: newUser.name,
//                 email: newUser.email,
//                 password: newUser.password,
//                 data: {
//                     business_unit_id: newUser.business_unit_id,
//                 },
//             });
//         },
//         onMutate: async (newUser) => {
//             await queryClient.cancelQueries({ queryKey: ['users', offset] });

//             const previousUsers = queryClient.getQueryData<typeof data>([
//                 'users',
//                 offset,
//             ]);

//             queryClient.setQueryData(
//                 ['users', offset],
//                 (old: { users: User[]; total: number }) => {
//                     return {
//                         total: old.total + 1,
//                         users: [
//                             ...old.users,
//                             {
//                                 id: crypto.randomUUID(),
//                                 name: newUser.name,
//                                 email: newUser.email,
//                                 role: 'user',
//                                 banned: false,
//                                 createdAt: new Date(),
//                                 data: {
//                                     business_unit_id: newUser.business_unit_id,
//                                 },
//                             },
//                         ],
//                     };
//                 }
//             );

//             return { previousUsers };
//         },
//         onError: (_err, _newUser, context) => {
//             if (context?.previousUsers) {
//                 queryClient.setQueryData(
//                     ['users', offset],
//                     context.previousUsers
//                 );
//             }
//         },
//         onSettled: () => {
//             queryClient.invalidateQueries({ queryKey: ['users', offset] });
//         },
//         onSuccess: () => {
//             setIsDialogOpen(false);
//             reset();
//         },
//     });

//     // Optimistic Ban User
//     const banUserMutation = useMutation({
//         mutationFn: async (userId: string) => {
//             const data = await authClient.admin.banUser({ userId });
//             if (data.error) {
//                 throw new Error(data.error.message);
//             }
//             return data.data;
//         },
//         onMutate: async (userId) => {
//             await queryClient.cancelQueries({ queryKey: ['users', offset] });

//             const previousUsers = queryClient.getQueryData<typeof data>([
//                 'users',
//                 offset,
//             ]);

//             queryClient.setQueryData(
//                 ['users', offset],
//                 (old: { users: User[]; total: number }) => {
//                     return {
//                         total: old.total,
//                         users: old.users.map((user) =>
//                             user.id === userId
//                                 ? { ...user, banned: true }
//                                 : user
//                         ),
//                     };
//                 }
//             );

//             return { previousUsers };
//         },
//         onError: (_err, _userId, context) => {
//             if (context?.previousUsers) {
//                 queryClient.setQueryData(
//                     ['users', offset],
//                     context.previousUsers
//                 );
//             }
//         },
//         onSettled: () => {
//             queryClient.invalidateQueries({ queryKey: ['users', offset] });
//         },
//     });

//     const { mutateAsync: changeRole } = useMutation({
//         mutationFn: async (user: { id: string; role: 'admin' | 'user' }) => {
//             await authClient.admin.setRole({
//                 userId: user.id,
//                 role: user.role,
//             });
//         },
//         onMutate: async (updatedUser) => {
//             await queryClient.cancelQueries({ queryKey: ['users', offset] });

//             const previousUsers = queryClient.getQueryData<{ users: User[] }>([
//                 'users',
//                 offset,
//             ]);

//             queryClient.setQueryData(
//                 ['users', offset],
//                 (old: { users: User[]; total: number }) => {
//                     return {
//                         total: old.total,
//                         users: old.users.map((user) =>
//                             user.id === updatedUser.id
//                                 ? { ...user, role: updatedUser.role }
//                                 : user
//                         ),
//                     };
//                 }
//             );

//             return { previousUsers };
//         },
//         onError: (_err, _newRole, context) => {
//             if (context?.previousUsers) {
//                 queryClient.setQueryData(
//                     ['users', offset],
//                     context.previousUsers
//                 );
//             }
//         },
//         onSettled: () => {
//             queryClient.invalidateQueries({ queryKey: ['users', offset] });
//         },
//     });

//     // Handlers
//     const handlerCreateUser = (data: UserFormData) => {
//         toast.promise(createUserMutation.mutateAsync(data), {
//             success: 'Usuario creado correctamente',
//             error: 'Error al crear el usuario',
//             position: 'top-center',
//             loading: 'Creando usuario...',
//         });
//     };

//     const handleImpersonate = async (userId: string) => {
//         toast.promise(authClient.admin.impersonateUser({ userId }), {
//             success: () => {
//                 refetch();
//                 router.push('/auth/login');
//                 return 'Usuario impersonado correctamente';
//             },
//             error: 'Error al impersonar el usuario',
//             position: 'top-center',
//             loading: 'Impersonando usuario...',
//         });
//     };

//     const handleDeleteUser = (userId: string) => {
//         toast.promise(banUserMutation.mutateAsync(userId), {
//             success: 'Usuario eliminado correctamente',
//             error: 'Error al eliminar el usuario',
//             position: 'top-center',
//             loading: 'Eliminando usuario...',
//         });
//     };

//     const handleChangeRole = (role: 'admin' | 'user', userId: string) => {
//         toast.promise(changeRole({ id: userId, role }), {
//             success: 'Rol cambiado correctamente',
//             error: 'Error al cambiar el rol',
//             position: 'top-center',
//             loading: 'Cambiando rol...',
//         });
//     };

//     return (
//         <div className="flex min-h-screen flex-col ">
//             <DashboardTracker pageName="Users" />
//             <PageHeader
//                 title="Gestión de Usuarios"
//                 description="Administra usuarios del sistema y sus permisos"
//                 action={{
//                     label: 'Nuevo Usuario',
//                     icon: <Plus className="mr-2 h-4 w-4" />,
//                     onClick: () => setIsDialogOpen(true),
//                 }}
//             />

//             {/* Users Table */}
//             <Card className="m-4">
//                 <CardHeader>
//                     <CardTitle>Lista de Usuarios</CardTitle>
//                     <CardDescription>
//                         Gestiona todos los usuarios del sistema y sus permisos
//                     </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Usuario</TableHead>
//                                 <TableHead>Rol</TableHead>
//                                 <TableHead>Estado</TableHead>
//                                 <TableHead>Fecha de creación</TableHead>
//                                 <TableHead className="text-right">
//                                     Acciones
//                                 </TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {data?.users.map((user: any) => (
//                                 <TableRow key={user.id}>
//                                     <TableCell>
//                                         <div>
//                                             <div className="font-medium">
//                                                 {user.name}
//                                             </div>
//                                             <div className="text-sm text-gray-500">
//                                                 {user.email}
//                                             </div>
//                                         </div>
//                                     </TableCell>
//                                     <TableCell>
//                                         <DialogChangeRole
//                                             onChangeRole={(role) =>
//                                                 handleChangeRole(role, user.id)
//                                             }
//                                             role={user.role ?? ''}
//                                             user_id={user.id}
//                                         >
//                                             <Badge
//                                                 className="cursor-pointer"
//                                                 variant={
//                                                     user.role ===
//                                                     'Administrador'
//                                                         ? 'default'
//                                                         : 'secondary'
//                                                 }
//                                             >
//                                                 {user.role}
//                                             </Badge>
//                                         </DialogChangeRole>
//                                     </TableCell>
//                                     <TableCell>
//                                         <Badge
//                                             variant={
//                                                 !user.banned
//                                                     ? 'default'
//                                                     : 'secondary'
//                                             }
//                                         >
//                                             {!user.banned
//                                                 ? 'Activo'
//                                                 : 'Inactivo'}
//                                         </Badge>
//                                     </TableCell>
//                                     <TableCell className="text-sm text-gray-500">
//                                         {user.createdAt.getDate()}/
//                                         {user.createdAt.getMonth()}/
//                                         {user.createdAt.getFullYear()}
//                                     </TableCell>
//                                     <TableCell className="text-right">
//                                         <DropdownMenu>
//                                             <DropdownMenuTrigger asChild>
//                                                 <Button
//                                                     variant="ghost"
//                                                     className="h-8 w-8 p-0"
//                                                 >
//                                                     <span className="sr-only">
//                                                         Abrir menú
//                                                     </span>
//                                                     <MoreHorizontal className="h-4 w-4" />
//                                                 </Button>
//                                             </DropdownMenuTrigger>
//                                             <DropdownMenuContent align="end">
//                                                 <DropdownMenuLabel>
//                                                     Acciones
//                                                 </DropdownMenuLabel>
//                                                 <DropdownMenuItem
//                                                     onClick={() =>
//                                                         navigator.clipboard.writeText(
//                                                             user.email
//                                                         )
//                                                     }
//                                                 >
//                                                     Copiar email
//                                                 </DropdownMenuItem>
//                                                 <DropdownMenuSeparator />
//                                                 <DropdownMenuItem
//                                                     onClick={() =>
//                                                         handleImpersonate(
//                                                             user.id
//                                                         )
//                                                     }
//                                                 >
//                                                     <UserCheck className="mr-2 h-4 w-4" />
//                                                     Suplantar usuario
//                                                 </DropdownMenuItem>
//                                                 <DropdownMenuItem>
//                                                     <Edit className="mr-2 h-4 w-4" />
//                                                     Editar
//                                                 </DropdownMenuItem>
//                                                 <DropdownMenuSeparator />
//                                                 <DropdownMenuItem
//                                                     className="text-red-600"
//                                                     onClick={() =>
//                                                         handleDeleteUser(
//                                                             user.id
//                                                         )
//                                                     }
//                                                 >
//                                                     <Trash2 className="mr-2 h-4 w-4" />
//                                                     Eliminar
//                                                 </DropdownMenuItem>
//                                             </DropdownMenuContent>
//                                         </DropdownMenu>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </CardContent>
//             </Card>

//             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//                 <DialogContent className="sm:max-w-[425px]">
//                     <DialogHeader>
//                         <DialogTitle>Crear Nuevo Usuario</DialogTitle>
//                         <DialogDescription>
//                             Completa la información para crear un nuevo usuario
//                             en el sistema.
//                         </DialogDescription>
//                     </DialogHeader>
//                     <form onSubmit={handleSubmit(handlerCreateUser)}>
//                         <div className="grid gap-4 py-4">
//                             <div className="space-y-2">
//                                 <Label
//                                     htmlFor="name"
//                                     className="text-sm font-medium"
//                                 >
//                                     Nombre completo*
//                                 </Label>
//                                 <Input
//                                     id="name"
//                                     {...register('name')}
//                                     className={
//                                         errors.name
//                                             ? 'border-red-300 focus:border-red-500'
//                                             : ''
//                                     }
//                                     placeholder="Ingresa el nombre completo"
//                                 />
//                                 {errors.name && (
//                                     <p className="text-sm text-red-600 flex items-center space-x-1">
//                                         <AlertCircle className="w-3 h-3" />
//                                         <span>{errors.name.message}</span>
//                                     </p>
//                                 )}
//                             </div>

//                             <div className="space-y-2">
//                                 <Label
//                                     htmlFor="email"
//                                     className="text-sm font-medium"
//                                 >
//                                     Correo electrónico*
//                                 </Label>
//                                 <Input
//                                     id="email"
//                                     type="email"
//                                     {...register('email')}
//                                     className={
//                                         errors.email
//                                             ? 'border-red-300 focus:border-red-500'
//                                             : ''
//                                     }
//                                     placeholder="usuario@baltra.com"
//                                 />
//                                 {errors.email && (
//                                     <p className="text-sm text-red-600 flex items-center space-x-1">
//                                         <AlertCircle className="w-3 h-3" />
//                                         <span>{errors.email.message}</span>
//                                     </p>
//                                 )}
//                             </div>

//                             <div className="space-y-2">
//                                 <Label
//                                     htmlFor="business_unit_id"
//                                     className="text-sm font-medium"
//                                 >
//                                     ID de la compañía*
//                                 </Label>
//                                 <Input
//                                     id="business_unit_id"
//                                     type="number"
//                                     {...register('business_unit_id', {
//                                         valueAsNumber: true,
//                                     })}
//                                     className={
//                                         errors.business_unit_id
//                                             ? 'border-red-300 focus:border-red-500'
//                                             : ''
//                                     }
//                                     placeholder="Ingresa el ID de la compañía"
//                                 />
//                                 {errors.business_unit_id && (
//                                     <p className="text-sm text-red-600 flex items-center space-x-1">
//                                         <AlertCircle className="w-3 h-3" />
//                                         <span>{errors.business_unit_id.message}</span>
//                                     </p>
//                                 )}
//                             </div>

//                             <div className="space-y-2">
//                                 <Label
//                                     htmlFor="password"
//                                     className="text-sm font-medium"
//                                 >
//                                     Contraseña*
//                                 </Label>
//                                 <div className="relative">
//                                     <Input
//                                         id="password"
//                                         type={
//                                             showPassword ? 'text' : 'password'
//                                         }
//                                         {...register('password')}
//                                         className={`pr-10 ${errors.password ? 'border-red-300 focus:border-red-500' : ''}`}
//                                         placeholder="Mínimo 6 caracteres"
//                                     />
//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             setShowPassword(!showPassword)
//                                         }
//                                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                                     >
//                                         {showPassword ? (
//                                             <EyeOff size={16} />
//                                         ) : (
//                                             <Eye size={16} />
//                                         )}
//                                     </button>
//                                 </div>
//                                 {errors.password && (
//                                     <p className="text-sm text-red-600 flex items-center space-x-1">
//                                         <AlertCircle className="w-3 h-3" />
//                                         <span>{errors.password.message}</span>
//                                     </p>
//                                 )}
//                             </div>
//                         </div>
//                         <DialogFooter>
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 onClick={() => setIsDialogOpen(false)}
//                             >
//                                 Cancelar
//                             </Button>
//                             <Button
//                                 type="submit"
//                                 className="bg-red-600 hover:bg-red-700"
//                                 disabled={isLoading || !isValid}
//                             >
//                                 {isLoading ? 'Creando...' : 'Crear Usuario'}
//                             </Button>
//                         </DialogFooter>
//                     </form>
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }

// // creadialos with 2 options for roles is for change role of user

// const DialogChangeRole = ({
//     role,
//     user_id,
//     children,
//     onChangeRole,
// }: {
//     role: string;
//     children: React.ReactNode;
//     user_id: string;
//     onChangeRole: (role: 'admin' | 'user') => void;
// }) => {
//     return (
//         <Dialog>
//             <DialogTrigger asChild>{children}</DialogTrigger>
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
//                     <DialogDescription>
//                         Selecciona el nuevo rol para el usuario.
//                     </DialogDescription>
//                 </DialogHeader>
//                 <div className="space-y-4">
//                     <Label htmlFor="role" className="text-sm font-medium">
//                         Rol
//                     </Label>
//                     <Select
//                         defaultValue={role}
//                         onValueChange={(value) =>
//                             onChangeRole(value as 'admin' | 'user')
//                         }
//                     >
//                         <SelectTrigger className="w-[180px]">
//                             <SelectValue placeholder="Selecciona un role" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="user">User</SelectItem>
//                             <SelectItem value="admin">Admin</SelectItem>
//                         </SelectContent>
//                     </Select>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// };
