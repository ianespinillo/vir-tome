'use client';
import { useLoanContext } from '@/contexts/loan-context';
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import {
	CreateLoanDto,
	ILoan,
	LoanBorrowerType,
	LoanQueriesDTO,
} from '@repo/common';
import { useLoans } from '@repo/hooks';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'sonner';
import { BookSelection } from './book-selection';
import { BorrowerType } from './borrower-type';
import { NotRegisteredUser } from './not-registered-user';
import { RegisteredUser } from './registered-user';
import { ReturnDetails } from './return-details';

export function LoanForm() {
	const { activeTab, borrowerType, setActiveTab } = useLoanContext();
	const {
		hook: { createLoan },
		setCreateOpen,
		setEntity,
		setDetailsOpen,
	} = useModalCrud<ILoan, LoanQueriesDTO, ReturnType<typeof useLoans>>();

	const form = useForm<CreateLoanDto>({
		defaultValues: {
			borrower_type: LoanBorrowerType.REGISTERED_USER,
			bookId: 0,
			quantity: 1,
			returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
		},
		resolver: classValidatorResolver(CreateLoanDto),
		mode: 'onChange',
	});

	const canProceedToDate =
		form.watch('bookId') > 0 &&
		(borrowerType === LoanBorrowerType.REGISTERED_USER
			? !!form.watch('user_id')
			: !!form.watch('borrower_name') &&
				!!form.watch('borrower_email') &&
				!!form.watch('borrower_national_id'));

	function onSubmit(values: CreateLoanDto) {
		if (
			borrowerType === LoanBorrowerType.EXTERNAL_BORROWER &&
			(!values.borrower_name ||
				!values.borrower_email ||
				!values.borrower_national_id)
		) {
			toast.error('Nombre, email y DNI son requeridos para invitados');
			return;
		}

		createLoan.mutate(values, {
			onSuccess: (data) => {
				toast.success('Préstamo creado con éxito');
				setEntity(data.data);
				setCreateOpen(false);
				setDetailsOpen(true);
			},
			onError: () => {
				toast.error('Error al crear el préstamo');
			},
		});
	}

	const onInvalid = (errors: any) => {
		console.error('Errores de validación:', errors);
		toast.error('Por favor revise los campos marcados en rojo');
	};

	return (
		<Card className="w-full max-w-3xl mx-auto shadow-lg border-border/50">
			<Toaster position="top-right" richColors />
			<CardHeader className="space-y-1 pb-4 border-b bg-muted/30">
				<CardTitle className="text-xl font-bold tracking-tight">
					Registrar Nuevo Préstamo
				</CardTitle>
				<CardDescription>
					Complete la información requerida para el préstamo
				</CardDescription>
			</CardHeader>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit, onInvalid)}
					className="space-y-6"
					id="loan-form"
				>
					<CardContent className="pt-6 px-6 pb-0">
						<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="details">
									<BookOpen className="h-4 w-4 mr-2" />
									Detalles del Préstamo
								</TabsTrigger>
								<TabsTrigger value="return" disabled={!canProceedToDate}>
									<CalendarIcon className="h-4 w-4 mr-2" />
									Fecha de Devolución
								</TabsTrigger>
							</TabsList>

							<TabsContent value="details" className="space-y-6 mt-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<BookSelection />
									<FormField
										control={form.control}
										name="quantity"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Cantidad</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														{...field}
														onChange={(e) =>
															field.onChange(Number.parseInt(e.target.value) || 0)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<BorrowerType />
								<AnimatePresence mode="wait">
									{borrowerType === LoanBorrowerType.REGISTERED_USER ? (
										<RegisteredUser key="reg" />
									) : (
										<NotRegisteredUser key="guest" />
									)}
								</AnimatePresence>

								<div className="flex justify-end pt-2">
									<Button
										type="button"
										onClick={() => setActiveTab('return')}
										disabled={!canProceedToDate}
									>
										Siguiente
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</div>
							</TabsContent>
							<TabsContent value="return">
								<ReturnDetails />
							</TabsContent>
						</Tabs>
					</CardContent>
					<CardFooter className="flex justify-between gap-3 px-6 py-4 border-t bg-muted/30">
						{activeTab === 'return' && (
							<Button
								type="button"
								variant="outline"
								onClick={() => setActiveTab('details')}
							>
								Anterior
							</Button>
						)}
						<div className="flex gap-3 ml-auto">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									form.reset();
									setCreateOpen(false);
								}}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={activeTab !== 'return'}>
								Crear Préstamo
							</Button>
						</div>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
