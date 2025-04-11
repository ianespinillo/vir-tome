import { ColumnDef } from '@tanstack/react-table';
import { ICategory } from '@repo/common'
import { Button } from '../../../ui/button';
import { ArrowUpDown } from 'lucide-react';

export const categoryColumn: ColumnDef<ICategory>[] = [
    {
        accessorKey: 'id',
        header: ({column})=>{
            return (
              <Button 
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="flex items-center gap-2"
              >
                ID
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
        },
    },
    {
        accessorKey: 'name',
        header: ({column})=>{
            return (
                <Button 
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="flex items-center gap-2"
                >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        }
    }
]