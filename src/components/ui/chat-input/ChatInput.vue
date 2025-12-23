<script setup lang="ts">
import { ref, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue?: string
  variant?: 'updown' | 'default'
  placeholder?: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void
  (e: 'submit', text: string): void
}>()

const inputValue = ref(props.modelValue || '')

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value
  emits('update:modelValue', target.value)
}

const handleSubmit = () => {
  if (inputValue.value.trim()) {
    emits('submit', inputValue.value.trim())
    inputValue.value = ''
    emits('update:modelValue', '')
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}

const containerClass = computed(() => {
  return cn('flex items-center gap-2', props.variant === 'updown' ? 'flex-col' : 'flex-row')
})

const inputClass = computed(() => {
  return cn('flex-1', props.variant === 'updown' ? 'w-full' : '')
})
</script>

<template>
  <div :class="containerClass">
    <Input
      :class="inputClass"
      :value="inputValue"
      @input="handleInput"
      @keydown="handleKeydown"
      :placeholder="placeholder || '输入消息...'"
    />
    <Button @click="handleSubmit" size="sm" :class="variant === 'updown' ? 'w-full' : ''">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mr-1"
      >
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      发送
    </Button>
  </div>
</template>
