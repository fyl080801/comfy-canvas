<script setup lang="ts">
import { useDesignCanvas, useDesignNode, useNodeProvider } from '@/hooks/canvas'
import type { EditTypes } from '@/lib/types'
import { Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Slider } from './ui/slider'
import { Textarea } from './ui/textarea'
import * as fabric from 'fabric'
import { uploadImage } from '@/utils/s3'
import { Send } from 'lucide-vue-next'

const { editType, emit, id: nodeId, nodeBound } = useDesignNode()
const { clearActive } = useDesignCanvas()

const canvasRef = ref<HTMLDivElement>()

// const isActive = useIsActive()
// const isShow = computed(() => {
//   if (!editType.value) return false

//   return (<EditTypes[]>['eraser', 'redraw']).includes(editType.value)
// })

const isShowSender = computed(() => {
  return editType.value === 'redraw'
})

const strokeWidth = ref(40)

const strokeWidthModel = computed<number[]>({
  get: () => [strokeWidth.value],
  set: (val) => {
    if (Array.isArray(val) && typeof val[0] === 'number') {
      strokeWidth.value = val[0]
    }
  },
})

const onClear = () => {
  if (!canvas.value) return
  canvas.value.clear()
  canvas.value.renderAll()
}

// 创建用于导出的遮罩图像，黑色背景白色画笔
const createMaskImage = async (): Promise<string> => {
  if (!canvas.value) return ''

  // 创建一个临时画布来处理遮罩（保持背景透明，仅保留笔触为白色）
  const tempCanvas = document.createElement('canvas')
  const ctx = tempCanvas.getContext('2d')
  if (!ctx) return ''

  const originalCanvas = canvas.value.getElement()

  tempCanvas.width = canvas.value.width || 500
  tempCanvas.height = canvas.value.height || 500

  // 直接绘制原始画布（背景透明）
  ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
  ctx.drawImage(originalCanvas, 0, 0)

  // 获取图像数据以处理透明像素
  const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
  const pixels = imageData.data

  // 处理像素：将绘制的部分保持白色，未绘制的部分保持完全透明
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3] // Alpha通道
    if (alpha && alpha > 0) {
      pixels[i] = 255 // R
      pixels[i + 1] = 255 // G
      pixels[i + 2] = 255 // B
      pixels[i + 3] = 255 // Alpha (完全不透明)
    } else {
      pixels[i] = 0
      pixels[i + 1] = 0
      pixels[i + 2] = 0
      pixels[i + 3] = 0 // 完全透明，保留透明网格
    }
  }

  ctx.putImageData(imageData, 0, 0)

  // 导出为PNG（透明背景）
  return tempCanvas.toDataURL('image/png', 1.0)
}

const prompt = ref('')
const handlePromptSubmit = () => {
  if (!prompt.value.trim()) return
  onSubmit(prompt.value.trim())
  prompt.value = ''
}
const handlePromptKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handlePromptSubmit()
  }
}

const { imageUrl } = useDesignNode()
const { createProvider } = useNodeProvider()
const onSubmit = async (text?: string) => {
  if (!imageUrl.value) return

  // 确保画布内容正确渲染
  canvas.value!.renderAll()

  // 使用遮罩创建函数生成正确的遮罩图像
  const maskDataURL = await createMaskImage()
  if (!maskDataURL) return

  // 将遮罩数据URL转换为blob
  const blob = await (await fetch(maskDataURL)).blob()

  const uploaded = await uploadImage({
    file: blob,
  })

  const prompt = editType.value === 'eraser' ? '擦除' : text || ''

  const input = imageUrl.value

  emit('next', nodeId, {
    provider: 'aliyun',
    process: async () => {
      const { resolve, reject, promise } = Promise.withResolvers<string>()

      const api = createProvider()

      const data = {
        base_image_url: input,
        mask_image_url: uploaded,
      }

      await api.inpaint({
        ...data,
        prompt,
      })

      const onSuccess = (urls: { url: string }[]) => {
        api.off('success', onSuccess)

        if (!urls?.[0]?.url) {
          reject(new Error('生成失败'))
          return
        }

        resolve(urls?.[0]?.url)
      }

      api.on('success', onSuccess)

      return promise
    },
  })

  clearActive()
}

const fixedEdit = computed(() => {
  if (!editType.value) return false

  return (<EditTypes[]>['eraser', 'redraw']).includes(editType.value)
})

