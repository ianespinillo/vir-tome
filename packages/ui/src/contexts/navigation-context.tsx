import { createContext, useContext } from 'react';

interface NavContextProps {
	navigate: (
		path: string,
		options: { replace?: boolean; isExternal?: boolean },
	) => void;
}
export const NavigationContext = createContext<NavContextProps | undefined>(
	undefined,
);

export const UIConfigProvider = ({
	children,
	value,
}: { children: React.ReactNode; value: NavContextProps }) => {
	return (
		<NavigationContext.Provider value={value}>
			{children}
		</NavigationContext.Provider>
	);
};

export const useUINav = () => {
	const context = useContext(NavigationContext);
	if (!context)
		throw new Error('useUINav must be used within a UIConfigProvider');
	return context;
};
