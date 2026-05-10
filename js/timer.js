// timer.js — 计时器模块
const Timer = {
  // 训练总时长
  workout: {
    seconds: 0,
    interval: null,
    running: false,

    start() {
      if (this.running) return;
      this.running = true;
      this.interval = setInterval(() => {
        this.seconds++;
        this.onTick(this.seconds);
      }, 1000);
    },

    pause() {
      this.running = false;
      clearInterval(this.interval);
      this.interval = null;
    },

    toggle() {
      if (this.running) this.pause();
      else this.start();
    },

    reset() {
      this.pause();
      this.seconds = 0;
      this.onTick(0);
    },

    onTick() {},
  },

  // 组间休息倒计时
  rest: {
    seconds: 60,
    remaining: 60,
    interval: null,
    running: false,
    onComplete: null,

    start(duration) {
      this.stop();
      this.seconds = duration || 60;
      this.remaining = this.seconds;
      this.running = true;
      this.onTick(this.remaining);
      this.interval = setInterval(() => {
        this.remaining--;
        this.onTick(this.remaining);
        if (this.remaining <= 0) {
          this.stop();
          if (this.onComplete) this.onComplete();
        }
      }, 1000);
    },

    stop() {
      this.running = false;
      clearInterval(this.interval);
      this.interval = null;
    },

    onTick() {},
  },

  // 格式化秒数为 HH:MM:SS
  format(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  },
};
