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
import { Skeleton } from '@/components/ui/skeleton' // 我们需要骨架屏

// 定义 Namespace 数据的 TypeScript 类型
interface Namespace {
  name: string
  status: string
  creationTimestamp: string
}

export function NamespaceTable() {
  // 使用我们刚刚创建的 Hook 来获取数据
  const {
    data: namespaces,
    isLoading,
    isError,
  } = useK8sResource<Namespace[]>('namespaces')

  if (isError) {
    return <div className="text-red-500">Failed to load namespaces.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Age</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? // 当数据加载时，显示骨架屏，提升用户体验
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[250px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
              </TableRow>
            ))
          : // 数据加载完成后，显示真实数据
            namespaces?.map((ns) => (
              <TableRow key={ns.name}>
                <TableCell className="font-medium">{ns.name}</TableCell>
                <TableCell>{ns.status}</TableCell>
                <TableCell>{ns.creationTimestamp}</TableCell>
                {/* TODO: Format the timestamp to a human-readable "Age" (e.g., "2 days ago") */}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}
