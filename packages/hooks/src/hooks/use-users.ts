import {
	AddUserToTenantDto,
	GenericHookProps,
	IApiResponse,
	IUser,
	ROLES,
} from '@repo/common';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UsersService } from '../services/users.service';

export const useUsers = ({ page, searchTerm }: GenericHookProps) => {
	const getUsersByRole = (role?: ROLES) =>
		useQuery({
			queryKey: ['users', page, searchTerm, role],
			queryFn: async () =>
				(await UsersService.getUsersByRole(page, role, searchTerm)).data,
		});
	const getLastRegisters = useQuery<IApiResponse<IUser[]>, IApiResponse<Error>>({
		queryKey: ['last-registers'],
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		queryFn: async () => (await UsersService.getLastRegisters()).data,
	});
	const attachUserToTenant = useMutation({
		mutationKey: ['attach-user-to-tenant'],
		mutationFn: async ({
			dto,
			userId,
		}: { dto: AddUserToTenantDto; userId: number }) =>
			(await UsersService.attachUserToTenant(dto, userId)).data,
	});
	const getUserTenants = (userId: number) =>
		useQuery({
			queryKey: ['user-tenants', userId],
			queryFn: async () => (await UsersService.getUserTenants(userId)).data,
		});
	return {
		getUsersByRole,
		getLastRegisters,
		attachUserToTenant,
		getUserTenants,
	};
};
