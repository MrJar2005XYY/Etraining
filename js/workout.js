// workout.js — 训练记录逻辑
const Workout = {
  active: false,
  _restShowing: false,
  startTime: null,
  exerciseRecords: [],
  pendingExercises: [],
  _reps: {},
  _timers: {}, // { exerciseId: { seconds, interval, running } }
  _quoteTimer: null,
  _quoteIndex: 0,
  _quotes: [],

  BUILTIN_QUOTES: [
    '坚持就是胜利，你比想象中更强大！',
    '每一滴汗水都不会白流，继续加油！',
    '今天的努力，是明天的骄傲。',
    '没有做不到，只有想不到，冲！',
    '你已经很棒了，再坚持一下！',
    '突破自己的极限，你会遇见更好的自己。',
    '运动不是为了改变身体，而是为了改变心态。',
    '累就对了，舒服是留给不运动的人的。',
    '每一次训练都是对自己的投资。',
    '不要停下脚步，你离目标只差一步！',
    '能坚持到这里，你已经超越了大多数人。',
    '身体是革命的本钱，你在做最正确的事。',
    '强者不是没有眼泪，而是含着眼泪依然奔跑。',
    '今天的酸痛，是明天的力量。',
    '你流的每一滴汗，都在塑造更好的自己。',
    '别放弃，最精彩的部分往往在最后。',
    '自律给你自由，坚持给你力量。',
    '与其羡慕别人，不如超越自己。',
  ],

  start() {
    this.active = true;
    this.startTime = Date.now();
    this.exerciseRecords = this.pendingExercises.slice();
    this.pendingExercises = [];
    this._reps = {};
    this._timers = {};
    Timer.workout.reset();
    Timer.workout.start();
    this.renderWorkoutExercises(document.getElementById('workout-exercises'));
    this.startQuote();
  },

  end() {
    if (!this.active) return null;
    Timer.workout.pause();
    this.hideRest();
    // 停止所有动作计时器
    Object.values(this._timers).forEach(t => clearInterval(t.interval));

    const record = {
      id: Storage.genId(),
      date: new Date().toISOString().split('T')[0],
      startTime: this.startTime,
      endTime: Date.now(),
      duration: Timer.workout.seconds,
      exercises: this.exerciseRecords.map(r => {
        const ex = Exercises.getById(r.exerciseId);
        return {
          exerciseId: r.exerciseId,
          exerciseName: ex ? ex.name : '未知',
          exerciseType: ex ? ex.type : 'count',
          exerciseCategory: ex ? (ex.category || '未分类') : '未分类',
          sets: [...r.sets],
        };
      }),
    };

    Storage.addWorkout(record);
    this.active = false;
    this.exerciseRecords = [];
    this.pendingExercises = [];
    this._timers = {};
    this.stopQuote();
    Timer.workout.reset();
    return record;
  },

  addExercise(exerciseId) {
    if (this.active) {
      if (this.exerciseRecords.some(r => r.exerciseId === exerciseId)) {
        return false;
      }
      this.exerciseRecords.push({ exerciseId, sets: [] });
    } else {
      if (this.pendingExercises.some(r => r.exerciseId === exerciseId)) {
        return false;
      }
      this.pendingExercises.push({ exerciseId, sets: [] });
    }
    return true;
  },

  removeExercise(exerciseId) {
    // 停止该动作的计时器
    if (this._timers[exerciseId]) {
      clearInterval(this._timers[exerciseId].interval);
      delete this._timers[exerciseId];
    }
    if (this.active) {
      this.exerciseRecords = this.exerciseRecords.filter(r => r.exerciseId !== exerciseId);
    } else {
      this.pendingExercises = this.pendingExercises.filter(r => r.exerciseId !== exerciseId);
    }
  },

  addSet(exerciseId, setData) {
    const record = this.exerciseRecords.find(r => r.exerciseId === exerciseId);
    if (record) record.sets.push(setData);
  },

  renderWorkoutExercises(container) {
    const records = this.active ? this.exerciseRecords : this.pendingExercises;
    if (!records || records.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = records.map(rec => {
      const ex = Exercises.getById(rec.exerciseId);
      const name = ex ? ex.name : (rec.exerciseName || '未知动作');
      const category = ex ? (ex.category || '未分类') : '未分类';
      const isCount = (ex ? ex.type : (rec.exerciseType || 'count')) === 'count';

      const setsHtml = rec.sets.map((set, i) => `
        <div class="set-row">
          <span class="set-label">第${i + 1}组</span>
          <span class="set-value">${isCount ? set.reps : Timer.format(set.duration)}</span>
          <span class="set-unit">${isCount ? '次' : ''}</span>
        </div>
      `).join('');

      const exId = rec.exerciseId;
      const timer = this._timers[exId];
      const timerSeconds = timer ? timer.seconds : 0;
      const timerRunning = timer ? timer.running : false;

      const timerHtml = !isCount ? `
        <div class="exercise-timer" data-exercise="${exId}">
          <div class="timer-display" id="ex-timer-${exId}">${Timer.format(timerSeconds)}</div>
          <button class="btn-icon" onclick="Workout.toggleExerciseTimer('${exId}')" title="开始/暂停">${timerRunning ? '&#10074;&#10074;' : '&#9654;'}</button>
          <button class="btn-sm btn-outline" onclick="Workout.finishExerciseTimer('${exId}')">记录</button>
        </div>
      ` : '';

      const reps = this._reps[exId] || 0;
      const countControlsHtml = isCount ? `
        <div class="set-controls">
          <button class="btn-icon" onclick="Workout.adjustReps('${exId}', -1)">-</button>
          <input type="number" class="reps-input" id="reps-${exId}" value="${reps}" min="0" onchange="Workout.onRepsInput('${exId}', this.value)" onfocus="this.select()">
          <button class="btn-icon" onclick="Workout.adjustReps('${exId}', 1)">+</button>
          <div class="quick-reps">
            <button class="btn-outline btn-sm" onclick="Workout.setReps('${exId}', 12)">12</button>
            <button class="btn-outline btn-sm" onclick="Workout.setReps('${exId}', 15)">15</button>
            <button class="btn-outline btn-sm" onclick="Workout.setReps('${exId}', 20)">20</button>
          </div>
        </div>
      ` : '';

      return `
        <div class="exercise-card" data-exercise-card="${exId}">
          <div class="exercise-card-header">
            <h3>${name} <span class="ei-category">${category}</span> <span style="font-weight:normal;color:var(--text-light);font-size:13px;">${rec.sets.length}组</span></h3>
            <button class="btn-text" onclick="Workout.removeExerciseUI('${exId}')">移除</button>
          </div>
          <div class="sets-list">${setsHtml || '<p class="empty-hint" style="padding:8px 0;">暂无记录</p>'}</div>
          ${timerHtml}
          ${countControlsHtml}
          ${isCount ? `<button class="btn-primary btn-sm" onclick="Workout.finishCountSet('${exId}')">完成此组</button>` : ''}
        </div>
      `;
    }).join('');
  },

  // 计次操作
  adjustReps(exerciseId, delta) {
    if (!this._reps[exerciseId]) this._reps[exerciseId] = 0;
    this._reps[exerciseId] = Math.max(0, this._reps[exerciseId] + delta);
    const el = document.getElementById(`reps-${exerciseId}`);
    if (el) el.value = this._reps[exerciseId];
  },

  setReps(exerciseId, value) {
    this._reps[exerciseId] = value;
    const el = document.getElementById(`reps-${exerciseId}`);
    if (el) el.value = value;
  },

  onRepsInput(exerciseId, value) {
    const num = Math.max(0, parseInt(value) || 0);
    this._reps[exerciseId] = num;
    const el = document.getElementById(`reps-${exerciseId}`);
    if (el) el.value = num;
  },

  finishCountSet(exerciseId) {
    const reps = this._reps[exerciseId] || 0;
    if (reps === 0) return;
    this.addSet(exerciseId, { reps });
    this._reps[exerciseId] = 0;
    this.renderWorkoutExercises(document.getElementById('workout-exercises'));
    this.showRest();
  },

  // 每个动作独立的计时器
  toggleExerciseTimer(exerciseId) {
    if (!this._timers[exerciseId]) {
      this._timers[exerciseId] = { seconds: 0, interval: null, running: false };
    }
    const t = this._timers[exerciseId];
    if (t.running) {
      t.running = false;
      clearInterval(t.interval);
      t.interval = null;
    } else {
      t.running = true;
      t.interval = setInterval(() => {
        t.seconds++;
        const el = document.getElementById(`ex-timer-${exerciseId}`);
        if (el) el.textContent = Timer.format(t.seconds);
      }, 1000);
    }
    // 重新渲染按钮状态
    this.renderWorkoutExercises(document.getElementById('workout-exercises'));
  },

  finishExerciseTimer(exerciseId) {
    const t = this._timers[exerciseId];
    if (!t || t.seconds === 0) return;
    clearInterval(t.interval);
    const duration = t.seconds;
    delete this._timers[exerciseId];
    this.addSet(exerciseId, { duration });
    this.renderWorkoutExercises(document.getElementById('workout-exercises'));
    this.showRest();
  },

  removeExerciseUI(exerciseId) {
    this.removeExercise(exerciseId);
    this.renderWorkoutExercises(document.getElementById('workout-exercises'));
  },

  // 休息
  showRest() {
    if (this._restShowing) return;
    this._restShowing = true;
    const overlay = document.getElementById('rest-overlay');
    overlay.classList.remove('hidden');
    const restDuration = parseInt(document.querySelector('.rest-options .btn-outline.active')?.dataset.rest || 60);
    Timer.rest.start(restDuration);
    Timer.rest.onComplete = () => {
      this.playBeep();
      this.hideRest();
    };
  },

  hideRest() {
    Timer.rest.stop();
    document.getElementById('rest-overlay').classList.add('hidden');
    this._restShowing = false;
  },

  playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 300);
    } catch {}
  },

  cancel() {
    Timer.workout.pause();
    Object.values(this._timers).forEach(t => clearInterval(t.interval));
    this.hideRest();
    this.stopQuote();
    this.active = false;
    this.exerciseRecords = [];
    this.pendingExercises = [];
    this._reps = {};
    this._timers = {};
    this.startTime = null;
    Timer.workout.reset();
  },

  // 鼓励名言轮播
  startQuote() {
    const custom = Storage.getQuotes();
    this._quotes = [...this.BUILTIN_QUOTES, ...custom];
    // 随机打乱
    for (let i = this._quotes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._quotes[i], this._quotes[j]] = [this._quotes[j], this._quotes[i]];
    }
    this._quoteIndex = 0;
    this.showNextQuote();
    this._quoteTimer = setInterval(() => this.showNextQuote(), 30000);
  },

  stopQuote() {
    if (this._quoteTimer) {
      clearInterval(this._quoteTimer);
      this._quoteTimer = null;
    }
    const el = document.getElementById('motivational-quote');
    if (el) el.textContent = '';
  },

  showNextQuote() {
    const el = document.getElementById('motivational-quote');
    if (!el || this._quotes.length === 0) return;
    el.classList.add('fade-out');
    setTimeout(() => {
      el.textContent = this._quotes[this._quoteIndex % this._quotes.length];
      this._quoteIndex++;
      el.classList.remove('fade-out');
    }, 500);
  },

  showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2000);
  },
};
