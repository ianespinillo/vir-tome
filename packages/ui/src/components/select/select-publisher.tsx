import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { IPublisher } from '@repo/common';
import { useDebounceValue, usePublishers } from '@repo/hooks';
import { Loader2, Search } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export const SelectPublisher = () => {
	const form = useFormContext();
	const [page, setPage] = useState(1);
	const [allPublishers, setAllPublishers] = useState<IPublisher[]>([]);
	const [selectedPublisher, setSelectedPublisher] = useState<IPublisher | null>(
		null,
	);
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const debounce = useDebounceValue(searchQuery, 800);
	const { publishers } = usePublishers({ page, searchTerm: debounce });
	const { isLoading } = publishers;
	const observerTarget = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	// Resetear página cuando cambia el término de búsqueda
	useEffect(() => {
		setPage(1);
		setAllPublishers([]);
	}, [debounce]);

	// Agregar las editoriales nuevas cuando se cargan
	useEffect(() => {
		if (publishers.data?.data?.items) {
			setAllPublishers((prev) => {
				const newItems = publishers?.data?.data?.items ?? [];

				// Si es página 1, reemplazar todo pero incluir el seleccionado
				if (page === 1) {
					// Si hay un item seleccionado y no está en los resultados, agregarlo
					if (
						selectedPublisher &&
						!newItems.find((p) => p.id === selectedPublisher.id)
					) {
						return [selectedPublisher, ...newItems];
					}
					return newItems;
				}

				// Si es página > 1, agregar sin duplicados
				const existing = new Set(prev.map((p) => p.id));
				const filtered = newItems.filter(
					(item: IPublisher) => !existing.has(item.id),
				);
				return [...prev, ...filtered];
			});
		}
	}, [publishers.data, page, selectedPublisher]);

	// Intersection Observer para detectar cuando llegamos al final
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isLoading && open) {
					const hasMore =
						(publishers.data?.data?.meta?.last_page ?? 0) >
						(publishers.data?.data?.meta?.current_page ?? 0);
					if (hasMore) {
						setPage((prev) => prev + 1);
					}
				}
			},
			{
				threshold: 0.1,
				root: null, // Usar el viewport en lugar del root
			},
		);

		const currentTarget = observerTarget.current;
		if (currentTarget && open) {
			observer.observe(currentTarget);
		}

		return () => {
			if (currentTarget) {
				observer.unobserve(currentTarget);
			}
		};
	}, [isLoading, publishers.data, open]);

	// Reset cuando se cierra el select
	useEffect(() => {
		if (!open) {
			setPage(1);
			setAllPublishers([]);
			setSearchQuery('');
		}
	}, [open]);

	return (
		<FormField
			control={form.control}
			name="publisherId"
			render={({ field }) => (
				<FormItem className="basis-1/2">
					<FormLabel>Editorial</FormLabel>
					<Select
						open={open}
						onOpenChange={setOpen}
						onValueChange={(value) => {
							const publisherId = Number(value);
							const publisher = allPublishers.find((p) => p.id === publisherId);
							if (publisher) {
								setSelectedPublisher(publisher);
							}
							field.onChange(publisherId);
						}}
						value={field.value?.toString()}
					>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Seleccione una editorial" />
							</SelectTrigger>
						</FormControl>
						<SelectContent
							ref={scrollRef}
							className="p-0 overflow-hidden max-w-[400px]"
						>
							{/* Input de búsqueda - FIJO */}
							<div className="sticky top-0 left-0 right-0 z-10 bg-popover border-b px-3 py-2 flex items-center -mx-1">
								<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
								<Input
									placeholder="Buscar editorial..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-8 w-full border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
									onClick={(e) => e.stopPropagation()}
									onKeyDown={(e) => e.stopPropagation()}
								/>
							</div>

							{/* Contenedor scrolleable */}
							<div className="max-h-[300px] overflow-y-auto">
								{/* Lista de editoriales */}
								{allPublishers.length > 0 ? (
									allPublishers.map((publisher) => (
										<SelectItem
											key={publisher.id}
											value={publisher.id.toString()}
											className="truncate"
										>
											<span className="truncate block">{publisher.name}</span>
										</SelectItem>
									))
								) : !isLoading && debounce ? (
									<div className="py-6 text-center text-sm text-muted-foreground">
										No se encontraron editoriales
									</div>
								) : null}

								{/* Elemento observador para infinite scroll */}
								<div ref={observerTarget} className="h-2" />

								{/* Indicador de carga */}
								{isLoading && (
									<div className="flex items-center justify-center py-3 px-2">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
										<span className="ml-2 text-sm text-muted-foreground">
											{page === 1 ? 'Buscando...' : 'Cargando más...'}
										</span>
									</div>
								)}
							</div>
						</SelectContent>
					</Select>
					<FormDescription>Editorial que publicó el libro.</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
