import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getCronJobDetail,
  listCronJobs,
} from '@domain-k8s/services/cronjob.service'

const cronJobsApi = createApiRouteHandlers({
  resourceBase: 'cronjobs',
  kind: 'CronJob',
  telemetry: { route: 'api/k8s/cronjobs', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listCronJobs,
    getDetail: getCronJobDetail,
  },
})

export const GET = cronJobsApi.GET
