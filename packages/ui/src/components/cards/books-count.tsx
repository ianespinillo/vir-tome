'use client';
import { useAnalytics } from '@repo/hooks';
import { BookOpen } from 'lucide-react';
import { useEffect } from 'react';
import { GenericCountCard } from './generic-count';

export const BooksCount = () => {
	const { countBooks } = useAnalytics();

	useEffect(() => {
		countBooks.refetch();
	}, []);

	return (
		<GenericCountCard
			title="Total Libros"
			value={countBooks.data?.data ?? 0}
			icon={<BookOpen className="h-10 w-10" />}
			color="indigo"
		/>
	);
};
