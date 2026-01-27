'use client';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/ui/card';
import { ITenant } from '@repo/common';
import { useTenants } from '@repo/hooks';
import { Tenantcolumns } from '../cells/tenant-columns';
import { SimpleTable } from './simple-table';

export function RecentTenantsTable() {
	const { getLastTenants } = useTenants({ page: 1 });
	return (
		<Card className="h-full flex flex-col">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg font-medium">Últimos Clientes</CardTitle>
				<CardDescription>Nuevas altas en la plataforma</CardDescription>
			</CardHeader>

			<CardContent className="flex-1 overflow-auto p-0 px-3 pb-3">
				<SimpleTable<ITenant>
					columns={Tenantcolumns}
					data={getLastTenants.data?.data ?? []}
					isLoading={getLastTenants.isLoading}
				/>
			</CardContent>
		</Card>
	);
}
