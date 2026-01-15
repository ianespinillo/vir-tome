import 'reflect-metadata';

export { LoginForm } from './components/forms/login-form';
export { CategoryTable } from './components/tables/table/category-table';
export { DashSidebar } from './components/sidebars/dash-sidebar';
export { SidebarProvider } from './ui/sidebar';
export { BookForm } from './components/forms/book-form';
export { AddBook } from './components/dialogs/books/add-book';
export { BooksTable } from './components/tables/table/books-table';
export { LoansTable } from './components/tables/table/loans-table';
export { NewLoan } from './components/dialogs/loan/new-loan';
export { PersonalInfoForm } from './components/forms/personal-info';
export { PasswordChangeForm } from './components/forms/password-change';
export { ConfirmEmail } from './components/cards/confirm-email';
export { BooksCount } from './components/cards/books-count';
export { LoansCount } from './components/cards/loans-count';
export { LastLoansTable } from './components/tables/table/last-loans';
export { LastReturnsTable } from './components/tables/table/last-returns';
export { RecentTenantsTable } from './components/tables/table/recent-tenants-table';
export { OverviewChart } from './components/charts/overview-chart';
export { KpiGrid } from './components/kpi/kpi-grid';
export { TenantsTable } from './components/tables/table/tenants-table';
export { UsersTable } from './components/tables/table/user-table';
export { CreateTenantDialog } from './components/dialogs/tenants/create-tenant-dialog';
export { EditTenantDialog } from './components/dialogs/tenants/edit-tenant-dialog';
export { TenantDetailsDialog } from './components/dialogs/tenants/tenant-details-dialog';
export { CreateUserDialog } from './components/dialogs/users/create-user-dialog';
export { UserDetailsDialog } from './components/dialogs/users/user-details-dialog';
export { MostLoanedBooksTable } from './components/tables/table/most-loaned-books-table';
export { LastUsersTable } from './components/tables/table/last-users';
export { EditBook } from './components/dialogs/books/edit-book';
export { BookDetailDialog } from './components/dialogs/books/book-details';
export { LoanDetailsDialog } from './components/dialogs/loan/loan-details';
export { MyLoansTable } from './components/tables/table/my-loans-table';
export { RequestLoanDialog } from './components/dialogs/loan/request-loan';
export * from './ui/scroll-area';

// toaster
export { Toaster } from 'sonner';

// Modal context provider
export { ModalCrudProvider, useModalCrud } from './contexts/modal-crud-context';
export { UIConfigProvider, useUINav } from './contexts/navigation-context';
// charts
export { MostLoanedBooks } from './components/cards/most-loaned-books';

//landing
export { CTAButtons } from './components/buttons/cta-buttons';
export { FeatureCard } from './components/cards/feature-card';
export { NavigationMenu } from './components/menus/navigation-menu';
export { Logo } from './components/icons/logo';
export { StatCard } from './components/cards/stat-card';

// Shadcn
export { Button } from './ui/button';
export { AddButton } from './components/buttons/add-button';

//Lucide
export {
	Menu,
	BookOpen,
	Users,
	BarChart3,
	Shield,
	Clock,
	Smartphone,
	Play,
} from 'lucide-react';
// Input
export { InputFilter } from './components/inputs/input-filter';

export { NuqsAdapter } from 'nuqs/adapters/next/app';
