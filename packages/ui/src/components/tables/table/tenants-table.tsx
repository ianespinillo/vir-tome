import { useModalCrud } from '@/contexts/modal-crud-context';
import { ITenant } from '@repo/common';
import { useTenants } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import React from 'react';
import { Toaster } from 'sonner';
import { tenantCrudColumns } from '../cells/tenant-crud-columns';
import { PaginableTable } from './paginable-table';

type UseTenant = typeof useTenants;
export const TenantsTable = () => {
	const {
		hook: { tenants },
	} = useModalCrud<ITenant, ReturnType<UseTenant>>();
	return (
		<div className="p-5">
			<Toaster richColors position="top-right" />
			<PaginableTable
				columns={tenantCrudColumns as ColumnDef<unknown>[]}
				query={tenants}
			/>
		</div>
	);
};
