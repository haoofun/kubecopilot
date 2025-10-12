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

interface Service {
  name: string
  namespace: string
  type: string
  clusterIP: string
  ports: string
  age: string
}

export function ServicesTable() {
  const {
    data: services,
    isLoading,
    isError,
  } = useK8sResource<Service[]>('services')

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {isError?.message || 'Failed to load services.'}
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
          <TableHead>Type</TableHead>
          <TableHead>Cluster IP</TableHead>
          <TableHead>Ports</TableHead>
          <TableHead>Age</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[250px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
              </TableRow>
            ))
          : services?.map((svc) => (
              <TableRow key={`${svc.namespace}-${svc.name}`}>
                <TableCell className="font-medium">
                  <Link
                    href={`/services/${svc.namespace}/${svc.name}`}
                    className="text-primary hover:underline"
                  >
                    {svc.name}
                  </Link>
                </TableCell>
                <TableCell>{svc.namespace}</TableCell>
                <TableCell>{svc.type}</TableCell>
                <TableCell>{svc.clusterIP}</TableCell>
                <TableCell>{svc.ports}</TableCell>
                <TableCell>{svc.age}</TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}
