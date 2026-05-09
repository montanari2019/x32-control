export class X32HeartbeatService {
  private interval: ReturnType<typeof setInterval> | null = null;

  start(sendOsc: () => void): void {
    this.stop();
    sendOsc();
    this.interval = setInterval(() => sendOsc(), 5000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
