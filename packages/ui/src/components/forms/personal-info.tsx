'use client';

import { Button } from '@/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { UpdatePersonalDataDto } from '@repo/common';
import { useAuth } from '@repo/hooks';
import { Mail, Save, User } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';

export function PersonalInfoForm() {
	const {
		session: { data },
		updateUser,
	} = useAuth();
	const form = useForm({
		resolver: classValidatorResolver(UpdatePersonalDataDto),
	});
	useEffect(() => {
		if (data) {
			form.reset({
				name: data.name,
				surname: data.surname,
				email: data.email,
			});
		}
	}, [data, form]);
	const submit = form.handleSubmit(async (data) => {
		await updateUser.mutateAsync(data as UpdatePersonalDataDto, {
			onSuccess: () => {
				form.reset();
				toast.success('Información actualizada correctamente', {
					duration: 2000,
				});
			},
			onError: (error) => {
				toast.error(error instanceof Error ? error.message : 'Error desconocido', {
					duration: 2000,
				});
			},
		});
	});
	return (
		<Card className="border-sidebar-border">
			<Toaster position="top-right" />
			<CardHeader>
				<div className="flex items-center gap-2">
					<User className="h-5 w-5 text-sidebar-primary" />
					<CardTitle>Información Personal</CardTitle>
				</div>
				<CardDescription>Actualiza tu información personal.</CardDescription>
			</CardHeader>
			<form onSubmit={submit}>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="firstName">Nombre</Label>
							<Input
								id="firstName"
								placeholder="Tu nombre"
								className="border-sidebar-border focus-visible:ring-sidebar-ring"
								{...form.register('name')}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Apellido</Label>
							<Input
								id="lastName"
								placeholder="Tu apellido"
								className="border-sidebar-border focus-visible:ring-sidebar-ring"
								{...form.register('surname')}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Correo Electrónico</Label>
						<div className="flex items-center gap-2">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								type="email"
								placeholder="tu@ejemplo.com"
								className="border-sidebar-border focus-visible:ring-sidebar-ring"
								{...form.register('email')}
							/>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						type="submit"
						className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
						disabled={!form.formState.isValid}
					>
						<Save className="mr-2 h-4 w-4" />
						Guardar Cambios
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
