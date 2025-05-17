import { BookService } from '@/book/services/book.service';
import { LoanService } from '@/loan/loan.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class AnalyticsService {
	constructor(
		private readonly bookService: BookService,
		private readonly loanService: LoanService,
	) {}

	async getMostLoanedBooks(limit: number) {
		const data = await this.loanService.mostLoanedBooks(limit);
		return data.map((book) => ({
			...book,
			count: Number(book.count),
		}));
	}
	async getLastLoans() {
		return this.loanService.lastsLoans();
	}
	async countBooks() {
		return this.bookService.count();
	}
	async countLoans() {
		return this.loanService.count();
	}
	async getLastReturns() {
		return this.loanService.getLastReturnedLoans();
	}
}
