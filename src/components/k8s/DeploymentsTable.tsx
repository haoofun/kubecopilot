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

interface Deployment {
  name: string
  namespace: string
  ready: string
  upToDate: number
  available: number
  age: string
}

export function DeploymentsTable() {
  const {
    data: deployments,
    isLoading,
    isError,
  } = useK8sResource<Deployment[]>('deployments')

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {isError?.message + 'Failed to load deployments.' ||
            'Failed to load deployments.'}
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
          <TableHead>Ready</TableHead>
          <TableHead>Up-to-date</TableHead>
          <TableHead>Available</TableHead>
          <TableHead>Age</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[250px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
              </TableRow>
            ))
          : deployments?.map((dep) => (
              <TableRow key={`${dep.namespace}-${dep.name}`}>
                <TableCell className="font-medium">
                  <Link
                    href={`/deployments/${dep.namespace}/${dep.name}`}
                    className="text-primary hover:underline"
                  >
                    {dep.name}
                  </Link>
                </TableCell>
                <TableCell>{dep.namespace}</TableCell>
                <TableCell>{dep.ready}</TableCell>
                <TableCell>{dep.upToDate}</TableCell>
                <TableCell>{dep.available}</TableCell>
                <TableCell>{dep.age}</TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}
