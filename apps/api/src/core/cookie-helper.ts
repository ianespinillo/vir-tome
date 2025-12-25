export function getCookieDomain() {
	const url = process.env.FRONTEND_URL;

	if (!url) return undefined;

	// localhost nunca acepta domain
	if (url.includes('localhost')) return undefined;

	// si viene con protocolo
	try {
		const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
		return `.${parsed.hostname}`;
	} catch {
		return `.${url}`;
	}
}
