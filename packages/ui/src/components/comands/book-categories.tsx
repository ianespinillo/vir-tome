import { cn } from '@/lib/utils';
import {
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/ui/command';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { ScrollArea } from '@/ui/scroll-area';
import { useCategory, useDebounceValue } from '@repo/hooks';

import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Command } from '@/ui/command';
import { ICategory } from '@repo/common';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export const BookCategories = () => {
	const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
	const [open, setOpen] = useState(false);

	const [page, setPage] = useState(1);
	const { categories } = useCategory({ page });
	const [categoriesList, setCategoriesList] = useState<ICategory[]>([]);
	const { isLoading, data } = categories;
	const form = useFormContext();
	const observerTarget = useRef<HTMLDivElement>(null);

	// Agregar las categorías nuevas cuando se cargan
	useEffect(() => {
		if (data?.data?.items) {
			setCategoriesList((prev) => {
				const newItems = categories?.data?.data?.items || [];
				const existing = new Set(prev.map((c) => c.id));
				const filtered = newItems.filter(
					(item: ICategory) => !existing.has(item.id),
				);
				console.log(newItems, existing, filtered);
				return [...prev, ...filtered];
			});
		}
	}, [data]);

	// Intersection Observer para detectar cuando llegamos al final
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isLoading) {
					const hasMore =
						(data?.data?.meta?.last_page ?? 0) >
						(data?.data?.meta?.current_page ?? 0);
					if (hasMore) {
						setPage((prev) => prev + 1);
					}
				}
			},
			{ threshold: 1 },
		);

		const currentTarget = observerTarget.current;
		if (currentTarget) {
			observer.observe(currentTarget);
		}

		return () => {
			if (currentTarget) {
				observer.unobserve(currentTarget);
			}
		};
	}, [isLoading, data]);

	// Reset cuando se cierra el popover
	useEffect(() => {
		if (!open) {
			setPage(1);
			// setCategoriesList([])
		}
	}, [open]);

	return (
		<FormField
			control={form.control}
			name="categoryIds"
			render={({ field }) => (
				<FormItem className="basis-1/2">
					<FormLabel>Categorías</FormLabel>
					<FormControl>
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									aria-expanded={open}
									className="w-full justify-between"
								>
									{selectedCategorias.length > 0
										? `${selectedCategorias.length} categorías seleccionadas`
										: 'Seleccione categorías'}
									<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-full p-0 basis-1/2" align="start">
								<Command>
									<CommandList>
										<CommandEmpty>No se encontraron categorías.</CommandEmpty>
										<CommandGroup>
											<ScrollArea className="h-full">
												{categoriesList.map((category) => (
													<CommandItem
														key={category.id}
														value={category.id.toString()}
														onSelect={() => {
															const isSelected = selectedCategorias.includes(category.id);
															const newSelectedCategorias = isSelected
																? selectedCategorias.filter((value) => value !== category.id)
																: [...selectedCategorias, category.id];

															setSelectedCategorias(newSelectedCategorias);
															form.setValue('categoryIds', newSelectedCategorias);
														}}
													>
														<Check
															className={cn(
																'mr-2 h-4 w-4',
																selectedCategorias.includes(category.id)
																	? 'opacity-100'
																	: 'opacity-0',
															)}
														/>
														{category.name}
													</CommandItem>
												))}

												{/* Elemento observador para infinite scroll */}
												<div ref={observerTarget} className="h-4" />

												{/* Indicador de carga */}
												{isLoading && (
													<div className="flex items-center justify-center py-4">
														<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
														<span className="ml-2 text-sm text-muted-foreground">
															Cargando más...
														</span>
													</div>
												)}
											</ScrollArea>
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</FormControl>
					<div className="flex flex-wrap gap-2 mt-2">
						{selectedCategorias.map((value) => {
							const categoria = categoriesList.find((c) => c.id === value);
							return (
								<Badge key={value} variant="secondary">
									{categoria?.name}
									<button
										type="button"
										className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
										onClick={() => {
											const newSelectedCategorias = selectedCategorias.filter(
												(v) => v !== value,
											);
											setSelectedCategorias(newSelectedCategorias);
											form.setValue('categoryIds', newSelectedCategorias);
										}}
									>
										×
									</button>
								</Badge>
							);
						})}
					</div>
					<FormDescription>
						Seleccione una o más categorías para el libro.
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
