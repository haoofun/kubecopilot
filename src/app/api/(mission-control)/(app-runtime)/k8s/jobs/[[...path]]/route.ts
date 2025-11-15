import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import { getJobDetail, listJobs } from '@domain-k8s/services/job.service'

const jobsApi = createApiRouteHandlers({
  resourceBase: 'jobs',
  kind: 'Job',
  telemetry: { route: 'api/k8s/jobs', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listJobs,
    getDetail: getJobDetail,
  },
})

export const GET = jobsApi.GET
