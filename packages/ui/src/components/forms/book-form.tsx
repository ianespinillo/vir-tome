'use client';

import { booksContext } from '@/contexts/book.context';
import { cn } from '@/lib/utils';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/ui/card';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/ui/command';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { ScrollArea } from '@/ui/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { CreateBookDto } from '@repo/common';
import { useCategory, usePublishers } from '@repo/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, ChevronsUpDown } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'react-hot-toast';

interface BookFormProps {
	onSuccess: () => void;
	id?: number | string;
}

export function BookForm({ onSuccess, id }: Readonly<BookFormProps>) {
	const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
	const [open, setOpen] = useState(false);
	const { publishers } = usePublishers();
	const { allCategories } = useCategory();
	const { createBook, findBook, refetch, updateBook } = useContext(booksContext);
	// Definir el formulario con valores por defecto
	const form = useForm<CreateBookDto>({
		resolver: classValidatorResolver(CreateBookDto),
		defaultValues: {
			title: '',
			publicationYear: new Date().getFullYear(),
			availableQuantity: 1,
			publisherId: 0,
			categoryIds: [],
		},
		mode: 'onBlur',
	});
	console.log(form.formState);
	// efecto quee verifica si hay id y en dado caso, busca el libro y lo carga en el formulario
	useEffect(() => {
		if (id) {
			findBook.mutate(id, {
				onSuccess: (data) => {
					console.log(findBook.data);
					form.setValue('title', data.title);
					form.setValue('publicationYear', data.publicationYear);
					form.setValue('availableQuantity', data.availableQuantity);
					form.setValue('publisherId', data.publisherId);
					form.setValue('categoryIds', data.categoriesIds);
					setSelectedCategorias(data.categoriesIds);
				},
			});
		}
	}, [id, form.setValue, findBook]);

	// Función para manejar el envío del formulario
	function onSubmit(values: CreateBookDto) {
		if (id) {
			updateBook.mutate(
				{
					id: id as number,
					...values,
				},
				{
					onSuccess: () => {
						toast.success('Libro actualizado con exito');
						form.reset();
						refetch();
						onSuccess();
					},
					onError: (error) => {
						toast.error(error.message, {
							duration: 5000,
						});
					},
				},
			);
		} else {
			createBook.mutate(values, {
				onSuccess: () => {
					toast.success('Libro creado con exito');
					form.reset();
					refetch();
					onSuccess();
				},
				onError: (error) => {
					toast.error(error.message, {
						duration: 5000,
					});
				},
			});
		}
	}

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<Toaster position="top-right" />
			<CardHeader>
				<CardTitle>{id ? 'Editar' : 'Agregar Nuevo'} Libro</CardTitle>
				<CardDescription>
					Ingrese los detalles del libro para agregarlo al catálogo de la biblioteca.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="title"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel>Nombre del libro</FormLabel>
									<FormControl>
										<Input placeholder="Ingrese el título del libro" {...field} />
									</FormControl>
									<FormDescription>
										Ingrese el título completo del libro.
									</FormDescription>
									<AnimatePresence>
										{fieldState.error && (
											<motion.div
												initial={{ opacity: 0, y: -5 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												className="text-xs text-red-500 mt-1 flex items-center gap-1"
											>
												<AlertCircle className="h-3 w-3" />
												{form.formState.errors.title?.message}
											</motion.div>
										)}
									</AnimatePresence>
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormField
								control={form.control}
								name="publicationYear"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Año de publicación</FormLabel>
										<FormControl>
											<Input
												type="number"
												{...field}
												onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
											/>
										</FormControl>
										<FormDescription>Año en que se publicó el libro.</FormDescription>
										<AnimatePresence>
											{form.formState.errors.publicationYear && (
												<motion.div
													initial={{ opacity: 0, y: -5 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0 }}
													className="text-xs text-red-500 mt-1 flex items-center gap-1"
												>
													<AlertCircle className="h-3 w-3" />
													{form.formState.errors.publicationYear?.message}
												</motion.div>
											)}
										</AnimatePresence>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="availableQuantity"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Copias disponibles</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												{...field}
												onChange={(e) => {
													field.onChange(Number.parseInt(e.target.value));
												}}
											/>
										</FormControl>
										<FormDescription>Número de ejemplares disponibles.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="flex space-x-2">
							<FormField
								control={form.control}
								name="publisherId"
								render={({ field }) => (
									<FormItem className="basis-1/2">
										<FormLabel>Editorial</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(Number(value))}
											value={field.value?.toString()}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccione una editorial" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{publishers.data?.map((publisher) => (
													<SelectItem key={publisher.id} value={publisher.id.toString()}>
														{publisher.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>Editorial que publicó el libro.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

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
												<PopoverContent className="w-full p-0" align="start">
													<Command>
														<CommandInput placeholder="Buscar categoría..." />
														<CommandList>
															<CommandEmpty>No se encontraron categorías.</CommandEmpty>
															<CommandGroup>
																<ScrollArea className="h-72">
																	{allCategories.data?.map((category) => (
																		<CommandItem
																			key={category.id}
																			value={category.id.toString()}
																			onSelect={() => {
																				const isSelected = selectedCategorias.includes(category.id);
																				const newSelectedCategorias = isSelected
																					? selectedCategorias.filter(
																							(value) => value !== category.id,
																						)
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
																</ScrollArea>
															</CommandGroup>
														</CommandList>
													</Command>
												</PopoverContent>
											</Popover>
										</FormControl>
										<div className="flex flex-wrap gap-2 mt-2">
											{selectedCategorias.map((value) => {
												const categoria = allCategories.data?.find((c) => c.id === value);
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
						</div>
						<CardFooter className="flex justify-end px-0 pt-4">
							<Button type="submit" disabled={!form.formState.isValid}>
								{id ? 'Actualizar' : 'Crear'} Libro
							</Button>
						</CardFooter>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
