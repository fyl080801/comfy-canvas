export class Polling {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isPaused = true;
  private readonly action: () => void | Promise<void>;
  private readonly timeout: number;

  constructor(
    action: () => void | Promise<void>,
    options?: { immediate?: boolean; timeout?: number }
  ) {
    this.action = action;
    this.timeout = options?.timeout ?? 1000;

    if (options?.immediate) {
      this.resume();
    }
  }

  public resume = (): void => {
    if (!this.isPaused) {
      return;
    }
    this.isPaused = false;
    this.scheduleNext();
  };

  public pause = (): void => {
    if (this.isPaused) {
      return;
    }
    this.isPaused = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  };

  private scheduleNext = (): void => {
    if (this.isPaused) {
      return;
    }
    this.timeoutId = setTimeout(async () => {
      try {
        await this.action();
      } catch (error) {
        console.error('Polling action failed:', error);
      } finally {
        this.scheduleNext();
      }
    }, this.timeout);
  };

  public destroy = (): void => {
    this.pause();
  };
}
