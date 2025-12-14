'use client';
import { IGeneric } from '@repo/common';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import {
	Dispatch,
	ReactNode,
	SetStateAction,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';

export interface GenericHookProps {
	searchTerm?: string;
	page: number;
}

interface ModalCrudContextValue<T, K> {
	entity: T | null;
	createOpen: boolean;
	editOpen: boolean;
	detailsOpen: boolean;

	setEditOpen: Dispatch<SetStateAction<boolean>>;
	setCreateOpen: Dispatch<SetStateAction<boolean>>;
	setEntity: Dispatch<SetStateAction<T | null>>;
	setDetailsOpen: Dispatch<SetStateAction<boolean>>;
	closeViewDetails: () => void;
	closeEdit: () => void;
	hook: K;
}

type UseDataHook<K> = (props: GenericHookProps) => K;

interface ModalCrudProviderProps<T, K> {
	children: ReactNode;

	useHook: UseDataHook<K>;
}

const ModalCrudContext = createContext<ModalCrudContextValue<any, any> | null>(
	null,
);

export const ModalCrudProvider = <T extends IGeneric, K>({
	children,
	useHook,
}: ModalCrudProviderProps<T, K>) => {
	const [page, _] = useQueryState('page', parseAsInteger.withDefault(1));
	const [searchTerm, __] = useQueryState('q', parseAsString.withDefault(''));

	const hookResult = useHook({ page, searchTerm });

	const [entity, setEntity] = useState<T | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);

	const closeEdit = useCallback(() => {
		setEditOpen(false);
		setEntity(null);
	}, []);
	const closeViewDetails = useCallback(() => {
		setEntity(null);
		setDetailsOpen(false);
	}, []);

	const value = useMemo(
		() => ({
			hook: hookResult,

			entity,
			setEntity,
			createOpen,
			setCreateOpen,
			editOpen,
			setEditOpen,
			closeEdit,
			detailsOpen,
			setDetailsOpen,
			closeViewDetails,
		}),
		[
			hookResult,
			page,
			searchTerm,
			entity,
			createOpen,
			editOpen,
			closeEdit,
			detailsOpen,
			setDetailsOpen,
			closeViewDetails,
		],
	);

	return (
		<ModalCrudContext.Provider value={value}>
			{children}
		</ModalCrudContext.Provider>
	);
};

export const useModalCrud = <T extends IGeneric, K>(): ModalCrudContextValue<
	T,
	K
> => {
	const context = useContext(ModalCrudContext);
	if (!context) {
		throw new Error('useModalCrud must be used within a ModalCrudProvider');
	}
	return context as ModalCrudContextValue<T, K>;
};
