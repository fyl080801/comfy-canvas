<script setup lang="ts">
import { useDesignCanvas, useDesignNode, useNodeProvider } from '@/hooks/canvas'
import { Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { ElButton, ElCard } from 'element-plus'

const scales = [1, 2, 3, 4]

const { emit, id: nodeId, imageUrl } = useDesignNode()
const { clearActive } = useDesignCanvas()
const { createProvider } = useNodeProvider()

const onSubmit = async (value: number) => {
  if (!imageUrl.value) return

  const input = imageUrl.value

  emit('next', nodeId, {
    provider: 'aliyun',
    process: async () => {
      const { resolve, reject, promise } = Promise.withResolvers<string>()

      const api = createProvider()

      const data = {
        base_image_url: input,
      }

      await api.resolution({
        ...data,
        prompt: '图像超分',
        factor: value,
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
</script>

<template>
  <NodeToolbar :is-visible="true" :position="Position.Bottom">
    <ElCard body-class="upscaletool-content">
      <div @click.stop @mousedown.stop>
        <ElButton v-for="item in scales" :key="item" @click="onSubmit(item)">x{{ item }}</ElButton>
      </div>
    </ElCard>
  </NodeToolbar>
</template>

<style lang="scss">
.upscaletool-content {
  padding: 8px;
  display: block;
  width: auto;
}
</style>
