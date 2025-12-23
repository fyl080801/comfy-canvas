<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from 'vue'
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import { uploadImage } from '@/utils/s3'
import { useDesignNode, useIsActive } from '@/hooks/canvas'
import type { LeaferNodeProps } from '@/lib/types'
import NodeTools from './NodeTools.vue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type EditTypes, type NodeEmitEvents } from '../lib/types'
import DrawEditor from './DrawEditor.vue'
import UpscaleEditor from './UpscaleEditor.vue'
import ExpandEditor from './ExpandEditor.vue'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { Input } from '@/components/ui/input'

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
  if (isDragging || editType.value) {
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

const nodeTitle = ref(props.data?.title ?? 'Image')
const isEditingTitle = ref(false)
const titleInputRef = ref<HTMLInputElement>()

watch(
  () => props.data?.title,
  (newTitle) => {
    if (typeof newTitle === 'string' && newTitle !== nodeTitle.value) {
      nodeTitle.value = newTitle
    }
  },
)

const beginEditTitle = async () => {
  isEditingTitle.value = true
  await nextTick()
  // titleInputRef.value?.focus()
  // titleInputRef.value?.select()
}

const finishEditTitle = () => {
  isEditingTitle.value = false
}

const onTitleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    finishEditTitle()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    isEditingTitle.value = false
  }
}

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
  <Card
    :key="id"
    class="canvas-node border border-border/80 bg-card shadow-sm transition-all duration-200"
    :class="{
      'is-active': isActive,
      'is-empty': isEmpty,
      'is-processing': processing,
    }"
    :style="nodeStyle"
    @click="onNodeClick"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
  >
    <div class="node-body">
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
        <Button
          size="sm"
          class="font-medium shadow-sm hover:shadow transition-all"
          @click="fileInputRef?.click()"
        >
          上传图片
        </Button>
      </div>

      <div class="node-border"></div>

      <div v-if="processing" class="node-processing">
        <div class="loading-spinner"></div>
        <div class="loading-text">处理中...</div>
      </div>

      <NodeTools v-bind="$props" @change-type="onChangeType"></NodeTools>
      <NodeToolbar :is-visible="isActive" align="start">
        <div class="toolbar-title" @click="!isEditingTitle && beginEditTitle()">
          <Input
            v-if="isEditingTitle"
            ref="titleInputRef"
            v-model="nodeTitle"
            class="h-7 w-28 text-sm"
            @blur="finishEditTitle"
            @keydown="onTitleKeydown"
          />
          <span v-else class="title-text">{{ nodeTitle || '未命名' }}</span>
        </div>
      </NodeToolbar>

      <Handle type="source" :position="Position.Right" />
      <Handle type="target" :position="Position.Left" />
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.canvas-node {
  border-radius: 18px;
  position: relative;
  overflow: visible;
  box-sizing: content-box;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(245, 246, 250, 0.9));

  .node-body {
    padding: 0;
    overflow: hidden;
    border-radius: 16px;
  }

  &.is-empty {
    background: linear-gradient(180deg, rgba(249, 250, 251, 0.94), rgba(243, 244, 246, 0.92));
  }

  .node-border {
    opacity: 0;
    position: absolute;
    inset: 0;
    border: 2px solid rgba(99, 102, 241, 0.55);
    border-radius: 18px;
    pointer-events: none;
    transition:
      opacity 150ms ease,
      box-shadow 150ms ease;
    box-shadow:
      0 0 0 6px rgba(99, 102, 241, 0.18),
      0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &:hover .node-border {
    opacity: 0.7;
    box-shadow:
      0 0 0 6px rgba(59, 130, 246, 0.18),
      0 10px 28px rgba(0, 0, 0, 0.12);
  }

  &.is-active .node-border {
    opacity: 1;
    box-shadow:
      0 0 0 7px rgba(59, 130, 246, 0.28),
      0 14px 34px rgba(0, 0, 0, 0.16);
  }

  .toolbar-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.4);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: text;
    min-width: 96px;

    .title-text {
      font-size: 13px;
      color: #0f172a;
      white-space: nowrap;
    }
  }

  .bg-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 16px;

    img.bg {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .empty-content {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(248, 250, 252, 0.82));
    border: 1px dashed rgba(148, 163, 184, 0.7);
    border-radius: 16px;
    backdrop-filter: blur(4px);
  }

  .node-processing {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.15), transparent 40%),
      radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.12), transparent 45%),
      rgba(15, 23, 42, 0.78);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    gap: 12px;

    .loading-spinner {
      width: 42px;
      height: 42px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #4f46e5;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }

    .loading-text {
      color: #e2e8f0;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
  }

  &.is-processing {
    pointer-events: none;
    filter: saturate(0.8);
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
