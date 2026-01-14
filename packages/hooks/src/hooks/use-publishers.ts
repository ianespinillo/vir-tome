import { GenericHookProps, IPublisher } from '@repo/common';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
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
	const getPublisherById = useMutation({
		mutationKey: ['publisger'],
		mutationFn: async (id: number) =>
			(await PublisherService.getPublisher(id)).data,
	});
	return { publishers, getPublisherById };
};

export const useAllPublishers = () =>
	useQuery({
		queryKey: ['publishers'],
		queryFn: async () => (await PublisherService.getAllPublishers()).data,
		staleTime: 5000,
		placeholderData: keepPreviousData,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
