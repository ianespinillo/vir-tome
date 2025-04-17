import { IPublisherResponse } from '@repo/common';
import { useQuery } from '@tanstack/react-query';

export const usePublishers = () => {
	const publishers = useQuery({
		queryKey: ['publishers'],
		queryFn: () =>
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/publisher`).then(
				(res) => res.json() as Promise<IPublisherResponse[]>,
			),
		staleTime: 5000,
	});
	return { publishers };
};
