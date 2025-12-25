'use client';

import { useModalCrud } from '@/contexts/modal-crud-context';
import { Button } from '@/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { ITenant, IUser, ROLES, SignUpDto } from '@repo/common';
import { useAuth, useTenants, useUsers } from '@repo/hooks';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Toaster, toast } from 'sonner';

interface Props {
	role: ROLES;
}

export const UserForm = ({ role }: Readonly<Props>) => {
	const { entity, setCreateOpen } = useModalCrud<
		IUser,
		ReturnType<typeof useUsers>
	>();
	const [showTenantField, setShowTenantField] = useState(false);
	const { session, register } = useAuth();
	const resolver = classValidatorResolver(SignUpDto);
	const { getAllTenants } = useTenants({ page: 1 });
	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<SignUpDto>({
		resolver,
		defaultValues: {
			role,
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
			setValue('tenantId', session.data?.data?.tenantId);
		}
	}, [session, entity]);
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
				<div className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="email">
							Email <span className="text-destructive">*</span>
						</Label>
						<Controller
							name="email"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									id="email"
									type="email"
									placeholder="ejemplo@correo.com"
									maxLength={100}
									className={errors.email ? 'border-destructive' : ''}
								/>
							)}
						/>
						{errors.email && (
							<p className="text-sm text-destructive">{errors.email.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="name">
							Nombre <span className="text-destructive">*</span>
						</Label>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									id="name"
									type="text"
									placeholder="Juan"
									maxLength={100}
									className={errors.name ? 'border-destructive' : ''}
								/>
							)}
						/>
						{errors.name && (
							<p className="text-sm text-destructive">{errors.name.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="surname">
							Apellido <span className="text-destructive">*</span>
						</Label>
						<Controller
							name="surname"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									id="surname"
									type="text"
									placeholder="Pérez"
									maxLength={100}
									className={errors.surname ? 'border-destructive' : ''}
								/>
							)}
						/>
						{errors.surname && (
							<p className="text-sm text-destructive">{errors.surname.message}</p>
						)}
					</div>

					{showTenantField && (
						<div className="space-y-2">
							<Label htmlFor="tenantId">
								Tenant <span className="text-destructive">*</span>
							</Label>
							<Controller
								name="tenantId"
								control={control}
								render={({ field: { value, onChange } }) => (
									<Select
										value={value?.toString()}
										onValueChange={(val) => onChange(Number.parseInt(val))}
									>
										<SelectTrigger
											id="tenantId"
											className={errors.tenantId ? 'border-destructive' : ''}
										>
											<SelectValue placeholder="Seleccione un tenant" />
										</SelectTrigger>
										<SelectContent>
											{tenants.map((tenant) => (
												<SelectItem key={tenant.id} value={tenant.id.toString()}>
													{tenant.name} ({tenant.subdomain})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.tenantId && (
								<p className="text-sm text-destructive">{errors.tenantId.message}</p>
							)}
						</div>
					)}

					<Button onClick={handleSubmit(onSubmit)} className="w-full">
						Registrar Usuario
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};
