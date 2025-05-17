'use client';
import {
	BooksCount,
	LastLoansTable,
	LastReturnsTable,
	LoansCount,
	MostLoanedBooks,
} from '@repo/ui';
import React from 'react';

export default function DashPage() {
	return (
		<section className="h-screen flex flex-col p-5">
			<h1 className="text-5xl font-bold text-primary">Dashboard</h1>
			<span className="text-muted-foreground text-xl">
				Estas son las estadísticas de tu biblioteca
			</span>
			<div className="flex-1 p-3 space-y-3 overflow-auto">
				<div className="flex w-full h-full justify-around">
					<div className="flex flex-col gap-4 basis-1/2 h-full">
						<div className=" flex justify-around basis-1/2">
							<BooksCount />
							<LoansCount />
						</div>
						<div className="basis-1/2">
							<MostLoanedBooks />
						</div>
					</div>
					<div className="flex flex-col justify-around basis-1/2 h-full">
						<LastLoansTable />
						<LastReturnsTable />
					</div>
				</div>
			</div>
		</section>
	);
}
