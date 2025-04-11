
export interface IBook {
    id: number;
    title: string;
    publicationYear: number;
    categories: string[];
    availableQuantity: number;
    publisher: string;
}

export interface ICategory {
    id: number;
    name: string;
    created_at: Date;
    updated_at: Date;
}