<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import { Leafer, DragEvent, Pen, Platform } from 'leafer-ui'
import '@leafer-in/viewport'
import '@leafer-in/export' // 引入导出元素插件 //
import '@leafer-in/color'
import { uploadImage } from '@/utils/s3'
import { ApiService } from '../lib/api'
import { AliyunProvider } from '../lib/providers'

// u2Gh8iovZ85DpWTrLVfJVOPhYMEfTyCEyAGwM8rlMAaWhU94DduAYFuhRDnH

Platform.image.crossOrigin = 'anonymous'

const props = defineProps<
  NodeProps & {
    provider: 'aliyun'
    providerProps?: any
    initImageUrl?: string
  }
>()

const providers = {
  aliyun: AliyunProvider,
}

const emit = defineEmits(['called', 'success'])

const canvasRef = ref<HTMLDivElement>()

const leaferRef = ref<Leafer>()

const api = ref<ApiService>()

const canvasNodeWidth = ref(500)
const canvasNodeHeight = ref(300) // Default arbitrary height

const bgRef = ref<HTMLImageElement>()
const imageUrl = ref<string>(
  props.initImageUrl ??
    'https://raw.githubusercontent.com/CompVis/stable-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo.png',
)

const updateLeaferSize = (width: number, height: number) => {
  canvasNodeWidth.value = width || 500
  canvasNodeHeight.value = height || 500

  if (leaferRef.value) {
    leaferRef.value.width = width
    leaferRef.value.height = height
  }
}

const setupLeafer = () => {
  const leafer = new Leafer({
    view: canvasRef.value,
    type: 'design',
    width: canvasNodeWidth.value,
    height: canvasNodeHeight.value,
    move: {
      disabled: true,
    },
    zoom: {
      disabled: true,
    },
  })

  const pen = new Pen()

  leafer.add(pen)

  leafer.on(DragEvent.START, (e: DragEvent) => {
    const point = e.getPagePoint()
    pen.setStyle({ stroke: 'white', strokeWidth: 40, strokeCap: 'round', strokeJoin: 'round' })
    pen.moveTo(point.x, point.y)
  })

  leafer.on(DragEvent.DRAG, (e: DragEvent) => {
    const point = e.getPagePoint()
    pen.lineTo(point.x, point.y)
  })

  leaferRef.value = leafer
}

const setupService = () => {
  const currentApi = new ApiService({
    provider: new providers[props.provider]({ ...(props.providerProps || {}) }),
  })

  currentApi.on('processing', () => {})

  currentApi.on('complete', () => {
    emit('called')
  })

  currentApi.on('success', (payload) => {
    emit('success', { id: props.id, url: payload?.[0]?.url })
  })

  api.value = currentApi
}

onMounted(async () => {
  setupService()

  await nextTick()

  setupLeafer()

  if (bgRef.value) {
    if (bgRef.value.complete) {
      updateLeaferSize(bgRef.value.naturalWidth, bgRef.value.naturalHeight)
    } else {
      bgRef.value.addEventListener('load', () => {
        updateLeaferSize(bgRef.value!.naturalWidth, bgRef.value!.naturalHeight)
      })
    }
  }
})

onBeforeUnmount(() => {
  leaferRef.value?.destroy()
})

const onExport = async () => {
  const result = await leaferRef.value?.export('file.png', {
    screenshot: true,
    fill: 'black',
  })
  console.log(result)
}

const onCallInpaint = async () => {
  const result = await leaferRef.value?.export('png', {
    blob: true,
    screenshot: true,
    fill: 'black',
  })

  const uploaded = await uploadImage({
    file: result?.data,
  })

  api.value?.inpaint({
    base_image_url: imageUrl.value,
    mask_image_url: uploaded,
    prompt: 'a cat',
  })
}
</script>

<template>
  <div
    class="canvas-node"
    :style="{ width: canvasNodeWidth + 'px', height: canvasNodeHeight + 'px' }"
  >
    <div class="title">title</div>
    <div class="tools">
      <button @click="onExport">导出</button>
      <button @click="onCallInpaint">调用</button>
    </div>
    <img ref="bgRef" :src="imageUrl" class="inner bg" />
    <div ref="canvasRef" class="inner nodrag nopan"></div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style lang="scss">
.canvas-node {
  border: 1px solid #ccc; /* Add a border for visibility */

  .title {
    height: 30px;
    background-color: blue;
    color: white;
    font-size: 14px;
    text-align: center;
  }

  .tools {
    height: 30px;
    display: flex;
    gap: 5px;
    padding: 5px;
  }

  .inner {
    position: absolute !important;
    top: 60px; /* Adjusted to make space for the title */
    bottom: 0;
    right: 0;
    left: 0;
    z-index: 1; /* Ensure canvas is above the background image */
  }

  .inner.bg {
    z-index: -1; /* Ensure canvas is above the background image */
  }
}
</style>
