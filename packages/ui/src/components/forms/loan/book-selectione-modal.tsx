import { cn } from '@/lib/utils';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/ui/dialog';
import { Input } from '@/ui/input';
import { ScrollArea } from '@/ui/scroll-area';
import type { IBook } from '@repo/common';
import { useBooks } from '@repo/hooks';
import { BookOpen, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BookSelectionModalProps {
	selectedBook?: IBook | null;
	onSelectBook: (book: IBook) => void;
	trigger?: React.ReactNode;
}

export function BookSelectionModal({
	selectedBook,
	onSelectBook,
	trigger,
}: Readonly<BookSelectionModalProps>) {
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [accumulatedBooks, setAccumulatedBooks] = useState<IBook[]>([]);

	const scrollRef = useRef<HTMLDivElement>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const { books } = useBooks({ searchTerm: debouncedSearch, page: currentPage });

	// Debounce search input
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchTerm);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		setCurrentPage(1);
		setAccumulatedBooks([]);
	}, [debouncedSearch]);

	useEffect(() => {
		if (books.data?.data?.items) {
			setAccumulatedBooks((prev) => {
				// If page is 1, reset the list
				if (currentPage === 1) {
					return books.data?.data?.items || [];
				}
				// Otherwise append new items, avoiding duplicates
				const existingIds = new Set(prev.map((b) => b.id));
				const newBooks =
					books.data?.data?.items?.filter((b) => !existingIds.has(b.id)) || [];
				return [...prev, ...newBooks];
			});
		}
	}, [books.data, currentPage]);

	const hasMore = books.data
		? currentPage < (books.data?.data?.meta?.last_page ?? 0)
		: false;
	const isLoading = books.isLoading || books.isFetching;

	const loadMore = useCallback(() => {
		if (!isLoading && hasMore) {
			setCurrentPage((prev) => prev + 1);
		}
	}, [isLoading, hasMore]);

	// Infinite scroll observer
	useEffect(() => {
		if (!sentinelRef.current) return;

		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && hasMore && !isLoading) {
					loadMore();
				}
			},
			{ threshold: 0.1 },
		);

		observerRef.current.observe(sentinelRef.current);

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [hasMore, isLoading, loadMore]);

	const handleSelectBook = useCallback(
		(book: IBook) => {
			onSelectBook(book);
			setOpen(false);
			setSearchTerm('');
		},
		[onSelectBook],
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button
						variant="outline"
						className={cn(
							'w-full justify-between',
							!selectedBook && 'text-muted-foreground',
						)}
					>
						<span className="truncate">
							{selectedBook ? selectedBook.title : 'Seleccione un libro'}
						</span>
						<BookOpen className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Seleccionar Libro</DialogTitle>
					<DialogDescription>
						Busca y selecciona un libro de la biblioteca
					</DialogDescription>
				</DialogHeader>

				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Buscar por título o autor..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>

				<ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
					{accumulatedBooks.length === 0 && !isLoading && (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
							<p className="text-sm text-muted-foreground">No se encontraron libros</p>
						</div>
					)}

					<div className="space-y-2">
						{accumulatedBooks.map((book) => (
							<button
								key={book.id}
								type="button"
								onClick={() => handleSelectBook(book)}
								className={cn(
									'w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent',
									selectedBook?.id === book.id && 'border-primary bg-accent',
								)}
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 space-y-1">
										<h4 className="font-medium leading-none">{book.title}</h4>
										<p className="text-sm text-muted-foreground">{book.publisher.name}</p>
									</div>
									<Badge variant="secondary" className="shrink-0">
										{book.id}
									</Badge>
								</div>
							</button>
						))}

						{/* Infinite scroll sentinel */}
						<div ref={sentinelRef} className="h-4" />

						{isLoading && (
							<div className="flex items-center justify-center py-4">
								<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							</div>
						)}
					</div>
				</ScrollArea>

				{selectedBook && (
					<div className="rounded-lg border bg-muted/50 p-4">
						<p className="mb-2 text-xs font-medium text-muted-foreground">
							Libro seleccionado:
						</p>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
								<BookOpen className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1">
								<p className="font-medium leading-none">{selectedBook.title}</p>
								<p className="mt-1 text-sm text-muted-foreground">
									{selectedBook.publisher.id}
								</p>
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
