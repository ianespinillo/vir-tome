import { useModalCrud } from '@/contexts/modal-crud-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { BookForm } from '../../forms/book-form';
export const EditBook = () => {
	const { editOpen, setEditOpen } = useModalCrud();
	return (
		<Dialog open={editOpen} onOpenChange={setEditOpen}>
			<DialogContent className="p-0">
				<DialogHeader className="hidden">
					<DialogTitle>Edit Book</DialogTitle>
				</DialogHeader>
				<BookForm />
			</DialogContent>
		</Dialog>
	);
};
