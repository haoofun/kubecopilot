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

interface Pod {
  name: string
  namespace: string
  status: string
  restarts: number
  age: string
}

export function PodsTable() {
  const { data: pods, isLoading, isError } = useK8sResource<Pod[]>('pods')

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {isError?.message || 'Failed to load pods.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Namespace</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Restarts</TableHead>
          <TableHead>Age</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[250px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
              </TableRow>
            ))
          : pods?.map((pod) => (
              <TableRow key={`${pod.namespace}-${pod.name}`}>
                <TableCell className="font-medium">
                  <Link
                    href={`/pods/${pod.namespace}/${pod.name}`}
                    className="text-primary hover:underline"
                  >
                    {pod.name}
                  </Link>
                </TableCell>
                <TableCell>{pod.namespace}</TableCell>
                <TableCell>{pod.status}</TableCell>
                <TableCell>{pod.restarts}</TableCell>
                <TableCell>{pod.age}</TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}
