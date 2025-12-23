<script setup lang="ts">
import {
  useIsActive,
  useIsEmpty,
  useCurrentEditType,
  useIsProcessing,
  // useDesignNode,
} from '@/hooks/canvas'
import type { EditTypes, LeaferNodeProps } from '@/lib/types'
import { Position, useVueFlow, type NodeProps } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brush, Eraser, ZoomIn, Expand } from 'lucide-vue-next'

defineProps<NodeProps<LeaferNodeProps>>()

const emit = defineEmits(['change-type'])

const {} = useVueFlow()

// const { emit: nodeEmit, id: nodeId, imageUrl } = useDesignNode()

const isActive = useIsActive()
const isEmpty = useIsEmpty()
const isProcessing = useIsProcessing()
const editType = useCurrentEditType()

const onEdit = (type: EditTypes) => {
  if (editType.value !== type) {
    emit('change-type', type)
  } else {
    emit('change-type', null)
  }
}

// const onTest = () => {
//   nodeEmit('next', nodeId, {
//     initImageUrl: imageUrl.value,
//     provider: 'aliyun',
//   })
// }
</script>

<template>
  <NodeToolbar
    :is-visible="isActive && !isEmpty && !isProcessing"
    :offset="40"
    :position="Position.Top"
  >
    <Card class="node-tools border-border/80 shadow-sm">
      <CardContent class="node-tools__body">
        <Button
          :variant="editType === 'redraw' ? 'default' : 'outline'"
          size="sm"
          @click="onEdit('redraw')"
        >
          <Brush class="w-4 h-4 mr-1" />
          重绘
        </Button>
        <Button
          :variant="editType === 'eraser' ? 'default' : 'outline'"
          size="sm"
          @click="onEdit('eraser')"
        >
          <Eraser class="w-4 h-4 mr-1" />
          擦除
        </Button>
        <Button
          :variant="editType === 'hd' ? 'default' : 'outline'"
          size="sm"
          @click="onEdit('hd')"
        >
          <ZoomIn class="w-4 h-4 mr-1" />
          超分
        </Button>
        <Button
          :variant="editType === 'extend' ? 'default' : 'outline'"
          size="sm"
          @click="onEdit('extend')"
        >
          <Expand class="w-4 h-4 mr-1" />
          扩图
        </Button>
        <!-- <Button :variant="editType === 'extend' ? 'default' : 'outline'" size="sm" @click="onTest">
          测试
        </Button> -->
      </CardContent>
    </Card>
  </NodeToolbar>
</template>

<style lang="scss">
.node-tools {
  .node-tools__body {
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
