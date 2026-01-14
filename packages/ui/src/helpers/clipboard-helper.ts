export const copyId = async (id: number) => {
	if (!navigator?.clipboard) return;
	await navigator.clipboard.writeText(id.toString());
};
