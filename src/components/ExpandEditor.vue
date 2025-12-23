<script setup lang="ts">
import { useDesignCanvas, useDesignNode, useNodeProvider } from '@/hooks/canvas'
import { Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const scales = [
  { value: 1.1, label: 'x1.1', desc: '扩展10%' },
  { value: 1.2, label: 'x1.2', desc: '扩展20%' },
  { value: 1.3, label: 'x1.3', desc: '扩展30%' },
  { value: 1.4, label: 'x1.4', desc: '扩展40%' },
  { value: 1.5, label: 'x1.5', desc: '扩展50%' },
]

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
        <TooltipProvider>
          <div @click.stop @mousedown.stop class="flex gap-2">
            <Tooltip v-for="item in scales" :key="item.value">
              <TooltipTrigger as-child>
                <Button
                  variant="secondary"
                  @click="onSubmit(item.value)"
                  size="sm"
                >
                  {{ item.label }}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{{ item.desc }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
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
