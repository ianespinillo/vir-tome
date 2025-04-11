
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type Row,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import { Skeleton } from "../../../ui/skeleton";
import { useCategory } from "@repo/hooks";
import { categoryColumn } from "../cells/category-columns";

interface Person {
  id: number;
  name: string;
  email: string;
  role: string;
}




export function CategoryTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
const {
  categories: { data, fetchNextPage, isFetching, isLoading },
} = useCategory()

  const flatData = data?.pages?.flatMap((page) => page.data) ?? [];

  const table = useReactTable({
    data: flatData,
    columns: categoryColumn,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 60, // altura estimada de cada fila
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= flatData.length - 1 &&
      data?.pages[data.pages.length - 1]?.nextPage &&
      !isFetching
    ) {
      fetchNextPage();
    }
  }, [virtualItems, flatData.length, isFetching, data, fetchNextPage]);

  return (
    <div className="rounded-md border">
      <div
        ref={tableContainerRef}
        className="h-[600px] w-full overflow-auto relative"
      >
        <Table className="grid">
          <TableHeader className="grid sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="flex w-full">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="flex items-center"
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className="grid relative"
            style={{
              height: `${totalSize}px`,
            }}
          >
            {isLoading ? (
              <TableRow className="absolute top-0 left-0 w-full flex">
                {categoryColumn.map((_, index) => (
                  <TableCell key={index} className="flex-1">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ) : (
              virtualItems.map((virtualRow: any) => {
                const row = rows[virtualRow.index] as Row<Person>;
                return (
                  <TableRow
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    className="flex absolute w-full"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="flex items-center"
                        style={{
                          width: cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
            {isFetching && !isLoading && (
              <TableRow className="flex absolute w-full">
                {categoryColumn.map((_, index) => (
                  <TableCell key={index} className="flex-1">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function flexRender(component: any, context: any) {
  return typeof component === "function" ? component(context) : component;
}