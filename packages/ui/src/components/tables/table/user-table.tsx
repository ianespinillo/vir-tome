import { useModalCrud } from '@/contexts/modal-crud-context';
import { IUser, ROLES } from '@repo/common';
import { useUsers } from '@repo/hooks';
import React from 'react';
import { userColumns } from '../cells/users-columns';
import { PaginableTable } from './paginable-table';

interface Props {
	role: ROLES;
}
export const UsersTable = ({ role }: Readonly<Props>) => {
	const {
		hook: { getUsersByRole },
	} = useModalCrud<IUser, ReturnType<typeof useUsers>>();
	return (
		<div className="p-5">
			<PaginableTable columns={userColumns} query={getUsersByRole(role)} />
		</div>
	);
};
