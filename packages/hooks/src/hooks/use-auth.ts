import {
	IApiResponse,
	IAuthResponse,
	IRequestUser,
	ISignUpResponse,
	PAYLOAD_TYPE,
	SignInDto,
	SignUpDto,
	UpdatePasswordDto,
	UpdatePersonalDataDto,
} from '@repo/common';
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { AuthService } from '../services/auth.service';

export const useAuth = () => {
	const client = useQueryClient();
	const session = useQuery<IApiResponse<IRequestUser>, IApiResponse<Error>>({
		queryKey: ['session'],
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		placeholderData: keepPreviousData,
		queryFn: async () => (await AuthService.getSession()).data,
	});
	const superAdminLogin = useMutation({
		mutationFn: async (data: SignInDto) =>
			(await AuthService.superAdminLogin(data)).data,
	});
	const signIn = useMutation({
		mutationFn: async (data: SignInDto) => (await AuthService.signIn(data)).data,
	});
	const signOut = useMutation({
		mutationFn: async () => (await AuthService.signOut()).data,
	});
	const updateUser = useMutation({
		mutationFn: async (data: UpdatePersonalDataDto) =>
			(await AuthService.updateUser(data)).data,
	});
	const updatePassword = useMutation({
		mutationFn: async (data: UpdatePasswordDto) =>
			(await AuthService.updatePassword(data)).data,
	});
	const confirmEmail = useMutation({
		mutationFn: async (token: string) =>
			(await AuthService.confirmEmail(token)).data,
	});
	const register = useMutation<
		IApiResponse<ISignUpResponse>,
		IApiResponse<Error>,
		SignUpDto
	>({
		mutationFn: async (data: SignUpDto) => (await AuthService.signUp(data)).data,
		onSuccess: () => client.invalidateQueries(),
	});
	return {
		session,
		signIn,
		signOut,
		updateUser,
		updatePassword,
		confirmEmail,
		superAdminLogin,
		register,
	};
};
