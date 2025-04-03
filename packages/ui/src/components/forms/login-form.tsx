import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useAuth } from '@repo/hooks';
import { Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SignInDto } from '../../../../common/src/dto/auth/sign-in.dto';
import { Button } from '../../ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
type Props = { onSuccess: () => void };

export function LoginForm({ onSuccess }: Readonly<Props>) {
	const [error, setError] = useState<string | null>(null);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isValid },
	} = useForm({
		resolver: classValidatorResolver(SignInDto),
	});
	const { SignIn } = useAuth();
	const onSubmit = handleSubmit((data) => {
		SignIn.mutate(data as SignInDto);
		if (SignIn.isError) {
			setError(SignIn.error.message);
			setTimeout(() => {
				setError(null);
			}, 3000);
		}
		onSuccess();
	});
	return (
		<div className="h-screen flex items-center justify-center">
			<Card className="w-full max-w-md shadow-lg transition-all duration-300 hover:shadow-xl">
				{error && (
					<div className="flex items-center justify-center rounded-md bg-red-500 px-4 py-3 text-white">
						<p>{error}</p>
					</div>
				)}
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl font-bold">Vir-tome</CardTitle>
					<CardDescription>
						Por favor ingrese sus datos para iniciar sesión
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={onSubmit}>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									placeholder="name@example.com"
									className="pl-10 bg-input"
									required
									{...register('email')}
								/>
								{errors.email && (
									<span className="text-red-500">{errors.email.message as string}</span>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Password</Label>
								<span className="text-sm text-primary hover:underline">
									Forgot password?
								</span>
							</div>
							<div className="relative">
								<Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									className="pl-10 bg-input"
									required
									{...register('password')}
								/>
								{errors.password && (
									<span className="text-red-500">
										{errors.password.message as string}
									</span>
								)}
							</div>
						</div>
						<Button
							type="submit"
							className="w-full transition-all duration-300 hover:shadow-md"
							disabled={!isValid || isSubmitting}
						>
							{isSubmitting ? 'Signing in...' : 'Sign in'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
