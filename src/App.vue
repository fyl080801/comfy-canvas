<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { useVueFlow, VueFlow } from '@vue-flow/core'

// these components are only shown as examples of how to use a custom node or edge
// you can find many examples of how to create these custom components in the examples page of the docs
// import SpecialNode from './components/SpecialNode.vue'
import SpecialEdge from './components/SpecialEdge.vue'
import LeaferNode from './components/LeaferNode.vue'
import DropzoneBackground from './components/DropzoneBackground.vue'
import ToolsPanel from './components/ToolsPanel.vue'
import { ElButton } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useDesignCanvas, type DesignContext } from './hooks/canvas'
import type { LeaferNodeProps } from './lib/types'

// these are our nodes

const { addNodes, addEdges } = useVueFlow()

const context = reactive<DesignContext>({
  activeNodeId: null,
  processing: false,
})

const nodes = ref<Node<LeaferNodeProps>[]>([])

const edges = ref<Edge[]>([])

const onAdd = () => {
  const newId = crypto.randomUUID()

  addNodes([
    {
      id: newId,
      type: 'leafer',
      position: { x: 900, y: 200 },
      data: { provider: 'aliyun' },
    },
  ])

  context.activeNodeId = null
}

const onNodeClick = (id: string) => {
  if (context.activeNodeId === id) {
    context.activeNodeId = null
  } else {
    context.activeNodeId = id
  }
}

const onPaneClick = () => {
  context.activeNodeId = null
}

const onNextNode = (id: string, payload: any) => {
  const newId = crypto.randomUUID()

  addNodes([
    {
      id: newId,
      type: 'leafer',
      position: { x: 900, y: 200 },
      data: { provider: 'aliyun', ...payload },
    },
  ])

  addEdges([
    {
      id: crypto.randomUUID(),
      source: id,
      target: newId,
    },
  ])
}

useDesignCanvas({
  context,
  clearActive: () => {
    context.activeNodeId = null
  },
  toggleProcessing: (value) => {
    context.processing = value
  },
})
</script>

<template>
  <div class="main">
    <VueFlow
      ref="canvasRef"
      :nodes="nodes"
      :edges="edges"
      :min-zoom="0.1"
      class="draw-flow"
      @pane-click="onPaneClick"
    >
      <!-- bind your custom node type to a component by using slots, slot names are always `node-<type>` -->
      <!-- <template #node-special="specialNodeProps">
        <SpecialNode v-bind="specialNodeProps" />
      </template> -->

      <template #node-leafer="nodeProps">
        <LeaferNode v-bind="nodeProps" @node-click="onNodeClick" @next="onNextNode" />
      </template>

      <!-- bind your custom edge type to a component by using slots, slot names are always `edge-<type>` -->
      <template #edge-special="specialEdgeProps">
        <SpecialEdge v-bind="specialEdgeProps" />
      </template>

      <!-- <template #node-menu="toolProps">
        <NodeTools v-bind="toolProps" :id="toolProps.id" :data="toolProps.data" />
      </template> -->

      <ToolsPanel>
        <ElButton link :icon="Plus" @click="onAdd"> </ElButton>
      </ToolsPanel>

      <DropzoneBackground> </DropzoneBackground>
    </VueFlow>
  </div>
</template>

<style>
@reference "tailwindcss";

.main {
  @apply absolute top-0 bottom-0 left-0 right-0;
}

.draw-flow {
  /* background-color: rgba(255, 255, 255, 0.1); */
}
</style>
