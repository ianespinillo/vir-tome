import { ROLES, ROLE_LEVEL, RoleNodes, RolesType } from '@repo/common';
import { ROLE_LABEL } from '../../../common/src/constants/role-label';

export function getRolesManagables(role?: ROLES): ROLES[] {
	if (!role) return [];
	const roleLevel = ROLE_LEVEL[role] || 0;
	return Object.values(ROLES).filter((r) => ROLE_LEVEL[r] < roleLevel);
}

export function getRolesLabel(roles: RolesType[]) {
	const labels: RoleNodes[] = [];
	roles.sort().forEach((r) => labels.push({ label: ROLE_LABEL[r], value: r }));
	return labels;
}
