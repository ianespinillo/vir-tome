'use client';

import { TenantForm } from '@/components/forms/tenant-form';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import React, { useState } from 'react';

export function EditTenantDialog() {
	const { editOpen, closeEdit, setEditOpen } = useModalCrud();

	return (
		<Dialog open={editOpen} onOpenChange={setEditOpen} modal>
			<DialogContent className="p-0">
				<DialogTrigger hidden>a</DialogTrigger>
				<DialogTitle hidden>Editar tenant</DialogTitle>
				<TenantForm onSuccess={() => closeEdit()} />
			</DialogContent>
		</Dialog>
	);
}
