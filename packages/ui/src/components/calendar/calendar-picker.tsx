'use client';

import { format, setMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/ui/button';
import { Calendar } from '@/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';

interface Props {
	onChange: (date?: Date) => void;
	value?: Date;
}

export function CalendarPicker({ onChange, value }: Props) {
	const [date, setDate] = useState<Date | undefined>(new Date());
	const [isOpen, setIsOpen] = useState(false);
	const [currentMonth, setCurrentMonth] = React.useState(new Date());

	useEffect(() => {
		setCurrentMonth(value || new Date());
		setDate(value || new Date());
	}, [value]);

	const handleDateChange = (newDate?: Date) => {
		onChange(newDate);
		setDate(newDate);
		if (newDate) {
			setCurrentMonth(newDate);
		}
		setIsOpen(false);
	};

	const handleMonthChange = (month: string) => {
		setCurrentMonth(setMonth(currentMonth, Number.parseInt(month)));
	};

	const handleYearChange = (year: string) => {
		setCurrentMonth(setYear(currentMonth, Number.parseInt(year)));
	};

	const monthNames = [
		'Enero',
		'Febrero',
		'Marzo',
		'Abril',
		'Mayo',
		'Junio',
		'Julio',
		'Agosto',
		'Septiembre',
		'Octubre',
		'Noviembre',
		'Diciembre',
	];

	const years = Array.from(
		{ length: 90 },
		(_, i) => new Date().getFullYear() - i,
	);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="w-full justify-start text-left font-normal"
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? (
						format(date, 'PPP', { locale: es })
					) : (
						<span>Seleccionar fecha</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="center">
				<div className="flex items-center justify-between space-x-2 p-3">
					<Select
						value={currentMonth.getMonth().toString()}
						onValueChange={handleMonthChange}
					>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Mes" />
						</SelectTrigger>
						<SelectContent>
							{monthNames.map((month, index) => (
								<SelectItem key={month} value={index.toString()}>
									{month}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={currentMonth.getFullYear().toString()}
						onValueChange={handleYearChange}
					>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Año" />
						</SelectTrigger>
						<SelectContent>
							{years.map((year) => (
								<SelectItem key={year} value={year.toString()}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="p-3">
					<Calendar
						mode="single"
						selected={value}
						onSelect={handleDateChange}
						month={currentMonth}
						onMonthChange={setCurrentMonth}
						className="rounded-md border shadow"
						classNames={{
							day_today: 'bg-accent',
							day_selected: 'bg-accent',
						}}
						locale={es}
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}
