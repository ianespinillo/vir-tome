'use client';

import { IUser, ROLES } from '@repo/common';
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
import React, { useEffect, useState } from 'react';

export default function AdminsPage() {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);

	return (
		isClient && (
			<ModalCrudProvider<IUser, ReturnType<typeof useUsers>> useHook={useUsers}>
				<Toaster richColors position="top-right" />
				<div className="flex flex-col gap-6 p-6 h-full w-full">
					<div className="flex justify-end p-2 gap-2">
						<InputFilter text="Buscar admin por nombre o mail" />
						<Button />
					</div>
					<div className="w-full">
						<UsersTable role={ROLES.ADMIN} />
					</div>
				</div>
				<CreateUserDialog role={ROLES.ADMIN} />
				<UserDetailsDialog />
			</ModalCrudProvider>
		)
	);
}

function Button() {
	const { setCreateOpen } = useModalCrud();
	return (
		<AddButton text="Agregar administrador" action={() => setCreateOpen(true)} />
	);
}
