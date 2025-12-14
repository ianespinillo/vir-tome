import { Card, CardDescription, CardTitle } from '@/ui/card';
import { useUsers } from '@repo/hooks';
import React from 'react';
import { LastUsers as LastUsersColumns } from '../cells/last-users';
import { SimpleTable } from './simple-table';

export const LastUsersTable = () => {
	const { getLastRegisters } = useUsers({ page: 1 });
	return (
		<Card className="p-4 rounded-lg h-full min-h-[500px]">
			<CardTitle className="py-1">Ultimos registros</CardTitle>
			<CardDescription className="py-1.5">
				Tabla informativa con los ultimos registros del sistema
			</CardDescription>
			<SimpleTable columns={LastUsersColumns} query={getLastRegisters} />
		</Card>
	);
};
