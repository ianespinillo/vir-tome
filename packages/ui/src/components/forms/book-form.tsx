'use client';

import { useModalCrud } from '@/contexts/modal-crud-context';
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
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { BooksQueriesDto, CreateBookDto, IBook } from '@repo/common';
import { useBooks } from '@repo/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'react-hot-toast';
import { BookCategories } from '../comands/book-categories';
import { SelectPublisher } from '../select/select-publisher';

export function BookForm() {
	const {
		entity,
		hook: { createBook, updateBook },
		closeEdit,
		setCreateOpen,
	} = useModalCrud<IBook, BooksQueriesDto, ReturnType<typeof useBooks>>();
	if (!entity?.id) {
		closeEdit();
	}
	// Definir el formulario con valores por defecto
	const form = useForm<CreateBookDto>({
		resolver: classValidatorResolver(CreateBookDto),
		defaultValues: {
			title: entity?.title ?? '',
			publicationYear: entity?.publicationYear ?? new Date().getFullYear(),
			availableQuantity: entity?.availableQuantity ?? 1,
			publisherId: entity?.publisher.id ?? 0,
			categoryIds: entity?.categories.flatMap((cat) => cat.id) ?? [],
		},
		mode: 'onBlur',
	});

	// Función para manejar el envío del formulario
	function onSubmit(values: CreateBookDto) {
		if (entity?.id) {
			updateBook.mutate(
				{
					id: entity.id,
					...values,
				},
				{
					onSuccess: () => {
						toast.success('Libro actualizado con exito');
						form.reset();
						closeEdit();
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
					setCreateOpen(false);
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
				<CardTitle>{entity?.id ? 'Editar' : 'Agregar Nuevo'} Libro</CardTitle>
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
							<SelectPublisher />
							<BookCategories />
						</div>
						<CardFooter className="flex justify-end px-0 pt-4">
							<Button type="submit" disabled={!form.formState.isValid}>
								{entity?.id ? 'Actualizar' : 'Crear'} Libro
							</Button>
						</CardFooter>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
