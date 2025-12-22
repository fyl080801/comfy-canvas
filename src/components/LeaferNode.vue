<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from 'vue'
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import '@leafer-in/viewport'
import '@leafer-in/export' // 引入导出元素插件 //
import '@leafer-in/color'
import { uploadImage } from '@/utils/s3'
import { useDesignNode, useIsActive } from '@/hooks/canvas'
import type { LeaferNodeProps } from '@/lib/types'
import NodeTools from './NodeTools.vue'
import { ElCard } from 'element-plus'
import { type EditTypes, type NodeEmitEvents } from '../lib/types'
import DrawEditor from './DrawEditor.vue'
import UpscaleEditor from './UpscaleEditor.vue'
import ExpandEditor from './ExpandEditor.vue'

// u2Gh8iovZ85DpWTrLVfJVOPhYMEfTyCEyAGwM8rlMAaWhU94DduAYFuhRDnH

const props = defineProps<NodeProps<LeaferNodeProps>>()

const emit = defineEmits<NodeEmitEvents>()

const isActive = useIsActive(props.id)

const nodeBound = ref([500, 500])

const bgRef = ref<HTMLImageElement>()
const fileInputRef = ref<HTMLInputElement>()
const imageUrl = ref<string | undefined>()

const isEmpty = computed(() => {
  return !props.data.initImageUrl && !imageUrl.value
})

const updateLeaferSize = () => {
  if (!bgRef.value) return

  nodeBound.value = [bgRef.value.naturalWidth || 500, bgRef.value.naturalHeight || 500]
}

let cleanupFunctions: (() => void)[] = []

const setupCanvas = async () => {
  if (!bgRef.value) return

  // 清理之前的事件监听器
  cleanupFunctions.forEach((cleanup) => cleanup())
  cleanupFunctions = []

  // 重置状态

  const handleLoad = async () => {
    processing.value = false
    await nextTick()
    updateLeaferSize()
  }

  const handleError = () => {
    processing.value = false
    // console.error('图片加载失败')
  }

  // 如果图片已经加载完成且成功
  if (bgRef.value.complete) {
    if (bgRef.value.naturalWidth > 0) {
      // 图片成功加载
      processing.value = false
      await handleLoad()
    } else {
      // 图片加载失败（complete但naturalWidth为0）
      handleError()
    }
  } else {
    // 监听加载事件
    bgRef.value.addEventListener('load', handleLoad)
    bgRef.value.addEventListener('error', handleError)

    // 保存清理函数
    cleanupFunctions.push(() => {
      bgRef.value?.removeEventListener('load', handleLoad)
      bgRef.value?.removeEventListener('error', handleError)
    })
  }
}

const handleImageError = () => {
  processing.value = false
}

const processing = ref(false)
const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]

    if (!file) return

    try {
      processing.value = true
      const uploadedUrl = await uploadImage({ file })
      imageUrl.value = uploadedUrl
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      processing.value = false
    }
  }
}

onMounted(async () => {
  if (typeof props.data.process === 'function') {
    // 调用异步的process方法并在未结束时展示 class="node-processing" 的loading层
    try {
      processing.value = true
      const result = await props.data.process()
      imageUrl.value = result
    } catch (error) {
      console.error('Process method failed:', error)
    } finally {
      processing.value = false
    }
  } else if (props.data.initImageUrl) {
    imageUrl.value = props.data.initImageUrl
  }

  await nextTick()

  setupCanvas()
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  cleanupFunctions.forEach((cleanup) => cleanup())
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

watch(
  () => isActive.value,
  (value, origin) => {
    if (value === origin) return

    if (!value) {
      editType.value = null
    }
  },
)

watch(
  () => imageUrl.value,
  async (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
      if (newUrl) {
        // 有新图片URL，开始加载过程
        processing.value = true

        // 等待DOM更新后重新设置canvas
        await nextTick()
        setupCanvas()
      } else {
        // 图片URL被清空
        processing.value = false
      }
    }
  },
)

const editType = ref<EditTypes | undefined | null>()
const onChangeType = (value: EditTypes) => {
  editType.value = value
}
const isShowEditor = computed(() => {
  if (!editType.value) return

  return (<EditTypes[]>['redraw', 'eraser']).includes(editType.value)
})
const isShowUpscale = computed(() => {
  return editType.value === 'hd'
})
const isShowExpand = computed(() => {
  return editType.value === 'extend'
})

const nodeStyle = computed(() => {
  return {
    width: nodeBound.value[0] + 'px',
    height: nodeBound.value[1] + 'px',
  }
})

useDesignNode({
  id: props.id,
  imageUrl,
  editType,
  processing,
  nodeBound,
  emit,
})
</script>

<template>
  <ElCard
    :key="id"
    class="canvas-node"
    :class="{ active: isActive, empty: isEmpty, processing: processing }"
    :style="nodeStyle"
    body-class="node-body"
    :shadow="isActive ? 'always' : 'hover'"
    @click="onNodeClick"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
  >
    <div class="bg-wrapper">
      <img ref="bgRef" :src="imageUrl" class="bg" @load="setupCanvas" @error="handleImageError" />
    </div>

    <DrawEditor v-if="isShowEditor"></DrawEditor>
    <UpscaleEditor v-if="isShowUpscale"></UpscaleEditor>
    <ExpandEditor v-if="isShowExpand"></ExpandEditor>

    <div
      v-if="isEmpty && !processing"
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

    <div class="node-border"></div>

    <div v-if="processing" class="node-processing">
      <div class="loading-spinner"></div>
      <div class="loading-text">处理中...</div>
    </div>

    <NodeTools v-bind="$props" @change-type="onChangeType"></NodeTools>

    <Handle type="source" :position="Position.Right" />
    <Handle type="target" :position="Position.Left" />
  </ElCard>
</template>

<style lang="scss">
.canvas-node {
  border-radius: 20px;
  background-color: transparent;
  position: relative;
  overflow: visible;
  box-sizing: content-box;

  .node-body {
    padding: 0;
    overflow: hidden;
  }

  &.empty {
    background-color: #fff;
  }

  .node-border {
    display: none;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    border: 2px solid silver;
    border-radius: 20px;

    pointer-events: none;
  }
  &.active {
    .node-border {
      display: block;
    }
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

  .bg-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 20px;
  }

  .node-processing {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    .loading-text {
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
  }

  &.processing {
    pointer-events: none;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .image-error {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    z-index: 50;

    .error-text {
      color: #ff4444;
      font-size: 14px;
      font-weight: 500;
    }
  }
}
</style>
