import { AliyunProvider } from '@/lib/providers'
import type { EditTypes, LeaferNodeProps } from '@/lib/types'
import { useNodesData, type GraphNode } from '@vue-flow/core'
import { ref } from 'vue'
import { computed, inject, provide, type Reactive, type Ref } from 'vue'

const CANVAS_TOKEN = Symbol('#CANVAS_TOKEN')

export type DesignContext = Reactive<{
  activeNodeId: string | null
  processing: boolean
}>

type DesignProps = {
  context: DesignContext
  clearActive: () => void
  toggleProcessing: (value: boolean) => void
}

export const useDesignCanvas = (props?: DesignProps) => {
  if (!props) {
    const parent = inject<DesignProps>(CANVAS_TOKEN, {
      context: {
        activeNodeId: null,
        processing: false,
      },
      clearActive: () => {},
      toggleProcessing: () => {},
    })

    return parent
  }

  provide(CANVAS_TOKEN, props)

  return props
}

type DesignNodeProps = {
  id: string
  imageUrl: Ref<string | undefined>
  editType: Ref<EditTypes | undefined | null>
  processing: Ref<boolean>
  nodeBound: Ref<number[]>
  emit: ((evt: 'called', data?: any) => void) &
    ((
      evt: 'success',
      result: {
        id: string
        url: string
      },
    ) => void) &
    ((evt: 'node-click', nodeId: string) => void) &
    ((evt: 'next', id: string, data: LeaferNodeProps) => void)
}
const NODE_TOKEN = Symbol('#NODE_TOKEN')
export const useDesignNode = (props?: DesignNodeProps) => {
  if (!props) {
    return inject<DesignNodeProps>(NODE_TOKEN, {
      id: '',
      imageUrl: ref(),
      editType: ref(),
      processing: ref(false),
      nodeBound: ref([500, 500]),
      emit: () => {},
    })
  }

  provide(NODE_TOKEN, props)

  return props
}

export const useIsActive = (id?: string) => {
  const { context } = useDesignCanvas()
  const { id: nodeId } = useDesignNode()

  return computed(() => {
    return context.activeNodeId === (id || nodeId)
  })
}

export const useIsEmpty = () => {
  const { imageUrl } = useDesignNode()

  return computed(() => {
    return !imageUrl.value
  })
}

export const useIsProcessing = () => {
  const { processing } = useDesignNode()

  return computed(() => {
    return processing.value
  })
}

export const useCurrentEditType = () => {
  const { editType } = useDesignNode()

  return computed(() => {
    return editType.value
  })
}

export const useNodeProvider = () => {
  const { id } = useDesignNode()

  const nodeData = useNodesData<GraphNode<LeaferNodeProps>>(id)

  const providers = {
    aliyun: AliyunProvider,
  }

  const PType = computed<(typeof providers)[keyof typeof providers]>(() => {
    if (!nodeData.value) return AliyunProvider // 默认

    return providers[nodeData.value?.data.provider]
  })

  return {
    createProvider: () => {
      return new PType.value(nodeData.value?.data.providerProps || {})
    },
  }
}
