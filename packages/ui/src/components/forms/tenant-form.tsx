// src/app/super-admin/tenants/components/tenant-form.tsx
'use client';

import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import {
	CreateTenantDto,
	ITenant,
	UpdateTenantDto,
	castToDto,
} from '@repo/common'; // Ajusta imports
import { useEffect } from 'react';
import { useForm, useFormContext } from 'react-hook-form';

import { useModalCrud } from '@/contexts/modal-crud-context';
// UI Components
import { Button } from '@/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/ui/card';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { Separator } from '@/ui/separator';
import { Switch } from '@/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { useTenants } from '@repo/hooks';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner'; // O tu librería de toast

// --- TIPOS ---
interface TenantFormProps {
	onSuccess?: () => void;
}

// ==========================================
// 1. COMPONENTE PRINCIPAL
// ==========================================
export const TenantForm = ({ onSuccess }: TenantFormProps) => {
	const {
		hook: { createTenant, updateTenant },
		entity: tenant,
	} = useModalCrud<ITenant, ReturnType<typeof useTenants>>();

	// Instanciamos el DTO correcto para la validación
	const resolver = classValidatorResolver(
		tenant ? UpdateTenantDto : CreateTenantDto,
	);

	const form = useForm<CreateTenantDto>({
		resolver,
	});

	// Resetear formulario si llega data asíncrona (Edit Mode)
	useEffect(() => {
		if (tenant) {
			for (const [key, val] of Object.entries(tenant)) {
				if (key in form.getValues()) {
					form.setValue(key as keyof CreateTenantDto, val);
				}
			}
			form.setValue('settings', tenant.settings);
			form.setValue('plan', tenant.plan);
		}
	}, [tenant, form]);

	const onSubmit = async (data: CreateTenantDto) => {
		try {
			if (tenant) {
				toast.promise(updateTenant.mutateAsync({ data, id: tenant.id }), {
					success: () => 'Tenant actualizado correctamente',
					error: () => 'Error actualizando el tenant',
				});
			} else {
				toast.promise(createTenant.mutateAsync(data), {
					success: 'Tenant creado satisfactoriamente',
					error: 'Error creando el tenant',
				});
			}
			onSuccess?.();
		} catch (error) {
			console.error(error);
			toast.error('Ocurrió un error al guardar');
		}
	};

	return (
		<>
			<Toaster position="top-right" richColors className="absolute" />
			<Card className="w-full h-full border-0 shadow-none">
				<CardHeader>
					<CardTitle>{tenant ? 'Editar Cliente' : 'Nuevo Cliente'}</CardTitle>
					<CardDescription>
						{tenant
							? 'Modifica los parámetros del tenant.'
							: 'Registra una nueva institución en la plataforma.'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<Tabs defaultValue="general" className="w-full">
								<TabsList
									className={`grid w-full ${tenant ? 'grid-cols-3' : 'grid-cols-4'}`}
								>
									<TabsTrigger value="general">General</TabsTrigger>
									{!tenant && (
										<TabsTrigger value="contact">Contacto y Admin</TabsTrigger>
									)}
									<TabsTrigger value="settings">Configuración</TabsTrigger>
									<TabsTrigger value="limits">Límites</TabsTrigger>
								</TabsList>

								{/* Inyectamos los Tabs */}
								<div className="mt-4 min-h-[420px] space-y-4">
									<TabsContent value="general">
										<GeneralTabContent isEdit={!!tenant} />
									</TabsContent>

									{!tenant && (
										<TabsContent value="contact">
											<ContactTabContent />
										</TabsContent>
									)}

									<TabsContent value="settings">
										<SettingsTabContent />
									</TabsContent>

									<TabsContent value="limits">
										<LimitsTabContent />
									</TabsContent>
								</div>
							</Tabs>

							<div className="flex justify-end gap-4 pt-4 border-t">
								<Button type="button" variant="outline" onClick={() => onSuccess?.()}>
									Cancelar
								</Button>
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{tenant ? 'Guardar Cambios' : 'Crear Tenant'}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</>
	);
};

// ==========================================
// 2. MICRO COMPONENTES (Tabs)
// ==========================================

// --- TAB 1: GENERAL ---
const GeneralTabContent = ({ isEdit }: { isEdit: boolean }) => {
	const { control, watch } = useFormContext<CreateTenantDto>();
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{/* Nombre */}
			<FormField
				control={control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nombre Institución</FormLabel>
						<FormControl>
							<Input placeholder="Ej: Colegio San Martín" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Subdominio (Bloqueado en edición usualmente) */}
			<FormField
				control={control}
				name="subdomain"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Subdominio</FormLabel>
						<div className="flex items-center gap-2">
							<FormControl>
								<Input placeholder="colegio-san-martin" {...field} disabled={isEdit} />
							</FormControl>
							<span className="text-sm text-muted-foreground">.virtome.com</span>
						</div>
						<FormDescription>
							Solo letras minúsculas, números y guiones.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Plan */}
			<FormField
				control={control}
				name="plan"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Plan de Suscripción</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un plan" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="basic">Básico</SelectItem>
								<SelectItem value="premium">Premium</SelectItem>
								<SelectItem value="enterprise">Enterprise</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Expiración */}
			<FormField
				control={control}
				name="subscription_expires_at"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Vencimiento Suscripción</FormLabel>
						<FormControl>
							<Input
								type="date"
								value={
									field.value ? new Date(field.value).toISOString().split('T')[0] : ''
								}
								onChange={(e) => field.onChange(new Date(e.target.value))}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Toggles de Estado */}
			<div className="flex flex-col gap-4 p-4 border rounded-md col-span-1 md:col-span-2">
				<FormField
					control={control}
					name="is_active"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg p-3 shadow-sm bg-muted/20">
							<div className="space-y-0.5">
								<FormLabel>Activo</FormLabel>
								<FormDescription>Permitir acceso al sistema</FormDescription>
							</div>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="is_demo"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg p-3 shadow-sm bg-muted/20">
							<div className="space-y-0.5">
								<FormLabel>Modo Demo</FormLabel>
								<FormDescription>Marca el tenant como demostración</FormDescription>
							</div>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
};

