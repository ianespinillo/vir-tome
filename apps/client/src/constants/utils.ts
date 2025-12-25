export const protocol =
	process.env.NODE_ENV === 'production' ? 'https' : 'http';
export const rootDomain = process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3000';
