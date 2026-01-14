import { CalendarPicker } from '@/components/calendar/calendar-picker';
import { FormField, FormItem, FormLabel, FormMessage } from '@/ui/form';
import { Label } from '@/ui/label';
import { ScrollArea } from '@/ui/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { TabsContent } from '@/ui/tabs';
import { CreateLoanDto } from '@repo/common';
import { set } from 'date-fns';
import { Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

const hours = Array.from({ length: 24 }, (_, i) => {
	const hour = i.toString().padStart(2, '0');
	return { value: `${hour}:00`, label: `${hour}:00` };
});
export const ReturnDetails = () => {
	const form = useFormContext<CreateLoanDto>();
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
	);
	const [selectedTime, setSelectedTime] = useState('14:00');
	useEffect(() => {
		if (selectedDate) {
			const [hours, minutes] = selectedTime.split(':').map(Number);
			const combinedDateTime = set(selectedDate, { hours, minutes, seconds: 0 });
			form.setValue('returnDate', combinedDateTime);
		}
	}, [selectedDate, selectedTime, form]);
	return (
		<TabsContent value="return" className="space-y-6 mt-6">
			<FormField
				control={form.control}
				name="returnDate"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-base font-semibold">
							Fecha y Hora de Devolución
						</FormLabel>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-sm">Fecha de devolución</Label>
									<CalendarPicker value={selectedDate} onChange={setSelectedDate} />
								</div>
								<div className="space-y-2">
									<Label className="text-sm flex items-center gap-2">
										<Clock className="h-4 w-4" />
										Hora de devolución
									</Label>
									<Select value={selectedTime} onValueChange={setSelectedTime}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Seleccione hora" />
										</SelectTrigger>
										<SelectContent>
											<ScrollArea className="h-60">
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
							<div className="p-4 rounded-lg bg-muted/50 border">
								<p className="text-xs font-medium text-muted-foreground mb-2">
									Resumen de devolución
								</p>
								<div className="space-y-1">
									<p className="text-sm font-semibold">
										{selectedDate?.toLocaleDateString('es-AR', {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										})}
									</p>
									<p className="text-sm">a las {selectedTime} horas</p>
								</div>
							</div>
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
		</TabsContent>
	);
};
