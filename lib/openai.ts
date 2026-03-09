import OpenAI from 'openai'

let client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return client
}

export const AI_MODEL      = 'gpt-4o'
export const AI_TEMP       = 0.2
export const AI_MAX_TOKENS = 1500