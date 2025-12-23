<script setup lang="ts">
import { useDesignCanvas, useDesignNode, useNodeProvider } from '@/hooks/canvas'
import { Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const scales = [1.1, 1.2, 1.3, 1.4, 1.5]

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

      await api.expand({
        ...data,
        prompt: '补全图像',
        scale: value,
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
    <Card>
      <CardContent class="extend-content">
        <div @click.stop @mousedown.stop>
          <Button
            v-for="item in scales"
            :key="item"
            variant="secondary"
            @click="onSubmit(item)"
            class="mr-2"
            >x{{ item }}</Button
          >
        </div>
      </CardContent>
    </Card>
  </NodeToolbar>
</template>

<style lang="scss">
.extend-content {
  padding: 8px;
  display: block;
  width: auto;
}
</style>
