import {
	IApiResponse,
	IGeneralLoginResponse,
	ILoginResponse,
	IMessageResponse,
	IRequestUser,
	ISignUpResponse,
	SignInDto,
	SignUpDto,
	UpdatePasswordDto,
	UpdatePersonalDataDto,
} from '@repo/common';
import axios from 'axios';

export class AuthService {
	private static readonly baseUrl =
		`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_API_URL}/auth`;

	public static async getSession() {
		return await axios.get<IApiResponse<IRequestUser>>(
			`${AuthService.baseUrl}/session`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async signOut() {
		return await axios.post(
			`${AuthService.baseUrl}/logout`,
			{},
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async refresh() {
		return await axios.post<IApiResponse<{ acces_token: string }>>(
			`${AuthService.baseUrl}/refresh`,
			{},
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async superAdminLogin(data: SignInDto) {
		return await axios.post<IApiResponse<ILoginResponse>>(
			`${AuthService.baseUrl}/admin-login`,
			data,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async signIn(data: SignInDto) {
		return await axios.post<IApiResponse<ILoginResponse>>(
			`${AuthService.baseUrl}/login`,
			data,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async updatePassword(data: UpdatePasswordDto) {
		return await axios.post<IApiResponse<IMessageResponse>>(
			`${AuthService.baseUrl}/update-password`,
			data,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async updateUser(data: UpdatePersonalDataDto) {
		return await axios.post<IApiResponse<IMessageResponse>>(
			`${AuthService.baseUrl}/update-user`,
			data,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async confirmEmail(token: string) {
		return await axios.post<IApiResponse<IMessageResponse>>(
			`${AuthService.baseUrl}/confirm-email`,
			{
				token,
			},
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async signUp(dto: SignUpDto) {
		return axios.post<IApiResponse<ISignUpResponse>>(
			`${AuthService.baseUrl}/register`,
			dto,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async generalLogin(dto: SignInDto) {
		return axios.post<IApiResponse<IGeneralLoginResponse>>(
			`${AuthService.baseUrl}/general-login`,
			dto,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async switchTenant(tenantId: number) {
		return await axios.post<IApiResponse<ILoginResponse>>(
			`${AuthService.baseUrl}/switch-tenant`,
			{ tenantId },
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
}
