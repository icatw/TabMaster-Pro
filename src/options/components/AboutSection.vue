<template>
  <section class="settings-section">
    <h2 class="section-title">
      <svg class="title-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
      {{ $t('settings.about') }}
    </h2>

    <div class="about-container">
      <div class="about-card">
        <div class="about-header">
          <div class="logo-container">
            <svg class="about-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12"></path>
            </svg>
          </div>
          <div class="about-info">
            <h3 class="about-title">{{ $t('settings.extensionName') }}</h3>
            <p class="about-version">{{ $t('settings.currentVersion') }} {{ version }}</p>
            <div class="version-badge">
              <span class="badge-text">{{ $t('settings.stableRelease') }}</span>
            </div>
          </div>
        </div>

        <div class="about-content">
          <p class="about-desc">
            {{ $t('settings.extensionDesc') }}
          </p>

          <div class="features-section">
            <h4 class="features-title">{{ $t('settings.coreFeatures') }}</h4>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon">✨</div>
                <div class="feature-text">
                  <span class="feature-name">{{ $t('settings.featureList.smartSort') }}</span>
                  <span class="feature-desc">{{ $t('settings.featureDescriptions.smartSort') }}</span>
                </div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🎨</div>
                <div class="feature-text">
                  <span class="feature-name">{{ $t('settings.featureList.autoGroup') }}</span>
                  <span class="feature-desc">{{ $t('settings.featureDescriptions.autoGroup') }}</span>
                </div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <div class="feature-text">
                  <span class="feature-name">{{ $t('settings.featureList.quickActions') }}</span>
                  <span class="feature-desc">{{ $t('settings.featureDescriptions.quickActions') }}</span>
                </div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🔄</div>
                <div class="feature-text">
                  <span class="feature-name">{{ $t('settings.featureList.autoMode') }}</span>
                  <span class="feature-desc">{{ $t('settings.featureDescriptions.autoMode') }}</span>
                </div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📊</div>
                <div class="feature-text">
                  <span class="feature-name">{{ $t('settings.featureList.batchManagement') }}</span>
                  <span class="feature-desc">{{ $t('settings.featureDescriptions.batchManagement') }}</span>
                </div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <div class="feature-text">
                  <span class="feature-name">{{ $t('settings.featureList.searchFilter') }}</span>
                  <span class="feature-desc">{{ $t('settings.featureDescriptions.searchFilter') }}</span>
                </div>
              </div>
            </div>
          </div>


          <div class="links-section">
            <a href="https://github.com/icatw/TabMaster-Pro" target="_blank" class="link-card github">
              <svg class="link-icon" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              <div class="link-content">
                <span class="link-title">{{ $t('settings.links.viewSource') }}</span>
                <span class="link-desc">{{ $t('settings.links.sourceDesc') }}</span>
              </div>
            </a>

            <a href="https://github.com/icatw/TabMaster-Pro/issues" target="_blank" class="link-card feedback">
              <svg class="link-icon" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
              </svg>
              <div class="link-content">
                <span class="link-title">{{ $t('settings.links.feedback') }}</span>
                <span class="link-desc">{{ $t('settings.links.feedbackDesc') }}</span>
              </div>
            </a>
          </div>

          <div class="developer-section">
            <h4 class="dev-title">{{ $t('settings.developerInfo') }}</h4>
            <div class="dev-card">
              <div class="dev-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
              </div>
              <div class="dev-info">
                <a href="https://github.com/icatw" target="_blank" class="dev-name">@icatw</a>
                <p class="dev-bio">{{ $t('settings.developerBio') }}</p>
                <div class="dev-tech">
                  <span class="tech-tag">Vue 3</span>
                  <span class="tech-tag">TypeScript</span>
                  <span class="tech-tag">Chrome API</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer-text">
            <p>{{ $t('settings.builtWith') }}</p>
            <p>{{ $t('settings.copyright') }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const version = ref('0.1.0')

onMounted(() => {
  const manifest = chrome.runtime.getManifest()
  version.value = manifest.version
})
</script>

<style scoped>
.settings-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.title-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}

.about-container {
  max-width: 800px;
}

.about-card {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-primary);
}

.about-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 2px solid var(--border-secondary);
  margin-bottom: 24px;
}

.logo-container {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
}

.about-logo {
  width: 36px;
  height: 36px;
  color: white;
}

.about-info {
  flex: 1;
}

.about-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.about-version {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.version-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
  border-radius: 12px;
}

.badge-text {
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.about-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 32px;
}

.features-section {
  margin-bottom: 32px;
}

.features-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: var(--primary-color);
}

.feature-icon {
  font-size: 24px;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.feature-desc {
  font-size: 11px;
  color: var(--text-tertiary);
}


.links-section {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.link-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.link-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.link-card.github:hover {
  border-color: #24292e;
}

.link-card.feedback:hover {
  border-color: var(--primary-color);
}

.link-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.github .link-icon {
  color: #24292e;
}

.feedback .link-icon {
  color: var(--primary-color);
}

.link-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.link-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.link-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.developer-section {
  margin-bottom: 24px;
}

.dev-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.dev-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
}

.dev-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  border-radius: 50%;
}

.dev-avatar svg {
  width: 28px;
  height: 28px;
  color: white;
}

.dev-info {
  flex: 1;
}

.dev-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
  text-decoration: none;
}

.dev-name:hover {
  text-decoration: underline;
}

.dev-bio {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0 8px 0;
}

.dev-tech {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tech-tag {
  padding: 2px 8px;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 11px;
  border-radius: 4px;
  font-weight: 500;
}

.footer-text {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-secondary);
  margin-top: 24px;
}

.footer-text p {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 4px 0;
}
</style>