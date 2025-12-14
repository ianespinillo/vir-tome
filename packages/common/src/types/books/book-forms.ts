export interface IBooKForm {
	id?: number;
	title: string;
	publicationYear: number;
	categoriesIds: number[];
	availableQuantity: number;
	publisherId: number;
}
