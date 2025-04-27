export interface IAuthPayload {
	sub: number;
	email: string;
}
export interface IAuthResponse {
	id: number;
	email: string;
	name: string;
	surname: string;
	roleId: number;
}
