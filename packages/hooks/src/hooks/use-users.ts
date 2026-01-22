import {
	AddUserToTenantDto,
	UsersQueriesDto,
} from '@repo/common';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { UsersService } from '../services/users.service';

export const useUsers = (queries: UsersQueriesDto) => {
	const getUsersByRole = useQuery({
			queryKey: ['users', queries],
			queryFn: async () =>
				(await UsersService.getUsers(queries)).data,
			staleTime: 5000,
			placeholderData: keepPreviousData,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
		});
	const attachUserToTenant = useMutation({
		mutationKey: ['attach-user-to-tenant'],
		mutationFn: async ({
			dto,
			userId,
		}: {
			dto: AddUserToTenantDto;
			userId: number;
		}) => (await UsersService.attachUserToTenant(dto, userId)).data,
	});
	const getUserById = useMutation({
		mutationKey: ['user'],
		mutationFn: async (id: number) => (await UsersService.getUser(id)).data,
	});

	return {
		getUsersByRole,
		attachUserToTenant,
		getUserById,
	};
};

export const useUserTenants = (userId: number) =>
	useQuery({
		queryKey: ['user-tenants', userId],
		queryFn: async () => (await UsersService.getUserTenants(userId)).data,
	});

	export const useLastRegisters = () =>useQuery({
		queryKey: ['last-registers'],
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		queryFn: async () => (await UsersService.getLastRegisters()).data,
	});