import { IUser, LoanBorrowerType } from '@repo/common';
import {
	Dispatch,
	ReactNode,
	SetStateAction,
	createContext,
	useContext,
	useMemo,
	useState,
} from 'react';

interface LoanContextValue {
	borrowerType: LoanBorrowerType;
	activeTab: string;
	selectedUser: IUser | null;
	setBorrowerType: Dispatch<SetStateAction<LoanBorrowerType>>;
	setActiveTab: Dispatch<SetStateAction<string>>;
	setSelectedUser: Dispatch<SetStateAction<IUser | null>>;
}
const LoanContext = createContext<LoanContextValue | null>(null);

export const LoanContextProvider = ({
	children,
}: Readonly<{ children: ReactNode }>) => {
	const [borrowerType, setBorrowerType] = useState<LoanBorrowerType>(
		LoanBorrowerType.REGISTERED_USER,
	);
	const [activeTab, setActiveTab] = useState<string>('return');
	const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
	const value = useMemo(
		() => ({
			borrowerType,
			setBorrowerType,
			activeTab,
			setActiveTab,
			selectedUser,
			setSelectedUser,
		}),
		[
			selectedUser,
			borrowerType,
			setBorrowerType,
			activeTab,
			setActiveTab,
			setSelectedUser,
		],
	);

	return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
};

export const useLoanContext = () => {
	const context = useContext(LoanContext);
	if (!context) throw new Error('No context provided');
	return context;
};
