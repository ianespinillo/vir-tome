import { useInfiniteQuery } from "@tanstack/react-query"

export const useCategory = () => {
    const categories = useInfiniteQuery({
        queryKey: ['categories'],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await fetch(process.env.API_URL + `/categories?page=${pageParam}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Error fetching categories');
            }
            const data = await response.json();
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, pages) => lastPage.nextCursor
    })
    return {
        categories,
    }
}