'use client';
import { useModalCrud } from '@/contexts/modal-crud-context';
import {
	getRolesLabel,
	getRolesManagables,
} from '@/helpers/get-roles-managable';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { ROLES as BASEROLES, IUser } from '@repo/common';
import { useAuth, useUsers } from '@repo/hooks';
import { parseAsInteger, useQueryState } from 'nuqs';
import React, { useState } from 'react';
import { userColumns } from '../cells/users-columns';
import { PaginableTable } from './paginable-table';

export const UsersTable = () => {
	const {
		hook: { getUsersByRole },
	} = useModalCrud<IUser, ReturnType<typeof useUsers>>();
	const [role, setRole] = useState<BASEROLES | undefined>(undefined);
	const [_, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
	const { session } = useAuth();
	return (
		<div className="p-5">
			<div className="flex justify-end py-2">
				<Select
					onValueChange={(value) => {
						if (value === 'ALL') {
							setRole(undefined);
						} else {
							setRole(value as BASEROLES);
						}
						setPage(1);
					}}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Filtrar por rol" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">Todos</SelectItem>
						{getRolesLabel(getRolesManagables(session.data?.data?.roleName)).map(
							(op) => (
								<SelectItem key={op.label} value={op.value}>
									{op.label}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
			</div>
			<PaginableTable columns={userColumns} query={getUsersByRole(role)} />
		</div>
	);
};
