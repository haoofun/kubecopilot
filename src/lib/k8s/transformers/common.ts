import type { KubernetesObject } from '@kubernetes/client-node'
import * as yaml from 'js-yaml'

// 定义我们想要从原始对象中移除的字段路径
const UNWANTED_YAML_FIELDS = [
  'metadata.managedFields',
  'metadata.resourceVersion',
  'metadata.uid',
  // ... 其他我们不希望用户看到的字段
]

/**
 * 清理 K8s 资源对象，移除不必要的字段，并转换为 YAML 字符串。
 * @param resource - 从 K8s API 获取的原始资源对象
 * @returns 格式化后的 YAML 字符串
 */
export function toCleanYAML<T extends KubernetesObject>(resource: T): string {
  // 深拷贝对象以避免修改原始数据
  const deepClonedResource = JSON.parse(JSON.stringify(resource)) as T

  // 移除不必要的字段
  for (const path of UNWANTED_YAML_FIELDS) {
    // 这里需要一个辅助函数来根据路径删除对象属性
    // e.g., deleteFieldByPath(deepClonedResource, path);
    // 为简化，我们先只处理第一层
    if (path.startsWith('metadata.')) {
      const metadata = deepClonedResource.metadata as
        | Record<string, unknown>
        | undefined
      if (!metadata) continue

      const key = path.substring('metadata.'.length)
      delete metadata[key]
    }
  }

  // 将清理后的 JSON 对象转换为 YAML 字符串
  return yaml.dump(deepClonedResource)
}
