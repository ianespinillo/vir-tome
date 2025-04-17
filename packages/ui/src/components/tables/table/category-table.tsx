import { Loading } from '@/components/spinners/loading';
import { ICategory } from '@repo/common';
import { useCategory } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import React, { useState } from 'react';
import { categoryColumn } from '../cells/category-columns';
import { GenericTable } from './generic-table';

export function CategoryTable() {
	const {
		categories: {
			data,
			fetchPreviousPage,
			fetchNextPage,
			hasNextPage,
			hasPreviousPage,
			isLoading,
			pageIndex,
		},
	} = useCategory();
	if (isLoading) return <Loading />;
	return (
		<GenericTable
			columns={categoryColumn as ColumnDef<unknown>[]}
			data={data?.data || []}
			isLoading={isLoading}
			fetchNextPage={fetchNextPage}
			fetchPreviousPage={fetchPreviousPage}
			currentPage={pageIndex}
			totalPages={data?.last_page || 0}
			isFetching={isLoading}
		/>
	);
}
