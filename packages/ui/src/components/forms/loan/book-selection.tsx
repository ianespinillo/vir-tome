import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { CreateLoanDto, IBook } from '@repo/common';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { BookSelectionModal } from './book-selection-modal';

export function BookSelection() {
	const form = useFormContext<CreateLoanDto>();
	const [selectedBook, setselectedBook] = useState<IBook | null>(null);

	return (
		<FormField
			control={form.control}
			name="bookId"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Seleccione un libro</FormLabel>
					<FormControl>
						<BookSelectionModal
							selectedBook={selectedBook}
							onSelectBook={(book) => {
								setselectedBook(book);
								field.onChange(book.id);
								form.setValue('bookId', book.id);
							}}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
