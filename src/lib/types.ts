import type { SubmitResult } from 'vue-element-plus-x/types/EditorSender'
import type { IEventEmitter } from './EventEmitter'

// 定義任務狀態接口
export interface TaskResponse {
  request_id: string
  output: {
    task_id: string
    task_status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
    submit_time?: string
    scheduled_time?: string
    end_time?: string
    results?: Array<{ url: string }>
    task_metrics?: {
      TOTAL: number
      SUCCEEDED: number
      FAILED: number
    }
  }
  usage?: {
    image_count: number
  }
}

export interface ProviderEvents {
  complete: (response: TaskResponse) => void
  processing: (response: TaskResponse) => void
  success: (result: Array<{ url: string }>) => void
}

// 定義初始請求響應接口
export interface InitialResponse {
  request_id: string
  output: {
    task_id: string
    task_status: 'PENDING'
    results?: Array<{ url: string }>
  }
}

export interface InpaintData {
  base_image_url: string
  mask_image_url: string
  prompt: string
}

export interface ResolutionData {
  prompt: string
  base_image_url: string
  factor: number
}

export interface ExtendData {
  prompt: string
  base_image_url: string
  scale: number
}

export interface IProvider extends IEventEmitter<ProviderEvents> {
  inpaint(data: InpaintData): Promise<InitialResponse>
  resolution(data: ResolutionData): Promise<InitialResponse>
  expand(data: ExtendData): Promise<InitialResponse>
}

export interface LeaferNodeProps {
  provider: 'aliyun'
  providerProps?: any
  initImageUrl?: string
  process?: () => Promise<string | undefined> // 先默认必须返回一个imageurl
}

export type EditTypes = 'redraw' | 'eraser' | 'hd' | 'extend'

// 定义 emit 事件的参数类型
export interface NodeEmitEvents {
  called: [data?: any] // called 事件可以传递任意数据
  success: [result: { id: string; url: string }] // success 事件传递包含id和url的结果数据
  'node-click': [nodeId: string] // node-click 事件传递节点ID
  next: [id: string, data: LeaferNodeProps]
}
