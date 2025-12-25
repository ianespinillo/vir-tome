import { useModalCrud } from '@/contexts/modal-crud-context';
import { toTitleCase } from '@/helpers/to-title-case';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { ROLES as BASEROLES, IUser } from '@repo/common';
import { useUsers } from '@repo/hooks';
import { parseAsInteger, useQueryState } from 'nuqs';
import React, { useEffect, useState } from 'react';
import { userColumns } from '../cells/users-columns';
import { PaginableTable } from './paginable-table';

export const UsersTable = () => {
	const {
		hook: { getUsersByRole },
	} = useModalCrud<IUser, ReturnType<typeof useUsers>>();
	const [role, setRole] = useState<BASEROLES | undefined>(undefined);
	const [_, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
	useEffect(() => {
		// Reset to first page when role changes
	}, [role]);
	const ROLES = Object.values(BASEROLES).map((role) => {
		if (role === BASEROLES.SUPER_ADMIN) return null;
		return role;
	});
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
						{Object.values(ROLES).map((roleOption) => (
							<SelectItem key={roleOption as string} value={roleOption as string}>
								{toTitleCase(roleOption as string) || 'Todos'}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<PaginableTable columns={userColumns} query={getUsersByRole(role)} />
		</div>
	);
};
