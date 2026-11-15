import { clamp } from './game.js';

export class MotionInput {
  constructor() {
    this.x = 0;
    this.baseline = 0;
    this.value = 0;
    this.roll = 0;
    this.lastReading = 0;
    this.samples = [];
    this.listening = false;
    this.operation = 0;
    this.onMotion = event => {
      const x = event.accelerationIncludingGravity?.x;
      if (!Number.isFinite(x)) return;
      const now = performance.now();
      const dt = this.lastReading ? Math.min((now - this.lastReading) / 1000, 0.1) : 0.1;
      this.x = x;
      this.lastReading = now;
      if (this.collecting) this.samples.push(x);
      const relative = -(x - this.baseline) / 3.7;
      const target = Math.abs(relative) < 0.07 ? 0 : clamp(relative, -1, 1);
      this.value += (target - this.value) * (1 - Math.exp(-dt / 0.085));
      const y = event.accelerationIncludingGravity?.y;
      if (Number.isFinite(y)) {
        // Roll is relative to gravity, independently of the steering calibration.
        const roll = Math.atan2(-x, Math.abs(y));
        this.roll += (roll - this.roll) * (1 - Math.exp(-dt / 0.12));
      }
    };
  }

  async enable() {
    const operation = ++this.operation;
    const api = window.DeviceMotionEvent;
    if (!window.isSecureContext || !api) return false;
    try {
      // Called before the first await so iOS still has the Play tap's activation.
      if (typeof api.requestPermission === 'function' && await api.requestPermission() !== 'granted') return false;
      if (operation !== this.operation) return false;
      this.samples = [];
      this.collecting = true;
      if (!this.listening) {
        window.addEventListener('devicemotion', this.onMotion);
        this.listening = true;
      }
      const started = performance.now();
      const available = await new Promise(resolve => {
        const check = () => {
          const elapsed = performance.now() - started;
          if (operation !== this.operation) resolve(false);
          else if (elapsed >= 500 && this.samples.length >= 3) resolve(true);
          else if (elapsed >= 2200) resolve(false);
          else setTimeout(check, 50);
        };
        check();
      });
      if (operation !== this.operation) return false;
      this.collecting = false;
      if (!available) { this.disable(); return false; }
      this.baseline = this.samples.reduce((sum, x) => sum + x, 0) / this.samples.length;
      this.value = 0;
      this.samples = [];
      return true;
    } catch {
      if (operation !== this.operation) return false;
      this.collecting = false;
      this.disable();
      return false;
    }
  }

  calibrate() { this.baseline = this.x; this.value = 0; }
  get fresh() { return performance.now() - this.lastReading < 1500; }
  disable() {
    ++this.operation;
    window.removeEventListener('devicemotion', this.onMotion);
    this.listening = false;
    this.value = 0;
    this.collecting = false;
    this.samples = [];
    this.lastReading = 0;
  }
}
