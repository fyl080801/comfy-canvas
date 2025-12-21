import { computed, inject, provide, type Reactive, type Ref } from 'vue'

const CANVAS_TOKEN = Symbol('#CANVAS_TOKEN')

export type DesignContext = Reactive<{
  activeNodeId: string | null
}>

type DesignProps = { context: DesignContext }

export const useDesignCanvas = (props?: DesignProps) => {
  if (!props) {
    const parent = inject<DesignProps>(CANVAS_TOKEN, {
      context: {
        activeNodeId: null,
      },
    })

    return parent
  }

  provide(CANVAS_TOKEN, props)

  return props
}

export const useNode = (id: string) => {
  const { context } = useDesignCanvas()
}

export const useIsActive = (id: string) => {
  const { context } = useDesignCanvas()

  return computed(() => {
    return context.activeNodeId === id
  })
}