// --- TAB 2: CONTACTO & ADMIN ---
const ContactTabContent = () => {
	const { control } = useFormContext<CreateTenantDto>();
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormField
					control={control}
					name="contact_email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email de Contacto (Institucional)</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<Separator className="my-4" />
			<h3 className="text-sm font-medium text-muted-foreground mb-2">
				Usuario Administrador Inicial
			</h3>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormField
					control={control}
					name="admin_name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="admin_surname"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Apellido</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="admin_email"
					render={({ field }) => (
						<FormItem className="col-span-1 md:col-span-2">
							<FormLabel>Email Admin (Login)</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
};
// --- TAB 3: SETTINGS (School Info) ---
const SettingsTabContent = () => {
	const { control } = useFormContext<CreateTenantDto>();
	return (
		<div className="space-y-4">
			<FormField
				control={control}
				name="settings.theme"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Tema Visual</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona tema" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="light">Claro</SelectItem>
								<SelectItem value="dark">Oscuro</SelectItem>
								<SelectItem value="blue">Azul Institucional</SelectItem>
								<SelectItem value="green">Verde</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			<Separator />
			<h4 className="text-sm font-semibold">Información Escolar</h4>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormField
					control={control}
					name="settings.school_info.name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre para Reportes</FormLabel>
							<FormControl>
								<Input
									placeholder="Igual al nombre del tenant o formal..."
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="settings.school_info.principal"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Director/a</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="settings.school_info.phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Teléfono</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="settings.school_info.address"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Dirección</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
};

// --- TAB 4: LIMITS ---
const LimitsTabContent = () => {
	const { control } = useFormContext<CreateTenantDto>();
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			<FormField
				control={control}
				name="settings.limits.max_books"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Máx. Libros</FormLabel>
						<FormControl>
							<Input
								type="number"
								{...field}
								onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
							/>
						</FormControl>
						<FormDescription>Inventario total</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="settings.limits.max_users"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Máx. Usuarios</FormLabel>
						<FormControl>
							<Input
								type="number"
								{...field}
								onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
							/>
						</FormControl>
						<FormDescription>Estudiantes + Staff</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="settings.limits.max_loans"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Máx. Préstamos</FormLabel>
						<FormControl>
							<Input
								type="number"
								{...field}
								onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
							/>
						</FormControl>
						<FormDescription>Préstamos activos simultáneos</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
};
