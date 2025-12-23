<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { useVueFlow, VueFlow } from '@vue-flow/core'

// these components are only shown as examples of how to use a custom node or edge
// you can find many examples of how to create these custom components in the examples page of the docs
// import SpecialNode from './components/SpecialNode.vue'
import SpecialEdge from './components/SpecialEdge.vue'
import LeaferNode from './components/LeaferNode.vue'
import DropzoneBackground from './components/DropzoneBackground.vue'
import ToolsPanel from './components/ToolsPanel.vue'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
import { useDesignCanvas, type DesignContext } from './hooks/canvas'
import type { LeaferNodeProps } from './lib/types'

// these are our nodes

const { addNodes, addEdges, findNode, setCenter } = useVueFlow()

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

const onNextNode = async (id: string, payload: any) => {
  const newId = crypto.randomUUID()

  const old = findNode(id)

  const position = {
    x: (old?.position.x ?? 900) + (old?.dimensions.width ?? 500) + 100,
    y: old?.position.y ?? 500,
  }

  addNodes([
    {
      id: newId,
      type: 'leafer',
      position,
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

  await nextTick()

  const newNode = findNode(newId)

  if (newNode) {
    setCenter(
      newNode.position.x + newNode.dimensions.width / 2,
      newNode.position.y + newNode.dimensions.height / 2,
      { zoom: 1,duration: 500, 
     },
    )
  }
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
        <Button variant="ghost" size="icon" @click="onAdd">
          <Plus class="h-4 w-4" />
        </Button>
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
