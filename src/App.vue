<script setup lang="ts">
import { ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { VueFlow } from '@vue-flow/core'

// these components are only shown as examples of how to use a custom node or edge
// you can find many examples of how to create these custom components in the examples page of the docs
import SpecialNode from './components/SpecialNode.vue'
import SpecialEdge from './components/SpecialEdge.vue'
import LeaferNode from './components/LeaferNode.vue'
import DropzoneBackground from './components/DropzoneBackground.vue'
import ToolsPanel from './components/ToolsPanel.vue'
import { ElButton } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// these are our nodes

const nodes = ref<Node[]>([
  // // an input node, specified by using `type: 'input'`
  // {
  //   id: '1',
  //   type: 'input',
  //   position: { x: 250, y: 5 },
  //   // all nodes can have a data object containing any data you want to pass to the node
  //   // a label can property can be used for default nodes
  //   data: { label: 'Node 1' },
  // },
  // // default node, you can omit `type: 'default'` as it's the fallback type
  // {
  //   id: '2',
  //   position: { x: 100, y: 100 },
  //   data: { label: 'Node 2' },
  // },
  // // An output node, specified by using `type: 'output'`
  // {
  //   id: '3',
  //   type: 'output',
  //   position: { x: 400, y: 200 },
  //   data: { label: 'Node 3' },
  // },
  // // this is a custom node
  // // we set it by using a custom type name we choose, in this example `special`
  // // the name can be freely chosen, there are no restrictions as long as it's a string
  // {
  //   id: '4',
  //   type: 'special', // <-- this is the custom node type name
  //   position: { x: 400, y: 200 },
  //   data: {
  //     label: 'Node 4',
  //     hello: 'world',
  //   },
  // },
  // {
  //   id: '5',
  //   type: 'leafer', // <-- this is the custom node type name
  //   position: { x: 800, y: 200 },
  // },
])

// these are our edges
const edges = ref<Edge[]>([
  // // default bezier edge
  // // consists of an edge id, source node id and target node id
  // {
  //   id: 'e1->2',
  //   source: '1',
  //   target: '2',
  // },
  // // set `animated: true` to create an animated edge path
  // {
  //   id: 'e2->3',
  //   source: '2',
  //   target: '3',
  //   animated: true,
  // },
  // // a custom edge, specified by using a custom type name
  // // we choose `type: 'special'` for this example
  // {
  //   id: 'e3->4',
  //   type: 'special',
  //   source: '3',
  //   target: '4',
  //   // all edges can have a data object containing any data you want to pass to the edge
  //   data: {
  //     hello: 'world',
  //   },
  // },
  // {
  //   id: 'e4->5',
  //   type: 'leafer',
  //   source: '4',
  //   target: '5',
  // },
])

const onCalled = () => {}

const onSuccess = ({ id, url }: { id: string; url: string }) => {
  const newId = crypto.randomUUID()

  nodes.value.push({
    id: newId,
    type: 'leafer',
    position: { x: 900, y: 200 },
    data: { initImageUrl: url },
  })

  edges.value.push({
    id: crypto.randomUUID(),
    source: id,
    target: newId,
  })
}

const onAdd = () => {
  const newId = crypto.randomUUID()

  nodes.value.push({
    id: newId,
    type: 'leafer',
    position: { x: 900, y: 200 },
    data: { file: null },
  })
}
</script>

<template>
  <div class="main">
    <VueFlow :nodes="nodes" :edges="edges">
      <!-- bind your custom node type to a component by using slots, slot names are always `node-<type>` -->
      <template #node-special="specialNodeProps">
        <SpecialNode v-bind="specialNodeProps" />
      </template>

      <template #node-leafer="nodeProps">
        <LeaferNode
          v-bind="nodeProps"
          provider="aliyun"
          :init-image-url="nodeProps.data?.initImageUrl"
          @called="onCalled"
          @success="onSuccess"
        />
      </template>

      <!-- bind your custom edge type to a component by using slots, slot names are always `edge-<type>` -->
      <template #edge-special="specialEdgeProps">
        <SpecialEdge v-bind="specialEdgeProps" />
      </template>

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
</style>
