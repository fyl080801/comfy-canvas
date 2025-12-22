import EventEmitter, { type IEventEmitter } from '../EventEmitter'
import type {
  InitialResponse,
  InpaintData,
  IProvider,
  ProviderEvents,
  ResolutionData,
} from '../types'

export abstract class BaseProvider implements IProvider {
  private listeners = new EventEmitter<ProviderEvents>()

  abstract inpaint(data: InpaintData): Promise<InitialResponse>

  abstract resolution(data: ResolutionData): Promise<InitialResponse>

  dispatch<K extends keyof ProviderEvents>(eventName: K, ...args: Parameters<ProviderEvents[K]>) {
    this.listeners.emit(eventName, ...args)
  }

  on<K extends keyof ProviderEvents>(eventName: K, handler: ProviderEvents[K]): void {
    this.listeners.on(eventName, handler)
  }

  off<K extends keyof ProviderEvents>(eventName: K, handler: ProviderEvents[K]): void {
    this.listeners.off(eventName, handler)
  }
}
