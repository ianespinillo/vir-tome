import { useAnalytics } from '@repo/hooks';
import { BookOpen } from 'lucide-react';
import { useEffect } from 'react';
import { GenericCountCard } from './generic-count';

export const BooksCount = () => {
	const { countBooks } = useAnalytics();

	useEffect(() => {
		countBooks.mutate();
	}, [countBooks]);

	if (!countBooks.data) return null;

	return (
		<GenericCountCard
			title="Total Libros"
			value={countBooks.data}
			icon={<BookOpen className="h-10 w-10" />}
			color="indigo"
		/>
	);
};
