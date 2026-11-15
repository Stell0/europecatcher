export class ScreenWakeLock {
  active = false;
  lock = null;
  pending = false;

  async setActive(active) {
    this.active = active;
    if (!active) {
      const lock = this.lock;
      this.lock = null;
      try { await lock?.release(); } catch { /* The browser may have released it already. */ }
      return;
    }
    if (document.hidden || !navigator.wakeLock || this.lock || this.pending) return;
    this.pending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!this.active || document.hidden) await lock.release();
      else {
        this.lock = lock;
        lock.addEventListener('release', () => { if (this.lock === lock) this.lock = null; }, { once: true });
      }
    } catch { /* Wake lock is optional; battery and browser policies can deny it. */ }
    finally { this.pending = false; }
  }
}
