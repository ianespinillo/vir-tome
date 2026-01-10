import { GenericHookProps, IPublisher } from '@repo/common';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PublisherService } from '../services/publisher.service';

export const usePublishers = ({ page, searchTerm }: GenericHookProps) => {
	const publishers = useQuery({
		queryKey: ['publishers', page, searchTerm],
		queryFn: async () =>
			(await PublisherService.getPublishers(page, searchTerm)).data,
		staleTime: 5000,
		placeholderData: keepPreviousData,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
	const allPublishers = useQuery({
		queryKey: ['publishers'],
		queryFn: async () => (await PublisherService.getAllPublishers()).data,
		staleTime: 5000,
		placeholderData: keepPreviousData,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
	return { publishers, allPublishers };
};
