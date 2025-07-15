'use client';


import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  accessorKey?: string;
  header: string;
  cell?: ({ row }: { row: { original: T } }) => React.ReactNode;
  id?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
}

export function DataTable<T>({ data, columns, className }: DataTableProps<T>) {
  const getValueByPath = (obj: any, path: string): any => {
    return path.split('.').reduce((value, key) => value?.[key], obj);
  };

  return (
    <div className={cn("relative overflow-auto", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            {columns.map((column, index) => (
              <th
                key={column.id || column.accessorKey || index}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={column.id || column.accessorKey || colIndex}
                  className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                >
                  {column.cell
                    ? column.cell({ row: { original: row } })
                    : column.accessorKey
                    ? getValueByPath(row, column.accessorKey)
                    : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
