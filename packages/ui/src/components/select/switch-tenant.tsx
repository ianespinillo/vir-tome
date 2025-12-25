'use client';
import { useUINav } from '@/contexts/navigation-context';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { useAuth, useUsers } from '@repo/hooks';

interface SwitchTenantProps {
	userId: number;
}

export const SwitchTenant = ({ userId }: SwitchTenantProps) => {
	const { navigate } = useUINav();
	const { switchTenant } = useAuth();
	const { getUserTenants } = useUsers({ page: 1, searchTerm: '' });
	const { data } = getUserTenants(userId);

	return (
		<Select
			onValueChange={(value) => {
				switchTenant.mutate(Number(value), {
					onSuccess: () => {
						const targetTenant = data?.data?.find(
							(t) => t.tenant_id === Number(value),
						);
						navigate(
							`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${targetTenant?.tenant?.subdomain}.${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
							{ isExternal: true },
						);
					},
				});
			}}
		>
			<SelectTrigger id="role-select">
				<SelectValue placeholder="Cambiar tenant" />
			</SelectTrigger>
			<SelectContent>
				{data?.data?.map((tenant) => (
					<SelectItem key={tenant.tenant.id} value={tenant.tenant_id.toString()}>
						{tenant.tenant.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
