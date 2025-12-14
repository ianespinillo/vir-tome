'use client';
import { TenantForm } from '@/components/forms/tenant-form';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/ui/dialog';
import React, { useState } from 'react';

export const CreateTenantDialog = () => {
	const { createOpen, setCreateOpen } = useModalCrud();
	return (
		<Dialog open={createOpen} onOpenChange={setCreateOpen} modal>
			<DialogContent className="p-0">
				<DialogTitle hidden>Crear cliente</DialogTitle>
				<TenantForm onSuccess={() => setCreateOpen(false)} />
			</DialogContent>
		</Dialog>
	);
};
