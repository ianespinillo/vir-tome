'use client';
import { Input } from '@/ui/input';
import { useDebounceValue } from '@repo/hooks';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

// esto debe ser generico y setear con nuqs el searchterm

interface InputFilterProps {
	text: string;
}

export const InputFilter = ({ text }: Readonly<InputFilterProps>) => {
	const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));
	const [localVal, setLocalVal] = useState(q);
	const value = useDebounceValue(localVal, 800);
	useEffect(() => {
		setQ(value);
	}, [value, setQ]);
	return (
		<Input
			placeholder={text}
			value={localVal}
			onChange={(e) => setLocalVal(e.target.value)}
		/>
	);
};
