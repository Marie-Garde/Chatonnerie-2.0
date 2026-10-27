import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { restoreCachedTheme } from './lib/themes'

restoreCachedTheme()

createApp(App).use(createPinia()).use(router).mount('#app')
