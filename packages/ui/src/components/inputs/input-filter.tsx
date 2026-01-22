'use client';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Input } from '@/ui/input';
import { useDebounceValue } from '@repo/hooks';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

// esto debe ser generico y setear con nuqs el searchterm

interface InputFilterProps {
	text: string;
}

export const InputFilter = ({ text }: Readonly<InputFilterProps>) => {
	const { setQueryParams, queryParams} = useModalCrud();
	const [localVal, setLocalVal] = useState(queryParams.search || '');
	const value = useDebounceValue(localVal, 800);
	useEffect(() => {
		setQueryParams((prev) => ({
			...prev,
			search: value || undefined,
		}));
	}, [value, setQueryParams]);
	return (
		<Input
			placeholder={text}
			value={localVal}
			onChange={(e) => setLocalVal(e.target.value)}
		/>
	);
};
