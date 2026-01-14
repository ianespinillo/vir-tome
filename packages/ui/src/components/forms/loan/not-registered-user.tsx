import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { CreateLoanDto } from '@repo/common';
import { motion } from 'framer-motion';
import React from 'react';
import { useFormContext } from 'react-hook-form';

export const NotRegisteredUser = () => {
	const form = useFormContext<CreateLoanDto>();
	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			exit={{ opacity: 0, height: 0 }}
			transition={{ duration: 0.2 }}
			className="space-y-4"
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="borrower_name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre Completo</FormLabel>
							<FormControl>
								<Input placeholder="Nombre completo" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="borrower_national_id"
					render={({ field }) => (
						<FormItem>
							<FormLabel>DNI</FormLabel>
							<FormControl>
								<Input placeholder="Número de DNI" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="borrower_email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input type="email" placeholder="email@ejemplo.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="borrower_phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Teléfono (opcional)</FormLabel>
							<FormControl>
								<Input placeholder="Número de teléfono" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</motion.div>
	);
};
