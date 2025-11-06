import type { OperationPlan } from './types'

export const operationPlanFixtures: OperationPlan[] = [
  {
    id: '8f4f3b3d-1c0d-4f0c-9f6f-2d0c4c0b5c1a',
    version: '1',
    status: 'pending',
    action: 'scale',
    intent:
      'Expand api-gateway capacity ahead of the holiday event and roll out latency hotfix v1.8.4.',
    aiRationale:
      'Autoscaler saturation detected at 90th percentile traffic. Scaling to six replicas plus deploying patch v1.8.4 prevents spillover errors before the launch.',
    resource: {
      kind: 'Deployment',
      namespace: 'production',
      name: 'api-gateway',
      uid: '0f86f811-7d2a-4c70-af7a-86f10dd6f9a4',
      resourceVersion: '1289764',
      cluster: 'prod-cluster',
      href: '/operation-targets/deployments/production/api-gateway',
    },
    steps: [
      {
        id: 'step-1',
        action: 'scale',
        description: 'Increase replicas from 4 → 6 to add 50% buffer.',
        patch: [{ op: 'replace', path: '/spec/replicas', value: 6 }],
        rollbackPatch: [{ op: 'replace', path: '/spec/replicas', value: 4 }],
      },
      {
        id: 'step-2',
        action: 'update',
        description: 'Roll out hotfix container image v1.8.4.',
        patch: [
          {
            op: 'replace',
            path: '/spec/template/spec/containers/0/image',
            value: 'ghcr.io/kubecorp/api-gateway:1.8.4',
          },
        ],
        rollbackPatch: [
          {
            op: 'replace',
            path: '/spec/template/spec/containers/0/image',
            value: 'ghcr.io/kubecorp/api-gateway:1.8.3',
          },
        ],
      },
    ],
    diff: {
      before: {
        metadata: {
          name: 'api-gateway',
          namespace: 'production',
        },
        spec: {
          replicas: 4,
          template: {
            spec: {
              containers: [
                {
                  name: 'api-gateway',
                  image: 'ghcr.io/kubecorp/api-gateway:1.8.3',
                },
              ],
            },
          },
        },
      },
      patch: [
        { op: 'replace', path: '/spec/replicas', value: 6 },
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/image',
          value: 'ghcr.io/kubecorp/api-gateway:1.8.4',
        },
      ],
      rollbackPatch: [
        { op: 'replace', path: '/spec/replicas', value: 4 },
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/image',
          value: 'ghcr.io/kubecorp/api-gateway:1.8.3',
        },
      ],
      patchFormat: 'rfc6902',
    },
    risk: {
      level: 'medium',
      rationale:
        'Image rollout in production requires pod restart and pod warm-up before traffic shift.',
      score: 0.58,
      factors: ['traffic_spike_window', 'image_change'],
      sloBudgetImpact: 'medium',
      postConditions: [
        'P95 latency < 200ms for 10 minutes',
        'Error budget burn rate < 1.0 over next 30 minutes',
      ],
    },
    audit: {
      requestedBy: 'ai:deploy-copilot',
      confirmedBy: null,
      executedBy: 'system',
      idempotencyKey: 'plan-production-api-gateway-scale-20241118',
      sourcePromptId: 'deploy-holiday-scale@1.2.0',
      timestamps: {
        createdAt: '2024-11-18T03:45:00Z',
        confirmedAt: null,
        executedAt: null,
        failedAt: null,
        revertedAt: null,
      },
    },
  },
  {
    id: '90c974b6-0aef-4fb4-8d1e-2b08f49b1d71',
    version: '1',
    status: 'confirmed',
    action: 'restart',
    intent:
      'Drain payment-worker pods in batches to refresh environment variables without queue growth.',
    aiRationale:
      'Payment worker pods picked up rotated secrets. Rolling restart ensures updated env vars with negligible downtime.',
    resource: {
      kind: 'StatefulSet',
      namespace: 'payments',
      name: 'payment-worker',
      uid: 'e5e19d92-1f56-42e9-9fbe-685ce8b3c188',
      resourceVersion: '788310',
      href: '/operation-targets/statefulsets/payments/payment-worker',
    },
    steps: [
      {
        id: 'step-1',
        action: 'restart',
        description:
          'Annotate StatefulSet to trigger pod restart rolling window.',
        patch: [
          {
            op: 'add',
            path: '/spec/template/metadata/annotations/restart.kubecopilot.io~1ts',
            value: '2024-11-12T15:20:00Z',
          },
        ],
        rollbackPatch: [
          {
            op: 'remove',
            path: '/spec/template/metadata/annotations/restart.kubecopilot.io~1ts',
          },
        ],
      },
    ],
    diff: {
      before: {
        metadata: {
          name: 'payment-worker',
          namespace: 'payments',
        },
        spec: {
          template: {
            metadata: {
              annotations: {
                'restart.kubecopilot.io/ts': '2024-11-05T10:00:00Z',
              },
            },
          },
        },
      },
      patch: [
        {
          op: 'replace',
          path: '/spec/template/metadata/annotations/restart.kubecopilot.io~1ts',
          value: '2024-11-12T15:20:00Z',
        },
      ],
      rollbackPatch: [
        {
          op: 'replace',
          path: '/spec/template/metadata/annotations/restart.kubecopilot.io~1ts',
          value: '2024-11-05T10:00:00Z',
        },
      ],
      patchFormat: 'rfc6902',
    },
    risk: {
      level: 'low',
      rationale:
        'Single-annotation bump with batched restarts. Minimal blast radius.',
      score: 0.21,
      factors: ['batched_restart'],
      sloBudgetImpact: 'low',
      postConditions: ['Job queue depth < 5K for 15 minutes'],
    },
    audit: {
      requestedBy: 'user:sre.wei',
      confirmedBy: 'user:oncall.liang',
      executedBy: 'system',
      idempotencyKey: 'plan-payments-worker-restart-20241112',
      sourcePromptId: 'refresh-env-secret@0.9.1',
      timestamps: {
        createdAt: '2024-11-12T15:20:00Z',
        confirmedAt: '2024-11-12T15:25:44Z',
        executedAt: '2024-11-12T15:32:05Z',
        failedAt: null,
        revertedAt: null,
      },
    },
  },
]

export const findOperationPlanById = (id: string) =>
  operationPlanFixtures.find((plan) => plan.id === id)
