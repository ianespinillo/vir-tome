'use client';
import { UserForm } from '@/components/forms/user-form';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Dialog, DialogContent, DialogTitle } from '@/ui/dialog';

import React from 'react';

export const CreateUserDialog = () => {
	const { createOpen, setCreateOpen } = useModalCrud();
	return (
		<Dialog open={createOpen} onOpenChange={setCreateOpen} modal>
			<DialogTitle hidden>Crear usuario</DialogTitle>
			<DialogContent className="p-0">
				<UserForm />
			</DialogContent>
		</Dialog>
	);
};
