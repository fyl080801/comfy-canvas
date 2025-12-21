<script setup lang="ts">
import { Panel } from '@vue-flow/core'
</script>

<template>
  <Panel position="top-center">
    <div class="buttons">
      <slot></slot>
      <!-- <button title="save graph" @click="onSave">
        <Icon name="save" />
      </button>
      <button title="restore graph" @click="onRestore">
        <Icon name="restore" />
      </button>
      <button title="add random node" @click="onAdd">
        <Icon name="add" />
      </button> -->
    </div>
  </Panel>
</template>

<style scoped>
.buttons {
  @apply flex gap-[8px];
  @apply p-[8px];

  border-radius: 8px;
  background-color: rgba(128, 128, 128, 0.5);
}
</style>
