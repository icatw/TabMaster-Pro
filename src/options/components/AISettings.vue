<template>
  <section class="settings-section" aria-labelledby="ai-settings-title">
    <h2 id="ai-settings-title" class="section-title">{{ $t('settings.aiTitle') }}</h2>

    <div class="setting-card">
      <h3 class="card-title">{{ $t('settings.aiProvider') }}</h3>
      <p class="setting-desc ai-privacy-note">{{ $t('settings.aiPrivacy') }}</p>

      <form class="ai-settings-form" @submit.prevent="saveSettings">
        <fieldset class="provider-options">
          <legend>{{ $t('settings.aiChooseProvider') }}</legend>
          <label class="provider-option">
            <input v-model="settings.provider" type="radio" name="ai-provider" value="openai-compatible" />
            <span>
              <strong>{{ $t('settings.aiCustomProvider') }}</strong>
              <small>{{ $t('settings.aiCustomProviderHint') }}</small>
            </span>
          </label>
          <label class="provider-option">
            <input v-model="settings.provider" type="radio" name="ai-provider" value="chrome-built-in" />
            <span>
              <strong>{{ $t('settings.aiChromeProvider') }}</strong>
              <small>{{ $t('settings.aiChromeProviderHint') }}</small>
            </span>
          </label>
        </fieldset>

        <template v-if="settings.provider === 'openai-compatible'">
          <label class="ai-field" for="ai-endpoint">
            <span>{{ $t('settings.aiEndpoint') }}</span>
            <input
              id="ai-endpoint"
              v-model.trim="settings.endpoint"
              name="ai-endpoint"
              type="url"
              autocomplete="url"
              required
              spellcheck="false"
            />
            <small>{{ $t('settings.aiEndpointHint') }}</small>
          </label>

          <label class="ai-field" for="ai-model">
            <span>{{ $t('settings.aiModel') }}</span>
            <input
              id="ai-model"
              v-model.trim="settings.model"
              name="ai-model"
              type="text"
              autocomplete="off"
              maxlength="160"
              required
              spellcheck="false"
            />
          </label>

          <label class="ai-field" for="ai-api-key">
            <span>{{ $t('settings.aiApiKey') }}</span>
            <input
              id="ai-api-key"
              v-model="settings.apiKey"
              name="ai-api-key"
              :type="showApiKey ? 'text' : 'password'"
              autocomplete="new-password"
              maxlength="4096"
              :aria-describedby="'ai-key-hint'"
              spellcheck="false"
            />
            <small id="ai-key-hint">{{ $t('settings.aiApiKeyHint') }}</small>
            <button type="button" class="text-button" @click="showApiKey = !showApiKey">
              {{ $t(showApiKey ? 'settings.aiHideKey' : 'settings.aiShowKey') }}
            </button>
          </label>
        </template>

        <p v-if="status" class="ai-status" aria-live="polite" :data-error="statusIsError">{{ status }}</p>
        <div class="ai-actions">
          <button class="btn btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? $t('common.loading') : $t('settings.aiSave') }}
          </button>
          <button class="btn btn-secondary" type="button" :disabled="isTesting" @click="testConnection">
            {{ isTesting ? $t('common.loading') : $t('settings.aiTest') }}
          </button>
          <button
            v-if="settings.provider === 'openai-compatible' && settings.apiKey"
            class="btn btn-secondary"
            type="button"
            :disabled="isSaving"
            @click="clearApiKey"
          >
            {{ $t('settings.aiClearKey') }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { AIProviderSettings, APIResponse } from '@/shared/types'
import { DEFAULT_AI_SETTINGS, validateAISettings } from '@/shared/services/AIService'
import { MESSAGE_TYPES, STORAGE_KEYS } from '@/shared/constants'
import { i18n } from '@/i18n'

const settings = reactive<AIProviderSettings>({ ...DEFAULT_AI_SETTINGS })
const isSaving = ref(false)
const isTesting = ref(false)
const showApiKey = ref(false)
const status = ref('')
const statusIsError = ref(false)

function setStatus(message: string, isError = false) {
  status.value = message
  statusIsError.value = isError
}

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.AI_SETTINGS)
    const stored = result[STORAGE_KEYS.AI_SETTINGS] as Partial<AIProviderSettings> | undefined
    if (stored) Object.assign(settings, DEFAULT_AI_SETTINGS, stored)
  } catch {
    setStatus(i18n.global.t('settings.aiLoadFailed'), true)
  }
}

async function saveSettings() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const value = validateAISettings({ ...settings })
    await chrome.storage.local.set({ [STORAGE_KEYS.AI_SETTINGS]: value })
    Object.assign(settings, value)
    setStatus(i18n.global.t('settings.aiSaved'))
  } catch (error) {
    setStatus(error instanceof Error ? error.message : i18n.global.t('settings.aiSaveFailed'), true)
  } finally {
    isSaving.value = false
  }
}

async function testConnection() {
  if (isTesting.value) return
  isTesting.value = true
  setStatus('')
  try {
    const result = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TEST_AI_PROVIDER,
      payload: { ...settings }
    }) as APIResponse<string>
    if (!result.success) throw new Error(result.error || i18n.global.t('settings.aiTestFailed'))
    setStatus(i18n.global.t('settings.aiTestSucceeded'))
  } catch (error) {
    setStatus(error instanceof Error ? error.message : i18n.global.t('settings.aiTestFailed'), true)
  } finally {
    isTesting.value = false
  }
}

async function clearApiKey() {
  settings.apiKey = ''
  await saveSettings()
}

onMounted(loadSettings)
</script>

<style scoped>
.ai-settings-form {
  display: grid;
  gap: 20px;
}

.ai-privacy-note {
  margin: -6px 0 20px;
  padding: 12px 14px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.provider-options {
  display: grid;
  gap: 10px;
  border: 0;
  padding: 0;
}

.provider-options legend,
.ai-field > span {
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.provider-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.provider-option input {
  margin: 3px 0 0;
  accent-color: var(--text-primary);
}

.provider-option span,
.ai-field {
  display: grid;
  gap: 5px;
}

.provider-option strong {
  color: var(--text-primary);
  font-size: 13px;
}

.provider-option small,
.ai-field small {
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}

.ai-field input {
  width: 100%;
  min-height: 40px;
  padding: 9px 11px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font: inherit;
}

.ai-field input:focus-visible,
.provider-option:focus-within {
  outline: 2px solid var(--text-primary);
  outline-offset: 2px;
}

.ai-status {
  min-height: 1.4em;
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.ai-status[data-error="true"] {
  color: var(--danger-color, #b42318);
}

.ai-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.text-button {
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.text-button:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 3px;
}
</style>
