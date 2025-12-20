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
  }
}

export interface InpaintData {
  base_image_url: string
  mask_image_url: string
  prompt: string
}

export interface IProvider extends IEventEmitter<ProviderEvents> {
  inpaint(data: InpaintData): Promise<InitialResponse>
}
