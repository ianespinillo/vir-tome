import 'reflect-metadata';

export { AlertsPanel } from './components/cards/alert-card';
export { BooksCount } from './components/cards/books-count';
export { ConfirmEmail } from './components/cards/confirm-email';
export { LandingStatCard } from './components/cards/landing-stat-card';
export { LoansPanel } from './components/cards/last-loans-card';
export { LoansCount } from './components/cards/loans-count';
export { StatCard } from './components/cards/stat-card';
export { UpcomingCard } from './components/cards/upcoming-card';
export { OverviewChart } from './components/charts/overview-chart';
export { AddBook } from './components/dialogs/books/add-book';
export { BookDetailDialog } from './components/dialogs/books/book-details';
export { EditBook } from './components/dialogs/books/edit-book';
export { LoanDetailsDialog } from './components/dialogs/loan/loan-details';
export { NewLoan } from './components/dialogs/loan/new-loan';
export { RequestLoanDialog } from './components/dialogs/loan/request-loan';
export { CreateTenantDialog } from './components/dialogs/tenants/create-tenant-dialog';
export { EditTenantDialog } from './components/dialogs/tenants/edit-tenant-dialog';
export { TenantDetailsDialog } from './components/dialogs/tenants/tenant-details-dialog';
export { CreateUserDialog } from './components/dialogs/users/create-user-dialog';
export { UserDetailsDialog } from './components/dialogs/users/user-details-dialog';
export { BookForm } from './components/forms/book-form';
export { LoginForm } from './components/forms/login-form';
export { PasswordChangeForm } from './components/forms/password-change';
export { PersonalInfoForm } from './components/forms/personal-info';
export { KpiGrid } from './components/kpi/kpi-grid';
export { DemoSection } from './components/sections/demo-section';
export { DashSidebar } from './components/sidebars/dash-sidebar';
export { SpinnerWithText } from './components/spinners/spinner-with-text';
export { BooksTable } from './components/tables/table/books-table';
export { LastLoansTable } from './components/tables/table/last-loans';
export { LastReturnsTable } from './components/tables/table/last-returns';
export { LastUsersTable } from './components/tables/table/last-users';
export { LoansTable } from './components/tables/table/loans-table';
export { MostLoanedBooksTable } from './components/tables/table/most-loaned-books-table';
export { MyLoansTable } from './components/tables/table/my-loans-table';
export { RecentTenantsTable } from './components/tables/table/recent-tenants-table';
export { RequestTable } from './components/tables/table/requests-table';
export { TenantsTable } from './components/tables/table/tenants-table';
export { UsersTable } from './components/tables/table/user-table';
export * from './ui/scroll-area';
export { SidebarProvider } from './ui/sidebar';

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
export { Logo } from './components/icons/logo';
export { NavigationMenu } from './components/menus/navigation-menu';
// Shadcn
export { AddButton } from './components/buttons/add-button';
export { Button } from './ui/button';

//Lucide
export {
	AlertTriangle,
	BarChart3,
	BookOpen,
	CheckCircle,
	Clock,
	Menu,
	Play,
	Shield,
	Smartphone,
	Users,
} from 'lucide-react';
// Input
export { InputFilter } from './components/inputs/input-filter';

export { NuqsAdapter } from 'nuqs/adapters/next/app';
