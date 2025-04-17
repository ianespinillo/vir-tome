import { SignInDto } from '@repo/common';
import { useMutation } from '@tanstack/react-query';

export const useAuth = () => {
	const SignIn = useMutation({
		mutationKey: ['signIn'],
		mutationFn: async ({ email, password }: SignInDto) => {
			const response = await fetch(`${process.env.API_URL}/api/auth/signin`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});
			return response.json();
		},
	});
	return { SignIn };
};
