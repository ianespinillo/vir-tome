import { ROLES } from "../../enum/roles.enum";
import { IQueriesDto } from "../common/api-queries.type";
import { IUser } from "../entities/user.type";

// interfaces/users-queries.interface.ts
export interface IUsersQueries extends IQueriesDto<IUser> {
	// Filtros por datos personales
	email?: string;
	emailDomain?: string;
	name?: string;
	surname?: string;

	// Filtros por tenant
	tenantId?: number;
	tenantIds?: number[];
	hasMultipleTenants?: boolean;

	// Filtros por rol
	roleId?: number;
	roleIds?: number[];
	roleName?: ROLES;

	// Filtros por actividad de login
	lastLoginAfter?: Date;
	lastLoginBefore?: Date;
	hasNeverLoggedIn?: boolean;

	// Filtros por préstamos
	hasLoans?: boolean;
	hasActiveLoans?: boolean;
	hasOverdueLoans?: boolean;
	minLoansCount?: number;
	maxLoansCount?: number;

	// Filtros booleanos útiles
	onlyRecent?: boolean; // Últimos registrados
	recentDays?: number; // Cantidad de días para considerar "reciente"
}