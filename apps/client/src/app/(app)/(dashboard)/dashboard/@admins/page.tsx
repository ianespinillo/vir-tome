'use client';
import {
	BooksCount,
	LastLoansTable,
	LastReturnsTable,
	LoansCount,
	MostLoanedBooks,
} from '@repo/ui';
import React from 'react';

export default function AdminsDashPage() {
	return (
		<section className="min-h-screen flex flex-col p-4 px-6 bg-background">
			<div className="mb-8 space-y-2">
				<h1 className="text-4xl md:text-5xl font-bold text-foreground">
					Dashboard
				</h1>
				<p className="text-muted-foreground text-lg md:text-xl">
					Estas son las estadísticas de tu biblioteca
				</p>
			</div>

			<div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 overflow-auto">
				{/* Columna izquierda */}
				<div className="flex flex-col gap-6">
					{/* Cards de conteo */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<BooksCount />
						<LoansCount />
					</div>

					{/* Libros más prestados */}
					<div className="flex-1 min-h-[300px]">
						<MostLoanedBooks />
					</div>
				</div>

				{/* Columna derecha */}
				<div className="flex flex-col gap-6">
					<div className="flex-1 min-h-[250px]">
						<LastLoansTable />
					</div>
					<div className="flex-1 min-h-[250px]">
						<LastReturnsTable />
					</div>
				</div>
			</div>
		</section>
	);
}
