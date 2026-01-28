import { useModalCrud } from '@/contexts/modal-crud-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { BaseQueriesDto, ILoan, RequestLoanDTO } from '@repo/common';
import { useMyLoans } from '@repo/hooks';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'sonner';
import { BookSelection } from './book-selection';
import { ReturnDetails } from './return-details';

export const RequestLoan = () => {
	const {
		setCreateOpen,
		hook: { requestLoan },
		entity,
	} = useModalCrud<
		ILoan,
		BaseQueriesDto<ILoan>,
		ReturnType<typeof useMyLoans>
	>();
	const form = useForm<RequestLoanDTO>({
		defaultValues: {
			bookId: entity?.id || 0,
			quantity: entity?.quantity || 1,
			returnDate: new Date(),
		},
		resolver: classValidatorResolver(RequestLoanDTO),
	});
	const onSubmit = form.handleSubmit((v) => {
		toast.promise(requestLoan.mutateAsync(v), {
			error: 'Error creando la solicitud de prestamo',
			success: 'Solicitud de prestamo creada exitosamente',
		});
		setCreateOpen(false);
	});
	return (
		<Card className="w-full max-w-3xl mx-auto shadow-lg border-border/50">
			<Toaster position="top-right" richColors />
			<CardHeader className="space-y-1 pb-4 border-b bg-muted/30">
				<CardTitle className="text-xl font-bold tracking-tight">
					Nueva solicitud de prestamo
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-6 px-6 pb-0">
				<Form {...form}>
					<form className="space-y-6" onSubmit={onSubmit}>
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
						<div className="space-y-2">
							<ReturnDetails />
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
