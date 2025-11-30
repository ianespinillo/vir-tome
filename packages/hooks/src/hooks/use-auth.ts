import {
	IAuthResponse,
	PAYLOAD_TYPE,
	UpdatePasswordDto,
	UpdatePersonalDataDto,
} from '@repo/common';
import { useMutation, useQuery } from '@tanstack/react-query';

export const useAuth = () => {
	const session = useQuery({
		queryKey: ['session'],
		queryFn: async () => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				},
			);
			if (!response.ok) {
				throw new Error('Failed to fetch session');
			}
			return response.json() as Promise<IAuthResponse>;
		},
	});
	const superAdminLogin = useMutation({
		mutationFn: async (data: {
			email: string;
			password: string;
			type: PAYLOAD_TYPE;
		}) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/admin-login`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify(data),
				},
			);
			if (!response.ok) {
				throw new Error('Failed to sign in as super admin');
			}
			return response.json();
		},
	});
	const signIn = useMutation({
		mutationFn: async (data: {
			email: string;
			password: string;
			type: PAYLOAD_TYPE;
		}) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/sign-in`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify(data),
				},
			);
			if (!response.ok) {
				throw new Error('Failed to sign in');
			}
			return response.json();
		},
	});
	const signOut = useMutation({
		mutationFn: async () => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/sign-out`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				},
			);
			if (!response.ok) {
				throw new Error('Failed to sign out');
			}
			return response.json();
		},
		onSuccess() {
			document.location.href = 'auth/sign-in';
		},
	});
	const updateUser = useMutation({
		mutationFn: async (data: UpdatePersonalDataDto) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/update-user`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify(data),
				},
			);
			if (!response.ok) {
				throw new Error('Failed to update user');
			}
			return response.json();
		},
	});
	const updatePassword = useMutation({
		mutationFn: async (data: UpdatePasswordDto) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/update-password`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify(data),
				},
			);
			if (!response.ok) {
				throw new Error('Failed to update password');
			}
			return response.json();
		},
	});
	const confirmEmail = useMutation({
		mutationFn: async (token: string) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/confirm-email`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({ token }),
				},
			);
			if (!response.ok) {
				throw new Error('Failed to confirm email');
			}
			return response.json();
		},
	});
	return {
		session,
		signIn,
		signOut,
		updateUser,
		updatePassword,
		confirmEmail,
		superAdminLogin,
	};
};
