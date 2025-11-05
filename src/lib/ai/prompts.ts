import { promises as fs } from 'fs'
import path from 'path'

const PROMPTS_DIR = path.join(process.cwd(), 'prompts')

export async function loadPromptTemplate(name: string): Promise<string> {
  try {
    const filePath = path.join(PROMPTS_DIR, name)
    const content = await fs.readFile(filePath, 'utf8')
    return content
  } catch (error) {
    console.warn(
      `[ai.prompts] Unable to load prompt template "${name}", falling back to default instructions.`,
      error,
    )
    return `You are an SRE assistant who analyses Kubernetes pod state, recent events, and container logs.
Return a concise JSON object that matches the agreed schema. Use the provided context only.
`
  }
}
