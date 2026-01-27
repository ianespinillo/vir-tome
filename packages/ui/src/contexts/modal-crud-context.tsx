'use client';
import { BaseQueriesDto, IGeneric } from '@repo/common';
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

/* ===================== CONTEXT VALUE ===================== */

interface ModalCrudContextValue<
	TEntity extends IGeneric,
	TQuery extends BaseQueriesDto<TEntity>,
	THookResult,
> {
	entity: TEntity | null;

	createOpen: boolean;
	editOpen: boolean;
	detailsOpen: boolean;

	queryParams: TQuery;
	setQueryParams: Dispatch<SetStateAction<TQuery>>;

	setEditOpen: Dispatch<SetStateAction<boolean>>;
	setCreateOpen: Dispatch<SetStateAction<boolean>>;
	setEntity: Dispatch<SetStateAction<TEntity | null>>;
	setDetailsOpen: Dispatch<SetStateAction<boolean>>;

	closeViewDetails: () => void;
	closeEdit: () => void;

	hook: THookResult;
}

/* ===================== HOOK TYPE ===================== */

type UseDataHook<
	TEntity extends IGeneric,
	TQuery extends BaseQueriesDto<TEntity>,
	THookResult,
> = (props: TQuery) => THookResult;

/* ===================== PROVIDER PROPS ===================== */

interface ModalCrudProviderProps<
	THookResult,
	TEntity extends IGeneric = IGeneric,
	TQuery extends BaseQueriesDto<TEntity> = BaseQueriesDto<TEntity>,
> {
	children: ReactNode;
	useHook: UseDataHook<TEntity, TQuery, THookResult>;
	queries?: TQuery;
}

/* ===================== CONTEXT ===================== */

const ModalCrudContext = createContext<ModalCrudContextValue<
	any,
	any,
	any
> | null>(null);

/* ===================== PROVIDER ===================== */

export const ModalCrudProvider = <
	THookResult,
	TEntity extends IGeneric,
	TQuery extends BaseQueriesDto<TEntity> = BaseQueriesDto<TEntity>,
>({
	children,
	useHook,
	queries = new BaseQueriesDto<TEntity>() as TQuery,
}: ModalCrudProviderProps<THookResult, TEntity, TQuery>) => {
	const [queryParams, setQueryParams] = useState<TQuery>(queries);
	const hookResult = useHook(queryParams);

	const [entity, setEntity] = useState<TEntity | null>(null);
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
			queryParams,
			setQueryParams,
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
			queryParams,
			entity,
			createOpen,
			editOpen,
			closeEdit,
			detailsOpen,
			closeViewDetails,
		],
	);

	return (
		<ModalCrudContext.Provider value={value}>
			{children}
		</ModalCrudContext.Provider>
	);
};

/* ===================== CONSUMER ===================== */

export const useModalCrud = <
	TEntity extends IGeneric,
	TQuery extends BaseQueriesDto<TEntity>,
	THookResult,
>(): ModalCrudContextValue<TEntity, TQuery, THookResult> => {
	const context = useContext(ModalCrudContext);
	if (!context) {
		throw new Error('useModalCrud must be used within a ModalCrudProvider');
	}
	return context as ModalCrudContextValue<TEntity, TQuery, THookResult>;
};
