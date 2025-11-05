/**
 * 经过后端处理的、用户友好的 Kubernetes 事件数据结构。
 * 该结构专门为在资源详情页的事件表格中展示而设计。
 */
export interface K8sEvent {
  /**
   * 事件的唯一标识符 (UID)。
   */
  uid: string

  /**
   * 事件的核心原因，通常是一个简短的、驼峰式的字符串。
   * 例如："Scheduled", "Pulled", "Started", "Unhealthy", "FailedScheduling"
   */
  reason: string

  /**
   * 对事件的详细、人类可读的描述信息。
   * 例如："成功将 default/my-pod 分配到 node-1"
   */
  message: string

  /**
   * 事件的类型，主要用于在 UI 界面上进行颜色区分，以突出问题。
   * "Normal" (正常): 用于常规的、信息性的事件。
   * "Warning" (警告): 表明发生了潜在的或实际的问题。
   */
  type: 'Normal' | 'Warning'

  /**
   * 报告此事件的 Kubernetes 系统组件。
   * 例如："default-scheduler" (调度器), "kubelet"
   */
  sourceComponent: string

  /**
   * 报告此事件的组件所在的具体主机名。
   * 例如："node-1", "control-plane"
   */
  sourceHost: string

  /**
   * 此相同事件发生的次数。
   * Kubernetes 会将短时间内重复的相同事件聚合为一个，并增加此计数值。
   */
  count: number

  /**
   * 该事件首次发生的时间戳。
   * 存储为 ISO 8601 格式的字符串。
   */
  firstTimestamp: string

  /**
   * 该事件最近一次发生的时间戳。
   * 存储为 ISO 8601 格式的字符串。
   */
  lastTimestamp: string

  /**
   * 该事件所关联的具体 K8s 资源对象。
   * 这个字段对于调试和未来的全局事件页面至关重要。
   */
  involvedObject: {
    kind: string // 资源类型, e.g., "Pod", "Deployment"
    name: string // 资源名称, e.g., "my-pod-123"
    namespace: string // 所在命名空间, e.g., "default"
    uid: string // 关联资源的 UID
  }
}
