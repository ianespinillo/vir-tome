import {
	CreateTenantDto,
	GenericHookProps,
	IApiResponse,
	IPaginatedResponse,
	ITenant,
	IUser,
	ROLES,
	UpdateTenantDto,
} from '@repo/common';
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { TenantService } from '../services/tenant.service';
import { UsersService } from '../services/users.service';

/*
Nota mental de que debe hacer el hook
1. operaciones crud en base al controller
2. paginacion
3.
*/
export const useTenants = ({ searchTerm = '', page = 1 }: GenericHookProps) => {
	const client = useQueryClient();
	const tenants = useQuery({
		queryKey: ['tenants', page, searchTerm],
		queryFn: async () =>
			(await TenantService.getPaginatedTenants(page, searchTerm)).data,
		staleTime: 5000,
		refetchOnWindowFocus: false,
		retry: false,
		placeholderData: keepPreviousData,
	});

	const findTenantBySubdomain = useMutation({
		mutationFn: async (subdomain: string) =>
			(await TenantService.getTenantBySubdomain(subdomain)).data,
	});
	const findTenantById = useMutation({
		mutationFn: async (id: number) =>
			(await TenantService.getTenantById(id)).data,
	});
	const updateTenant = useMutation({
		mutationFn: async ({
			data,
			id,
		}: {
			data: UpdateTenantDto;
			id: number;
		}) => (await TenantService.updateTenant(id, data)).data,
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['tenants', page, searchTerm] });
		},
	});
	const deleteTenant = useMutation({
		mutationFn: async (id: number) => (await TenantService.deleteTenant(id)).data,
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['tenants', page, searchTerm] });
		},
	});
	const createTenant = useMutation({
		mutationFn: async (data: CreateTenantDto) =>
			(await TenantService.createTenant(data)).data,
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['tenants', page, searchTerm] });
		},
	});
	const activateTenant = useMutation({
		mutationFn: async (id: number) =>
			(await TenantService.activateTenant(id)).data,
	});
	const deactivateTenant = useMutation({
		mutationFn: async (id: number) =>
			(await TenantService.deactivateTenant(id)).data,
	});
	const getLastTenants = useQuery<IApiResponse<ITenant[]>, IApiResponse<Error>>({
		queryKey: ['lastTenants'],
		queryFn: async () => (await TenantService.getLastTenants()).data,
	});
	const getTenantAdmins = useQuery<IApiResponse<IPaginatedResponse<IUser>>>({
		queryKey: ['admins', page, searchTerm],
		queryFn: async () =>
			(await UsersService.getUsersByRole(ROLES.ADMIN, page, searchTerm)).data,
	});
	const getAllTenants = useQuery({
		queryKey: ['full-tenants'],
		queryFn: async () => (await TenantService.getAllTenants()).data,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		placeholderData: keepPreviousData,
	});
	return {
		tenants: {
			...tenants,
			page,
		},
		findTenantBySubdomain,
		findTenantById,
		updateTenant,
		deleteTenant,
		createTenant,
		activateTenant,
		deactivateTenant,
		getLastTenants,
		getTenantAdmins,
		getAllTenants,
	};
};
