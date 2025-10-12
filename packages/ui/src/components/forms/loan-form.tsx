'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Calendar } from '@/ui/calendar';
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
import { CreateLoanDto, IBook } from '@repo/common';
import { useBooks, useLoans } from '@repo/hooks';
import { format, set } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, BookOpen, CalendarIcon, Clock } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'react-hot-toast';
import { CalendarPicker } from '../calendar/calendar-picker';

interface LoanFormProps {
	onSuccess: () => void;
	id?: number | string;
}

const hours = Array.from({ length: 24 }, (_, i) => {
	const hour = i.toString().padStart(2, '0');
	return { value: `${hour}:00`, label: `${hour}:00` };
});
export function LoanForm({ onSuccess, id }: Readonly<LoanFormProps>) {
	const [open, setOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
	);
	const [selectedTime, setSelectedTime] = useState('14:00'); // Default to 2:00 PM

	const {
		createLoan,
		loans: { refetch },
	} = useLoans();
	const { fullBooks } = useBooks();
	// Define form with default values
	const form = useForm<CreateLoanDto>({
		resolver: classValidatorResolver(CreateLoanDto),
		defaultValues: {
			bookId: 0,
			quantity: 1,
			returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default to 2 weeks from now
		},
		mode: 'onBlur',
	});
	useEffect(() => {
		if (selectedDate) {
			const [hours, minutes] = selectedTime.split(':').map(Number);
			const combinedDateTime = set(selectedDate, { hours, minutes, seconds: 0 });
			form.setValue('returnDate', combinedDateTime);
		}
	}, [selectedDate, selectedTime, form]);
	useEffect(() => {
		fullBooks.mutate();
	}, [fullBooks]);

	// Handle form submission
	function onSubmit(values: CreateLoanDto) {
		createLoan.mutate(values, {
			onSuccess: () => {
				toast.success('Préstamo creado con éxito');
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

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<Toaster position="top-right" />
			<CardHeader>
				<CardTitle>{id ? 'Editar' : 'Registrar Nuevo'} Préstamo</CardTitle>
				<CardDescription>
					Ingrese los detalles del préstamo para registrarlo en el sistema.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* <FormField
							control={form.control}
							name="borrowerName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nombre del solicitante</FormLabel>
									<FormControl>
										<Input placeholder="Ingrese el nombre completo" {...field} />
									</FormControl>
									<FormDescription>
										Nombre de la persona que solicita el préstamo.
									</FormDescription>
									{form.formState.errors.borrowerName && (
										<AnimatePresence>
											<motion.div
												initial={{ opacity: 0, y: -5 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												className="text-xs text-red-500 mt-1 flex items-center gap-1"
											>
												<AlertCircle className="h-3 w-3" />
												{form.formState.errors.borrowerName?.message}
											</motion.div>
										</AnimatePresence>
									)}
								</FormItem>
							)}
						/> */}

						<div className="flex space-x-2 items-center">
							<FormField
								control={form.control}
								name="bookId"
								render={({ field }) => (
									<FormItem className="basis-1/2">
										<FormLabel>Libro</FormLabel>
										<Popover open={open} onOpenChange={setOpen}>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant="outline"
														role="combobox"
														className={cn(
															'w-full justify-between',
															!field.value && 'text-muted-foreground',
														)}
													>
														<span className="mr-2 truncate max-w-24">
															{field.value
																? fullBooks.data?.find((book: IBook) => book.id === field.value)
																		?.title
																: 'Seleccione un libro'}
														</span>
														<BookOpen className="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-full p-0">
												<Command>
													<CommandInput placeholder="Buscar libro..." />
													<CommandList>
														<CommandEmpty>No se encontraron libros.</CommandEmpty>
														<CommandGroup>
															<ScrollArea className="h-72">
																{fullBooks.data?.map((book: IBook) => (
																	<CommandItem
																		key={book.id}
																		value={book.title}
																		onSelect={() => {
																			form.setValue('bookId', book.id);
																			setOpen(false);
																		}}
																	>
																		{book.title}
																	</CommandItem>
																))}
															</ScrollArea>
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										<FormDescription>Seleccione el libro a prestar.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="quantity"
								render={({ field }) => (
									<FormItem className="basis-1/2">
										<FormLabel>Cantidad</FormLabel>
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
										<FormDescription>Número de ejemplares a prestar.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="returnDate"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Fecha y hora de devolución</FormLabel>
									<div className="flex flex-col sm:flex-row gap-2">
										<div className="flex-1">
											<CalendarPicker value={selectedDate} onChange={setSelectedDate} />
										</div>
										<div className="w-full sm:w-[180px]">
											<Select
												value={selectedTime}
												onValueChange={(value) => {
													setSelectedTime(value);
												}}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Hora" />
												</SelectTrigger>
												<SelectContent>
													<ScrollArea className="h-72">
														{hours.map((hour) => (
															<SelectItem key={hour.value} value={hour.value}>
																{hour.label}
															</SelectItem>
														))}
													</ScrollArea>
												</SelectContent>
											</Select>
										</div>
									</div>
									<FormDescription>
										Fecha y hora en la que se debe devolver el libro.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
			</CardContent>
			<CardFooter className="flex justify-end px-6 pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						form.reset();
						onSuccess();
					}}
					className="mr-2"
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					onClick={form.handleSubmit(onSubmit)}
					disabled={!form.formState.isValid}
				>
					{id ? 'Actualizar' : 'Crear'} Préstamo
				</Button>
			</CardFooter>
		</Card>
	);
}