const canvas = ref<fabric.Canvas>()
const setupFabric = () => {
  if (!canvasRef.value) return

  const bound = canvasRef.value.getBoundingClientRect()

  // 创建fabric画布
  const canvasElement = document.createElement('canvas')
  canvasRef.value.appendChild(canvasElement)

  canvas.value = new fabric.Canvas(canvasElement, {
    width: bound.width,
    height: bound.height,
    backgroundColor: 'transparent',
    // 确保画布背景完全透明
    renderOnAddRemove: false,
    selection: false,
    isDrawingMode: false,
    // 禁用抗锯齿以保持边缘清晰
    enableRetinaScaling: false,
    imageSmoothingEnabled: false,
  })

  // 设置画笔模式
  canvas.value.freeDrawingBrush = new fabric.PencilBrush(canvas.value)
  canvas.value.freeDrawingBrush.color = 'white'
  canvas.value.freeDrawingBrush.width = strokeWidth.value

  // 配置画笔属性以增强可见性和防止网格干扰
  const brush = canvas.value.freeDrawingBrush
  if (brush && brush._render) {
    const originalRender = brush._render
    brush._render = function () {
      const ctx = this.canvas.contextTop || this.canvas.contextContainer
      if (ctx) {
        // 禁用图像平滑以保持边缘清晰
        ctx.imageSmoothingEnabled = false
        // 设置画笔合成模式以避免背景干扰
        ctx.globalCompositeOperation = 'source-over'
        // 确保画笔完全不透明
        ctx.globalAlpha = 1.0
      }
      originalRender.call(this)
    }
  }

  // 监听鼠标事件
  // 启用自由绘制模式
  canvas.value.isDrawingMode = true
}

watch(
  () => strokeWidth.value,
  (newWidth) => {
    if (canvas.value && canvas.value.freeDrawingBrush) {
      canvas.value.freeDrawingBrush.width = newWidth
    }
  },
)

watch(
  () => nodeBound.value,
  ([width = 500, height = 500]) => {
    if (!canvas.value) return

    canvas.value.setDimensions({
      width,
      height,
    })
  },
)

const resizeObserver = ref<ResizeObserver>()

const observeCanvasResize = () => {
  if (!canvasRef.value) return

  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      if (canvas.value) {
        canvas.value.setDimensions({
          width,
          height,
        })
        canvas.value.renderAll()
      }
    }
  })

  resizeObserver.value.observe(canvasRef.value)
}

const cleanupObserver = () => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = undefined
  }
}

onMounted(() => {
  setupFabric()
  observeCanvasResize()
})

onUnmounted(() => {
  cleanupObserver()
})
</script>

<template>
  <div
    ref="canvasRef"
    class="inner"
    :class="{
      nodrag: fixedEdit,
      nopan: fixedEdit,
    }"
  ></div>
  <NodeToolbar :is-visible="true" :position="Position.Bottom">
    <Card class="draw-content">
      <CardContent class="p-4">
        <div class="flex w-full items-center gap-3" @click.stop @mousedown.stop>
          <div class="flex-1 overflow-visible relative px-[4px]">
            <div class="flex items-center gap-2 py-1">
              <span class="text-xs text-muted-foreground shrink-0">笔刷</span>
              <Slider v-model="strokeWidthModel" :min="5" :max="50" :step="1" class="w-full" />
              <span class="text-xs text-muted-foreground w-10 text-right">{{ strokeWidth }}</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" @click="onClear">清除</Button>
          <Button v-if="!isShowSender" size="sm" @click="onSubmit()">提交</Button>
        </div>
        <div v-if="isShowSender" class="mt-3 relative">
          <Textarea
            v-model="prompt"
            class="pr-14"
            placeholder="输入重绘提示词..."
            :rows="4"
            @keydown="handlePromptKeydown"
          />
          <Button size="sm" class="absolute right-2 bottom-2 h-8 px-3" @click="handlePromptSubmit">
            <Send class="w-4 h-4 mr-1" />
            发送
          </Button>
        </div>
      </CardContent>
    </Card>
  </NodeToolbar>
</template>

<style lang="scss" scoped>
.inner {
  position: absolute !important;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  z-index: 0;
  transition: top 0.3s ease;
  overflow: hidden;
}

.inner {
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    background-color: transparent !important;
  }
}

.draw-content {
  width: 376px;
  overflow: hidden;
}
</style>
