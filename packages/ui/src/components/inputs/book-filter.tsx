import { booksContext } from '@/contexts/book.context';
import { Input } from '@/ui/input';
import { useBooks } from '@repo/hooks';
import React, { useContext } from 'react';

export const BookFilter = () => {
	const { searchTerm, setSearchTerm } = useContext(booksContext);
	return (
		<div>
			<Input
				placeholder="Buscar libro..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
			/>
		</div>
	);
};
