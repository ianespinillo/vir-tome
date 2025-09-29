import { BookService } from '@/book/services/book.service';
import { LoanService } from '@/loan/loan.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class AnalyticsService {
	constructor(
		private readonly bookService: BookService,
		private readonly loanService: LoanService,
	) {}

	async getMostLoanedBooks(limit: number, tenantId: number) {
		const data = await this.loanService.mostLoanedBooks(limit, tenantId);
		return data.map((book) => ({
			...book,
			count: Number(book.count),
		}));
	}
	async getLastLoans(tenantId: number) {
		return this.loanService.lastsLoans(tenantId);
	}
	async countBooks() {
		const count = await this.bookService.count();
		return { count };
	}
	async countLoans(tenantId: number) {
		return this.loanService.countLoans(tenantId);
	}
	async getLastReturns(tenantId: number) {
		return this.loanService.getLastReturnedLoans(tenantId);
	}
}
