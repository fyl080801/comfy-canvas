<script setup lang="ts">
import { useDesignCanvas, useDesignNode, useNodeProvider } from '@/hooks/canvas'
import type { EditTypes } from '@/lib/types'
import { Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
// import { Card, CardContent } from './ui/card'
// import { Button } from './ui/button'
import { ElButton, ElCard, ElSlider } from 'element-plus'
import { EditorSender } from 'vue-element-plus-x'
import { Delete } from '@element-plus/icons-vue'
import * as fabric from 'fabric'
import { uploadImage } from '@/utils/s3'
import type { SubmitResult } from 'vue-element-plus-x/types/EditorSender'

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

const onClear = () => {
  if (!canvas.value) return
  canvas.value.clear()
  canvas.value.renderAll()
}

const prompt = ref('')

const { imageUrl } = useDesignNode()
const { createProvider } = useNodeProvider()
const onSubmit = async (text?: SubmitResult) => {
  if (!imageUrl.value) return

  const dataURL = canvas.value!.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 1,
  })

  // 将dataURL转换为blob
  const blob = await (await fetch(dataURL)).blob()

  const uploaded = await uploadImage({
    file: blob,
  })

  const prompt = editType.value === 'eraser' ? '擦除' : text ? text.text : ''

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
    selection: false,
    isDrawingMode: false,
  })

  // 设置画笔模式
  canvas.value.freeDrawingBrush = new fabric.PencilBrush(canvas.value)
  canvas.value.freeDrawingBrush.color = 'white'
  canvas.value.freeDrawingBrush.width = strokeWidth.value

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
    <!-- <Card>
      <CardContent>
        <div class="flex flex-col gap-[8px]">
          <div class="flex gap-[8px]">
            <Button>铅笔</Button>
          </div>
        </div>
      </CardContent>
    </Card> -->
    <ElCard body-class="draw-content">
      <div class="flex w-full" @click.stop @mousedown.stop>
        <!-- <ElButton :icon="EditPen"></ElButton> -->

        <div class="flex-1 overflow-hidden relative px-[12px]">
          <ElSlider v-model="strokeWidth" :min="5" :max="50"></ElSlider>
        </div>
        <ElButton :icon="Delete" @click="onClear"></ElButton>
        <ElButton v-if="!isShowSender" @click="onSubmit()">提交</ElButton>
      </div>
      <EditorSender v-if="isShowSender" v-model="prompt" variant="updown" @submit="onSubmit" />
    </ElCard>
  </NodeToolbar>
</template>

<style lang="scss">
.inner {
  width: 100%;
  height: 100%;
  position: relative;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.draw-content {
  padding: 8px;
  width: 376px;

  display: flex;
  flex-direction: column;
  gap: 8px;

  overflow: hidden;
}
</style>
