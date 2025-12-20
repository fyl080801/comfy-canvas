import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeS3 } from './utils/s3'

initializeS3({
  region: 'default',
  accessKeyId: 'rIC0yObtke0pRVeVObd1',
  secretAccessKey: '0T7c641Fd1niLjs3UogJ8vy4hVA81iCAqbwHCk5O',
  bucket: 'temp'
})

const app = createApp(App)

app.use(router)

app.mount('#app')
