import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import React from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface Option {
	label: string;
	value: string;
}
interface Props<T extends FieldValues> {
	control?: Control<T, any, T>;
	name: Path<T>;
	options: Option[];
	label: string;
	selectPlaceholder: string;
}

export const FormSelect = <T extends FieldValues>({
	control,
	name,
	options,
	label,
	selectPlaceholder,
}: Props<T>) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder={selectPlaceholder} />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{options.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
