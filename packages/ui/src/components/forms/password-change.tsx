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
import { Separator } from '@/ui/separator';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { UpdatePasswordDto } from '@repo/common';
import { useAuth } from '@repo/hooks';
import { Lock, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';

export function PasswordChangeForm() {
	const {
		register,
		handleSubmit,
		formState: { errors, isValid },
	} = useForm<UpdatePasswordDto>({
		resolver: classValidatorResolver(UpdatePasswordDto),
	});
	const { updatePassword } = useAuth();
	const onSubmit = handleSubmit(async (data) => {
		if (data.new_password !== data.confirm_new_password) {
			toast.error('Las contraseñas no coinciden', {
				duration: 5000,
			});
			return;
		}
		await updatePassword.mutateAsync(data, {
			onSuccess: () => {
				toast.success('Contraseña actualizada con éxito', {
					duration: 3000,
				});
				setTimeout(() => {
					window.location.href = '/auth/sign-in';
				}, 3 * 1000); // 3 seconds in milliseconds;
			},
			onError: (error) => {
				toast.error(error.message, {
					duration: 5000,
				});
			},
		});
	});

	return (
		<Card className="border-sidebar-border">
			<Toaster position="top-right" reverseOrder={false} />
			<CardHeader>
				<div className="flex items-center gap-2">
					<Lock className="h-5 w-5 text-sidebar-primary" />
					<CardTitle>Cambiar Contraseña</CardTitle>
				</div>
				<CardDescription>
					Actualiza tu contraseña para mantener tu cuenta segura.
				</CardDescription>
			</CardHeader>
			<form onSubmit={onSubmit}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="currentPassword">Contraseña Actual</Label>
						<Input
							id="currentPassword"
							type="password"
							placeholder="••••••••"
							className="border-sidebar-border focus-visible:ring-sidebar-ring"
							{...register('old_password')}
						/>
						{errors.old_password && (
							<p className="text-red-500">{errors.old_password?.message}</p>
						)}
					</div>
					<Separator className="bg-sidebar-border" />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="newPassword">Nueva Contraseña</Label>
							<Input
								id="newPassword"
								type="password"
								placeholder="••••••••"
								className="border-sidebar-border focus-visible:ring-sidebar-ring"
								{...register('new_password')}
							/>
							{errors.new_password && (
								<p className="text-red-500">{errors.new_password?.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
							<Input
								id="confirmPassword"
								type="password"
								placeholder="••••••••"
								className="border-sidebar-border focus-visible:ring-sidebar-ring"
								{...register('confirm_new_password')}
							/>
							{errors.confirm_new_password && (
								<p className="text-red-500">{errors.confirm_new_password?.message}</p>
							)}
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						type="submit"
						className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
						disabled={!isValid}
					>
						<Save className="mr-2 h-4 w-4" />
						Actualizar Contraseña
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
