import { describe, expect, it } from 'vitest'
import { DEFAULT_AI_SETTINGS, validateAISettings } from '../AIService'

describe('AI model settings', () => {
  it('defaults to the on-device provider so tab data is not sent remotely by default', () => {
    expect(DEFAULT_AI_SETTINGS.provider).toBe('chrome-built-in')
  })

  it('accepts HTTPS custom endpoints and normalizes the base URL', () => {
    expect(validateAISettings({
      provider: 'openai-compatible',
      endpoint: 'https://models.example/v1/',
      model: 'my-model',
      apiKey: ''
    }).endpoint).toBe('https://models.example/v1')
  })

  it('allows plain HTTP only for loopback model servers', () => {
    const settings = { ...DEFAULT_AI_SETTINGS, provider: 'openai-compatible' as const }
    expect(() => validateAISettings({ ...settings, endpoint: 'http://localhost:1234/v1' })).not.toThrow()
    expect(() => validateAISettings({ ...settings, endpoint: 'http://models.example/v1' })).toThrow()
  })

  it('rejects credentials and query parameters embedded in the endpoint', () => {
    const settings = { ...DEFAULT_AI_SETTINGS, provider: 'openai-compatible' as const }
    expect(() => validateAISettings({ ...settings, endpoint: 'https://user:pass@models.example/v1' })).toThrow()
    expect(() => validateAISettings({ ...settings, endpoint: 'https://models.example/v1?key=secret' })).toThrow()
  })
})
