/**
 * 经过后端处理的、用户友好的 Kubernetes 事件数据结构。
 * 该结构专门为在资源详情页的事件表格中展示而设计，让可观测性看板可以原样渲染 K8s 事件时间线。
 */
export interface K8sEvent {
  /**
   * 可观测性看板依赖事件 UID 进行去重，这个值直接来自 Kubernetes Event 对象的 `metadata.uid`。
   */
  uid: string

  /**
   * 事件的核心原因，通常是一个简短的、驼峰式的字符串；在 K8s 中它是 `reason` 字段，帮助看板为每一类事件着色。
   * 例如："Scheduled", "Pulled", "Started", "Unhealthy", "FailedScheduling"
   */
  reason: string

  /**
   * 对事件的详细、人类可读的描述信息，取自 Kubernetes 事件的 `message` 字段，供看板 tooltip 展示。
   * 例如："成功将 default/my-pod 分配到 node-1"
   */
  message: string

  /**
   * 事件的类型，主要用于在 UI 界面上进行颜色区分，以突出问题；来源于 `type` 字段（Normal/Warning）。
   * "Normal" (正常): 用于常规的、信息性的事件。
   * "Warning" (警告): 表明发生了潜在的或实际的问题。
   */
  type: 'Normal' | 'Warning'

  /**
   * 报告此事件的 Kubernetes 系统组件，来自 `source.component`，用于看板展示事件来源（调度器、kubelet 等）。
   * 例如："default-scheduler" (调度器), "kubelet"
   */
  sourceComponent: string

  /**
   * 报告此事件的组件所在的具体主机名，源于 `source.host`，帮助看板定位哪台节点发出了该事件。
   * 例如："node-1", "control-plane"
   */
  sourceHost: string

  /**
   * 此相同事件发生的次数，正是 Kubernetes 事件对象的 `count` 字段，供看板识别是否在重复告警。
   * Kubernetes 会将短时间内重复的相同事件聚合为一个，并增加此计数值。
   */
  count: number

  /**
   * 该事件首次发生的时间戳（`firstTimestamp`），看板用来绘制观察窗口的起点，ISO 8601 格式。
   */
  firstTimestamp: string

  /**
   * 该事件最近一次发生的时间戳（`lastTimestamp`），看板借此判断事件是否仍在发生，ISO 8601 格式。
   */
  lastTimestamp: string

  /**
   * 该事件所关联的具体 K8s 资源对象，直接来自 `involvedObject`，让可观测性看板能够在 Pods/Deployments 详情里联动。
   */
  involvedObject: {
    /** 资源类型, e.g., "Pod", "Deployment"，对应 `involvedObject.kind` 用于 UI 图标。 */
    kind: string // 资源类型, e.g., "Pod", "Deployment"
    /** 资源名称, e.g., "my-pod-123"，正是 `involvedObject.name`，方便看板跳转。 */
    name: string // 资源名称, e.g., "my-pod-123"
    /** 所在命名空间, e.g., "default"，来自 `involvedObject.namespace` 用于隔离多租户事件。 */
    namespace: string // 所在命名空间, e.g., "default"
    /** 关联资源的 UID，映射到 `involvedObject.uid`，便于看板关联原始对象。 */
    uid: string // 关联资源的 UID
  }
}
