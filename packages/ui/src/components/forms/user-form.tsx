'use client';

import { useModalCrud } from '@/contexts/modal-crud-context';
import {
	getRolesLabel,
	getRolesManagables,
} from '@/helpers/get-roles-managable';
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
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import {
	ITenant,
	IUser,
	ROLES,
	SignUpDto,
	UsersQueriesDto,
} from '@repo/common';
import { useAuth, useTenants, useUsers } from '@repo/hooks';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormSelect } from '../select/form-select';

export const UserForm = () => {
	const { entity, setCreateOpen } = useModalCrud<
		IUser,
		UsersQueriesDto,
		ReturnType<typeof useUsers>
	>();
	const [showTenantField, setShowTenantField] = useState(false);
	const { session, register } = useAuth();
	const resolver = classValidatorResolver(SignUpDto);
	const { getAllTenants } = useTenants({ page: 1 });

	const form = useForm<SignUpDto>({
		resolver,
		defaultValues: {
			role: undefined,
			email: entity?.email || '',
			name: entity?.name || '',
			surname: entity?.surname || '',
		},
	});

	useEffect(() => {
		if (session.status === 'success' && session.data?.data) {
			setShowTenantField(session.data?.data?.roleName === ROLES.SUPER_ADMIN);
		}
		if (!showTenantField) {
			form.setValue('tenantId', session.data?.data?.tenantId);
		}
	}, [session, entity, showTenantField, form]);

	const tenants: ITenant[] = getAllTenants.data?.data ?? [];

	const onSubmit = (data: SignUpDto) => {
		toast.promise(register.mutateAsync(data), {
			success: () => {
				setCreateOpen(false);
				return 'Usuario creado exitosamente';
			},
			error: 'Error creando el usuario',
		});
	};

	return (
		<Card className="w-full max-w-lg mx-auto">
			<CardHeader>
				<CardTitle className="text-2xl">Registro de Usuario</CardTitle>
				<CardDescription>
					Complete los datos para crear una nueva cuenta
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Email <span className="text-destructive">*</span>
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="email"
											placeholder="ejemplo@correo.com"
											maxLength={100}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormSelect<SignUpDto>
										name="role"
										selectPlaceholder="Seleccione un rol"
										label="Rol"
										options={getRolesLabel(
											getRolesManagables(session.data?.data?.roleName),
										)}
										control={form.control}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Nombre <span className="text-destructive">*</span>
									</FormLabel>
									<FormControl>
										<Input {...field} type="text" placeholder="Juan" maxLength={100} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="surname"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Apellido <span className="text-destructive">*</span>
									</FormLabel>
									<FormControl>
										<Input {...field} type="text" placeholder="Pérez" maxLength={100} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{showTenantField && (
							<FormField
								control={form.control}
								name="tenantId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Tenant <span className="text-destructive">*</span>
										</FormLabel>
										<Select
											value={field.value?.toString()}
											onValueChange={(val) => field.onChange(Number.parseInt(val))}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccione un tenant" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{tenants.map((tenant) => (
													<SelectItem key={tenant.id} value={tenant.id.toString()}>
														{tenant.name} ({tenant.subdomain})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<Button type="submit" className="w-full">
							Registrar Usuario
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
