'use client';
import { IUser } from '@repo/common';
import { useUsers } from '@repo/hooks';
import {
	AddButton,
	CreateUserDialog,
	InputFilter,
	ModalCrudProvider,
	Toaster,
	UserDetailsDialog,
	UsersTable,
	useModalCrud,
} from '@repo/ui';
import React from 'react';
export default function MyUsersPage() {
	return (
		<ModalCrudProvider<IUser, ReturnType<typeof useUsers>> useHook={useUsers}>
			<Toaster richColors position="top-right" />
			<div className="flex flex-col gap-6 p-6 h-full w-full">
				<div className="flex justify-end p-2 gap-2">
					<InputFilter text="Buscar usuario por nombre o mail" />
					<Button />
				</div>
				<div className="w-full">
					<UsersTable />
				</div>
			</div>
			<CreateUserDialog />
			<UserDetailsDialog />
		</ModalCrudProvider>
	);
}

function Button() {
	const { setCreateOpen } = useModalCrud();
	return <AddButton text="Agregar usuario" action={() => setCreateOpen(true)} />;
}
