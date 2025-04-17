import { ICategory, IPaginatedResponse } from '@repo/common';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export const useCategory = () => {
	const [pageIndex, setPageIndex] = useState(1);
	const categories = useQuery<IPaginatedResponse<ICategory>, Error>({
		queryKey: ['categories', pageIndex],
		queryFn: () =>
			fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/categories?page=${pageIndex}`,
			).then((res) => res.json()),
		staleTime: 5000,
	});
	const allCategories = useQuery({
		queryKey: ['categories'],
		queryFn: () =>
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories?full=true`).then(
				(res) => res.json() as Promise<ICategory[]>,
			),
	});
	const fetchNextPage = async () => {
		if (
			categories.data &&
			categories.data.current_page < categories.data.last_page
		) {
			setPageIndex((prev) => prev + 1);
		}
	};

	const fetchPreviousPage = async () => {
		if (categories.data && categories.data.current_page > 1) {
			setPageIndex((prev) => prev - 1);
		}
	};
	return {
		categories: {
			...categories,
			fetchNextPage,
			fetchPreviousPage,
			hasNextPage:
				categories.data &&
				categories.data?.current_page < categories.data?.last_page,
			hasPreviousPage: categories.data && categories.data?.current_page > 1,
			pageIndex,
		},
		allCategories,
	};
};
