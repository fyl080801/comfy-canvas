<script setup lang="ts">
import { useIsActive, useIsEmpty, useCurrentEditType, useIsProcessing } from '@/hooks/canvas'
import type { EditTypes, LeaferNodeProps } from '@/lib/types'
import { Position, useVueFlow, type NodeProps } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { ElButton, ElCard } from 'element-plus'

defineProps<NodeProps<LeaferNodeProps>>()

const emit = defineEmits(['change-type'])

const {} = useVueFlow()

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
</script>

<template>
  <NodeToolbar :is-visible="isActive && !isEmpty && !isProcessing" :position="Position.Top">
    <ElCard class="node-tools" body-class="node-tools__body">
      <ElButton
        text
        :type="editType === 'redraw' ? 'primary' : 'default'"
        :bg="editType === 'redraw'"
        @click="onEdit('redraw')"
        >重绘</ElButton
      >
      <ElButton
        text
        :type="editType === 'eraser' ? 'primary' : 'default'"
        :bg="editType === 'eraser'"
        @click="onEdit('eraser')"
        >擦除</ElButton
      >
      <ElButton
        text
        :type="editType === 'hd' ? 'primary' : 'default'"
        :bg="editType === 'hd'"
        @click="onEdit('hd')"
        >超分</ElButton
      >
      <ElButton
        text
        :type="editType === 'extend' ? 'primary' : 'default'"
        :bg="editType === 'extend'"
        @click="onEdit('extend')"
        >扩图</ElButton
      >
    </ElCard>
  </NodeToolbar>
</template>

<style lang="scss">
.node-tools {
  .node-tools__body {
    padding: 8px;
    display: flex;
    align-items: center;
  }
}
</style>
