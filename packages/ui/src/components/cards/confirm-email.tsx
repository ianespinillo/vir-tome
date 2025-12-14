'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { useAuth } from '@repo/hooks';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type ConfirmEmailProps = {
	token: string;
	success?: () => void;
};

export const ConfirmEmail = ({
	token,
	success,
}: Readonly<ConfirmEmailProps>) => {
	const { confirmEmail } = useAuth();
	const [status, setStatus] = useState<'loading' | 'error' | 'success'>(
		'loading',
	);
	const [errorMessage, setErrorMessage] = useState<string>('');

	useEffect(() => {
		const executeMutation = async () => {
			confirmEmail.mutate(token, {
				onSuccess: () => {
					setStatus('success');
					const timer = setTimeout(() => {
						success?.();
					}, 5 * 1000); // 5 seconds in milliseconds
					return () => clearTimeout(timer);
				},
				onError: (error) => {
					setStatus('error');
					setErrorMessage(
						error instanceof Error ? error.message : 'Error desconocido',
					);
				},
			});
		};

		executeMutation();
	}, [token, confirmEmail, success]);
	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="text-center">Email Confirmation</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center p-6">
				{status === 'loading' && (
					<div className="flex flex-col items-center space-y-4">
						<Loader2 className="h-16 w-16 text-primary animate-spin" />
						<p className="text-center text-lg">Verificando email...</p>
					</div>
				)}

				{status === 'error' && (
					<div className="flex flex-col items-center space-y-4">
						<XCircle className="h-16 w-16 text-destructive" />
						<p className="text-center text-lg font-medium text-destructive">
							Error en la confirmación
						</p>
						<p className="text-center text-muted-foreground">{errorMessage}</p>
					</div>
				)}

				{status === 'success' && (
					<div className="flex flex-col items-center space-y-4">
						<CheckCircle className="h-16 w-16 text-green-500" />
						<p className="text-center text-lg font-medium text-green-700">
							Email confirmado
						</p>
						<p className="text-center text-muted-foreground">
							Gracias por confirmar tu email. Seras redirigido a la página de inicio en
							5 segundos.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
