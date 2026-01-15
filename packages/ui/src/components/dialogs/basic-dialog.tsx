import { useModalCrud } from '@/contexts/modal-crud-context';
import { Dialog, DialogContent, DialogTitle } from '@/ui/dialog';
import React, { ReactNode } from 'react';
import { TenantForm } from '../forms/tenant-form';
interface Props {
	title: string;
	children: ReactNode;
}
export const BasicDialog = ({ title, children }: Readonly<Props>) => {
	const { createOpen, setCreateOpen } = useModalCrud();
	return (
		<Dialog open={createOpen} onOpenChange={setCreateOpen} modal>
			<DialogContent className="p-0">
				<DialogTitle hidden>{title}</DialogTitle>
				{children}
			</DialogContent>
		</Dialog>
	);
};
