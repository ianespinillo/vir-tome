import { BookService } from '@/book/services/book.service';
import { IAuthUser } from '@/core/core.types';
import { LoanService } from '@/loan/loan.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MostLoanedBooks, ROLES } from '@repo/common';
@Injectable()
export class AnalyticsService {
	constructor(
		private readonly bookService: BookService,
		private readonly loanService: LoanService,
	) {}

	async getMostLoanedBooks(limit: number, user: IAuthUser) {
		let data: MostLoanedBooks[];
		switch (user.roleName) {
			case ROLES.SUPER_ADMIN:
				return await this.loanService.mostLoanedBooks(limit);

			case ROLES.ADMIN:
				return await this.loanService.mostLoanedBooks(limit, user.tenantId);

			case ROLES.LIBRARIAN:
				return this.loanService.mostLoanedBooks(limit, user.tenantId);
			default:
				throw new UnauthorizedException('Role level without permissions');
		}
	}
	async getLastLoans(user: IAuthUser) {
		switch (user.roleName) {
			case ROLES.SUPER_ADMIN:
				return this.loanService.lastsLoans();
			case ROLES.ADMIN:
				return this.loanService.lastsLoans(user.tenantId);
			case ROLES.LIBRARIAN:
				return this.loanService.lastsLoans(user.tenantId);
			default:
				throw new UnauthorizedException('Role level without permissions');
		}
	}
	async countBooks(user: IAuthUser) {
		switch (user.roleName) {
			case ROLES.SUPER_ADMIN:
				return this.bookService.globalBooksCount();
			case ROLES.ADMIN:
				return this.bookService.count(user.tenantId);
			case ROLES.LIBRARIAN:
				return this.bookService.count(user.tenantId);
			default:
				throw new UnauthorizedException('Role level without permissions');
		}
	}
	async countLoans(user: IAuthUser) {
		switch (user.roleName) {
			case ROLES.SUPER_ADMIN:
				return this.loanService.countLoans();
			case ROLES.ADMIN:
				return this.loanService.countLoans(user.tenantId);
			case ROLES.LIBRARIAN:
				return this.loanService.countLoans(user.tenantId);
			default:
				throw new UnauthorizedException('Role level without permissions');
		}
	}
	async getLastReturns(user: IAuthUser) {
		switch (user.roleName) {
			case ROLES.SUPER_ADMIN:
				return this.loanService.getLastReturnedLoans();
			case ROLES.ADMIN:
				return this.loanService.lastsLoans(user.tenantId);
			case ROLES.LIBRARIAN:
				return this.loanService.lastsLoans(user.tenantId);
			default:
				throw new UnauthorizedException('Role level without permissions');
		}
	}
}
