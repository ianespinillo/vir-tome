import { Roles } from '../auth/requests.types';

export interface MenuLinkBase {
	title: string;
	href: string;
	tooltip: string;
	roles: Roles[]; // 💡 acá definís quién puede verlo
}
