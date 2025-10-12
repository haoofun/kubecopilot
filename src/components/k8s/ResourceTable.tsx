'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useK8sResource } from '@/hooks/useK8sResource'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Alert, AlertDescription } from '../ui/alert'

// Column definition
export interface ColumnDef<T> {
  header: string
  cell: (item: T) => React.ReactNode
  className?: string // For skeleton width
}

// Props for the generic table
interface ResourceTableProps<T> {
  resource: string
  columns: ColumnDef<T>[]
  // A function to generate a unique key for each row
  rowKey: (item: T) => string
  // A function to generate the link for the name column (optional)
  linkGenerator?: (item: T) => string
}

export function ResourceTable<T extends { name: string }>({
  resource,
  columns,
  rowKey,
  linkGenerator,
}: ResourceTableProps<T>) {
  const { data, isLoading, isError } = useK8sResource<T[]>(resource)

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {isError?.message || `Failed to load ${resource}.`}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.header}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((col, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className={`h-4 ${col.className || 'w-full'}`} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : data?.map((item) => (
              <TableRow key={rowKey(item)}>
                {columns.map((col, colIndex) => {
                  // Special handling for the first column to be a link if linkGenerator is provided
                  if (colIndex === 0 && linkGenerator) {
                    return (
                      <TableCell key={colIndex} className="font-medium">
                        <Link
                          href={linkGenerator(item)}
                          className="text-primary hover:underline"
                        >
                          {col.cell(item)}
                        </Link>
                      </TableCell>
                    )
                  }
                  return <TableCell key={colIndex}>{col.cell(item)}</TableCell>
                })}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}
