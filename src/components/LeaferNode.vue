<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import { Leafer, DragEvent, Pen, Platform } from 'leafer-ui'
import '@leafer-in/viewport'
import '@leafer-in/export' // 引入导出元素插件 //
import '@leafer-in/color'
import { uploadImage } from '@/utils/s3'
import { ApiService } from '../lib/api'
import { AliyunProvider } from '../lib/providers'
import { useIsActive } from '@/hooks/canvas'
import type { LeaferNodeProps } from '@/lib/types'
import { ElButton } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

// u2Gh8iovZ85DpWTrLVfJVOPhYMEfTyCEyAGwM8rlMAaWhU94DduAYFuhRDnH

Platform.image.crossOrigin = 'anonymous'

const props = defineProps<NodeProps<LeaferNodeProps>>()

const providers = {
  aliyun: AliyunProvider,
}

const emit = defineEmits(['called', 'success', 'node-click'])

const isActive = useIsActive(props.id)

const canvasRef = ref<HTMLDivElement>()

const leaferRef = ref<Leafer>()

const api = ref<ApiService>()

const canvasNodeWidth = ref(500)
const canvasNodeHeight = ref(500)

const bgRef = ref<HTMLImageElement>()
const fileInputRef = ref<HTMLInputElement>()
const imageUrl = ref<string>()

const isEmpty = computed(() => {
  return !props.data.initImageUrl && !imageUrl.value
})

const updateLeaferSize = (width: number, height: number) => {
  console.log(width, height)
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
    if (!isActive.value) return

    const point = e.getPagePoint()
    pen.setStyle({ stroke: 'white', strokeWidth: 40, strokeCap: 'round', strokeJoin: 'round' })
    pen.moveTo(point.x, point.y)
  })

  leafer.on(DragEvent.DRAG, (e: DragEvent) => {
    if (!isActive.value) return

    const point = e.getPagePoint()
    pen.lineTo(point.x, point.y)
  })

  leafer.disabled = true

  leaferRef.value = leafer
}

const setupService = () => {
  const currentApi = new ApiService({
    provider: new providers[props.data.provider]({ ...(props.data.providerProps || {}) }),
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

const setupCanvas = () => {
  if (!bgRef.value) return

  if (bgRef.value.complete) {
    updateLeaferSize(bgRef.value.naturalWidth, bgRef.value.naturalHeight)
  } else {
    bgRef.value.addEventListener('load', () => {
      console.log(bgRef.value!.naturalHeight)
      updateLeaferSize(bgRef.value!.naturalWidth, bgRef.value!.naturalHeight)
    })
  }
}

const resetCanvas = () => {
  if (!bgRef.value) return
  bgRef.value.addEventListener('load', () => {
    console.log(bgRef.value!.naturalHeight)
    updateLeaferSize(bgRef.value!.naturalWidth, bgRef.value!.naturalHeight)
  })
}

const uploading = ref(false)
const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]

    if (!file) return

    try {
      uploading.value = true
      const uploadedUrl = await uploadImage({ file })
      imageUrl.value = uploadedUrl
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      uploading.value = false
    }
  }
}

onMounted(() => {
  if (props.data.initImageUrl) {
    imageUrl.value = props.data.initImageUrl
  }

  setupService()
  setupCanvas()
  setupLeafer()
})

onBeforeUnmount(() => {
  leaferRef.value?.destroy()
})

// 解决鼠标绘制后仍触发点击
let isDragging = false
let startX = 0
let startY = 0
const onNodeClick = (e: MouseEvent) => {
  if (isDragging) {
    e.preventDefault()
    e.stopPropagation()
    return
  }

  emit('node-click', props.id)
}
const onMouseDown = (e: MouseEvent) => {
  isDragging = false // 重置标识
  startX = e.clientX
  startY = e.clientY
}
const onMouseMove = (e: MouseEvent) => {
  if (Math.abs(e.clientX - startX) > 0 || Math.abs(e.clientY - startY) > 0) {
    isDragging = true
  }
}

// const editType = ref()
const onRemove = async () => {
  if (!imageUrl.value) return

  const result = await leaferRef.value?.export('png', {
    blob: true,
    screenshot: true,
    fill: 'black',
  })

  const uploaded = await uploadImage({
    file: result?.data,
  })

  // editType.value = 'Remove'
  api.value?.inpaint({
    base_image_url: imageUrl.value,
    mask_image_url: uploaded,
    prompt: 'remove area',
  })
}
// watch(editType, () => {
//   if (!leaferRef.value) return

//   if (!editType.value) {
//     leaferRef.value.disabled = true
//     return
//   }

//   leaferRef.value.disabled = false
// })

watch(
  () => isActive.value,
  (value, origin) => {
    if (value === origin) return
    // if (!leaferRef.value) return

    // if (value) {
    //   leaferRef.value.disabled = false
    // } else {
    //   leaferRef.value.disabled = true
    // }
  },
)

watch(
  () => imageUrl.value,
  async () => {
    resetCanvas()
  },
)
</script>

<template>
  <div
    class="canvas-node"
    :class="{ active: isActive, empty: isEmpty }"
    :style="{ width: canvasNodeWidth + 'px', height: canvasNodeHeight + 'px' }"
    @click="onNodeClick"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
  >
    <div v-if="isActive && !isEmpty" class="tools bg-gray-200">
      <ElButton type="text" :icon="Delete" @click="onRemove">擦除</ElButton>
    </div>

    <img ref="bgRef" :src="imageUrl" class="inner bg" />
    <!-- <div ref="canvasRef" class="inner nodrag nopan"></div> -->
    <div
      ref="canvasRef"
      class="inner"
      :class="{
        nodrag: isActive,
        nopan: isActive,
      }"
    ></div>

    <div
      v-if="isEmpty"
      class="empty-content absolute inset-0 flex items-center justify-center cursor-pointer"
    >
      <input
        type="file"
        ref="fileInputRef"
        class="hidden"
        @change="onFileChange"
        accept="image/*"
      />
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        @click="fileInputRef?.click()"
      >
        上传图片
      </button>
    </div>
    <Handle type="source" :position="Position.Right" />
    <Handle type="target" :position="Position.Left" />
  </div>
</template>

<style lang="scss">
.canvas-node {
  border: 2px solid; /* Add a border for visibility */
  border-color: rgba(225, 225, 225, 0.85);
  border-radius: 20px;
  background-color: transparent;
  position: relative;
  overflow: visible;

  &.empty {
    background-color: #c8c8c8;
  }

  &.active {
    border-color: rgba(54, 214, 0, 0.85);
  }

  .tools {
    position: absolute;
    top: -48px;
    left: 0;
    right: 0;
    z-index: 10;
    height: 40px;

    border-radius: 8px;
    background-color: rgba(225, 225, 225, 0.85);

    display: flex;
    align-items: center;

    padding-left: 8px;
    padding-right: 8px;
  }

  .inner {
    position: absolute !important;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    z-index: 0; /* Ensure canvas is above the background image */
    transition: top 0.3s ease; /* Add transition for smooth movement */

    &.bg {
      z-index: -1; /* Ensure canvas is above the background image */
    }
  }
}
</style>
