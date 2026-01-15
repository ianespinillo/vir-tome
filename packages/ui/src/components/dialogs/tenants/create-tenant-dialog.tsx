'use client';
import { TenantForm } from '@/components/forms/tenant-form';
import { BasicDialog } from '../basic-dialog';

export const CreateTenantDialog = () => {
	return (
		<BasicDialog title="Crear cliente">
			<TenantForm />
		</BasicDialog>
	);
};
