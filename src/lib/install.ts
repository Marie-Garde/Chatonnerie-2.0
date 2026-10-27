import { ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const installPrompt = ref<BeforeInstallPromptEvent | null>(null)

export const isStandalone = ref(
  window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true,
)

export const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  installPrompt.value = event as BeforeInstallPromptEvent
})

window.addEventListener('appinstalled', () => {
  installPrompt.value = null
  isStandalone.value = true
})

export async function promptInstall() {
  const event = installPrompt.value
  if (!event) return
  await event.prompt()
  await event.userChoice
  installPrompt.value = null
}
