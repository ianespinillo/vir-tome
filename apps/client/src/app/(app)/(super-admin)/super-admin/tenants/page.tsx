'use client';
import { ITenant } from '@repo/common';
import { useTenants } from '@repo/hooks';
import {
	AddButton,
	CreateTenantDialog,
	EditTenantDialog,
	InputFilter,
	ModalCrudProvider,
	TenantDetailsDialog,
	TenantsTable,
	useModalCrud,
} from '@repo/ui';
import React, { useEffect, useState } from 'react';

export default function TenantsPage() {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);
	return (
		isClient && (
			<ModalCrudProvider<ITenant, ReturnType<typeof useTenants>>
				useHook={useTenants}
			>
				<div className="flex flex-col gap-6 p-6 h-full w-full">
					<div className="flex justify-end p-2 gap-2">
						<InputFilter text="Buscar Tenant" />
						<Button />
					</div>
					<div className="w-full">
						<TenantsTable />
					</div>
				</div>
				<CreateTenantDialog />
				<EditTenantDialog />
				<TenantDetailsDialog />
			</ModalCrudProvider>
		)
	);
}

function Button() {
	const { setCreateOpen } = useModalCrud();
	return <AddButton text="Agregar Tenant" action={() => setCreateOpen(true)} />;
}
