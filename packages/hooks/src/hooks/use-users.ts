import { GenericHookProps, IApiResponse, IUser, ROLES } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { UsersService } from '../services/users.service';

export const useUsers = ({ page, searchTerm }: GenericHookProps) => {
	const getUsersByRole = (role: ROLES) =>
		useQuery({
			queryKey: ['users', page, searchTerm],
			queryFn: async () =>
				(await UsersService.getUsersByRole(role, page, searchTerm)).data,
		});
	const getLastRegisters = useQuery<IApiResponse<IUser[]>, IApiResponse<Error>>({
		queryKey: ['last-registers'],
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		queryFn: async () => (await UsersService.getLastRegisters()).data,
	});
	return {
		getUsersByRole,
		getLastRegisters,
	};
};
