import { Polling } from '../polling'
import type { InpaintData, InitialResponse } from '../types'
import { BaseProvider } from './base'

const API_TOKEN = 'sk-af23e390b1d549dfbd028b7172765515'

export class AliyunProvider extends BaseProvider {
  private _pollings: Polling[] = []
  private _apiKey: string = API_TOKEN
  private _pollingTimeout: number = 5000

  constructor({ pollingTimeout, apiKey }: { pollingTimeout: number; apiKey: string }) {
    super()

    this._apiKey = apiKey ?? this._apiKey
    this._pollingTimeout = pollingTimeout ?? this._pollingTimeout
  }

  async inpaint(data: InpaintData): Promise<InitialResponse> {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Authorization', `Bearer ${this._apiKey}`)
    myHeaders.append('X-DashScope-Async', 'enable')

    const raw = JSON.stringify({
      model: 'wanx2.1-imageedit',
      parameters: {
        n: 1,
      },
      input: {
        function: 'description_edit_with_mask',
        prompt: data.prompt,
        base_image_url: data.base_image_url,
        mask_image_url: data.mask_image_url,
      },
    })

    const response = await fetch(`/aliyun/api/v1/services/aigc/image2image/image-synthesis`, {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    const polling = new Polling(
      async () => {
        const response = await fetch(`/aliyun/api/v1/tasks/${result.output.task_id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this._apiKey}`,
          },
        })

        if (!response.ok) {
          polling.destroy()
          const index = this._pollings.findIndex((item) => item === polling)
          if (index >= 0) {
            this._pollings.splice(index, 1)
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const pollingStatus = await response.json()

        if (['SUCCEEDED', 'FAILED', 'CANCELED'].includes(pollingStatus.output.task_status)) {
          this.dispatch('complete', pollingStatus)

          if (pollingStatus.output.task_status === 'SUCCEEDED') {
            this.dispatch('success', pollingStatus.output.results)
          }

          polling.destroy()
        } else {
          this.dispatch('processing', pollingStatus)
        }
      },
      {
        immediate: true,
        timeout: this._pollingTimeout,
      },
    )

    this._pollings.push(polling)

    return result
  }
}
