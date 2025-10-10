import useSWR from 'swr'

// 定义一个通用的 fetcher 函数，SWR 会用它来获取数据
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error('An error occurred while fetching the data.')
    }
    return res.json()
  })

export function useK8sResource<T>(resourcePath: string) {
  const { data, error, isLoading } = useSWR<T>(
    `/api/k8s/${resourcePath}`,
    fetcher,
  )

  return {
    data,
    isLoading,
    isError: error,
  }
}
