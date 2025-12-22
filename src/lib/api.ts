import type {
  ExtendData,
  InpaintData,
  IProvider,
  ProviderEvents,
  ResolutionData,
  TaskResponse,
} from './types'
import { type IEventEmitter } from './EventEmitter'

// type ApiStatus = 'pending' | 'polling' | 'succeeded' | 'failed' | 'cancelled'

// export interface ApiStatusEvent {
//   status: ApiStatus
//   message: string
//   taskId?: string
//   data?: TaskResponse
//   error?: string
// }

export class ApiService implements IEventEmitter<ProviderEvents> {
  private _provider: IProvider

  on<K extends keyof ProviderEvents>(eventName: K, handler: ProviderEvents[K]): void {
    this._provider.on(eventName, handler)
  }
  off<K extends keyof ProviderEvents>(eventName: K, handler: ProviderEvents[K]): void {
    this._provider.off(eventName, handler)
  }

  constructor({ provider }: { provider: IProvider }) {
    this._provider = provider
  }

  async inpaint(data: InpaintData): Promise<void> {
    this._provider.inpaint(data)
  }

  async resolution(data: ResolutionData): Promise<void> {
    this._provider.resolution(data)
  }

  async expand(data: ExtendData): Promise<void> {
    this._provider.expand(data)
  }
}
