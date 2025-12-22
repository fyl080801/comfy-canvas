import './styles/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeS3 } from './utils/s3'

initializeS3({
  region: 'default',
  accessKeyId: 'rIC0yObtke0pRVeVObd1',
  secretAccessKey: '0T7c641Fd1niLjs3UogJ8vy4hVA81iCAqbwHCk5O',
  bucket: 'temp',
})

// initializeS3({
//   endpoint: 'https://s3.cn-north-1.jdcloud-oss.com',
//   region: 'cn-north-1',
//   accessKeyId: 'JDC_8D6797C64943C43F08BBB6C00B55',
//   secretAccessKey: 'C903B372E95086520AF58450075AE088',
//   bucket: 'fyldev',
//   forcePathStyle: false,
// })

const app = createApp(App)

app.use(router)

app.mount('#app')
