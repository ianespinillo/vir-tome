import { useLoanContext } from '@/contexts/loan-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/ui/command';
import { FormField, FormItem, FormLabel, FormMessage } from '@/ui/form';
import { Input } from '@/ui/input';
import { ScrollArea } from '@/ui/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { IUser, ROLES } from '@repo/common';
import { useUsers } from '@repo/hooks';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { CreateLoanDto } from 'packages/common/dist';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

export const RegisteredUser = () => {
	const form = useFormContext<CreateLoanDto>();
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const { selectedUser, setSelectedUser } = useLoanContext();
	const [currentPage, setCurrentPage] = useState(1);
	const [pageInput, setPageInput] = useState('1');
	const [allUsers, setAllUsers] = useState<IUser[]>([]);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(false);

	const { getUsersByRole } = useUsers({ page: currentPage, searchTerm });
	const [studentsResponse, teachersResponse] = [
		getUsersByRole(ROLES.STUDENT).data?.data,
		getUsersByRole(ROLES.TEACHER).data?.data,
	];

	// Fetch and merge users for current page
	useEffect(() => {
		const fetchUsers = async () => {
			if (!open) return;

			setIsLoading(true);
			try {
				const mergedUsers: IUser[] = [
					...(studentsResponse?.items || []),
					...(teachersResponse?.items || []),
				];

				// Remove duplicates
				const uniqueUsers = mergedUsers.filter(
					(user, index, self) => self.findIndex((u) => u.id === user.id) === index,
				);

				setAllUsers(uniqueUsers);

				// Calculate total pages based on the max of both responses
				const maxPages = Math.max(
					studentsResponse?.meta?.last_page || 1,
					teachersResponse?.meta?.last_page || 1,
				);
				setTotalPages(maxPages);
			} catch (error) {
				console.error('[v0] Error fetching users:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUsers();
	}, [open, currentPage, searchTerm]);

	const handleSelectUser = (user: IUser) => {
		setSelectedUser(user);
		form.setValue('user_id', user.id);
		setOpen(false);
	};

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
			setPageInput(page.toString());
		}
	};

	const handlePageInputChange = (value: string) => {
		setPageInput(value);
		const pageNum = Number.parseInt(value);
		if (!Number.isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
			setCurrentPage(pageNum);
		}
	};

	const getUserInitials = (user: IUser) => {
		return `${user.name?.[0] || ''}${user.surname?.[0] || ''}`.toUpperCase();
	};

	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			exit={{ opacity: 0, height: 0 }}
			transition={{ duration: 0.2 }}
		>
			<FormField
				control={form.control}
				name="user_id"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Usuario</FormLabel>
						<div className="space-y-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(true)}
								className="w-full justify-start text-left font-normal"
							>
								<Search className="mr-2 h-4 w-4" />
								{selectedUser
									? `${selectedUser.name} ${selectedUser.surname}`
									: 'Seleccione un usuario'}
							</Button>

							{/* Selected user detail card */}
							{selectedUser && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2 }}
								>
									<Card>
										<CardContent className="pt-6">
											<div className="flex items-center gap-4">
												<Avatar>
													<AvatarImage
														src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name} ${selectedUser.surname}`}
													/>
													<AvatarFallback>{getUserInitials(selectedUser)}</AvatarFallback>
												</Avatar>
												<div className="flex-1 min-w-0">
													<p className="font-medium text-sm truncate">
														{selectedUser.name} {selectedUser.surname}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														{selectedUser.email}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							)}
						</div>

						<CommandDialog open={open} onOpenChange={setOpen}>
							<CommandInput
								placeholder="Buscar usuario por nombre o email..."
								value={searchTerm}
								onValueChange={setSearchTerm}
							/>
							<CommandList>
								<CommandEmpty>No se encontraron usuarios.</CommandEmpty>
								<CommandGroup heading="Usuarios">
									{allUsers.map((user) => (
										<CommandItem
											key={user.id}
											value={`${user.name} ${user.surname} ${user.email}`}
											onSelect={() => handleSelectUser(user)}
											className="flex items-center gap-3 py-3"
										>
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name} ${user.surname}`}
												/>
												<AvatarFallback className="text-xs">
													{getUserInitials(user)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{user.name} {user.surname}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{user.email}
												</p>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>

							{/* Pagination Controls */}
							<div className="flex items-center justify-between gap-2 border-t p-4">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1 || isLoading}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>

								<div className="flex items-center gap-2">
									<Input
										type="number"
										min={1}
										max={totalPages}
										value={pageInput}
										onChange={(e) => handlePageInputChange(e.target.value)}
										className="w-16 h-8 text-center text-sm"
										disabled={isLoading}
									/>
									<span className="text-sm text-muted-foreground">de {totalPages}</span>
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages || isLoading}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</CommandDialog>

						<FormMessage />
					</FormItem>
				)}
			/>
		</motion.div>
	);
};
