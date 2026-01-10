import {
	GenericHookProps,
	IApiResponse,
	ICategory,
	IPaginatedResponse,
} from '@repo/common';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {} from 'react';
import { CategoryService } from '../services/categories.service';

export const useCategory = ({ page, searchTerm }: GenericHookProps) => {
	const categories = useQuery<
		IApiResponse<IPaginatedResponse<ICategory>>,
		IApiResponse<Error>
	>({
		queryKey: ['categories', page],
		queryFn: async () =>
			(await CategoryService.getCategories(page, searchTerm)).data,
		placeholderData: keepPreviousData,
		staleTime: 5000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
	const allCategories = useQuery({
		queryKey: ['categories'],
		queryFn: async () => (await CategoryService.getAllCategories()).data,
		placeholderData: keepPreviousData,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	return {
		categories,
		// allCategories,
	};
};
