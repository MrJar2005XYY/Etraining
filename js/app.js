// app.js — 主应用逻辑、SPA 路由
const App = {
  currentPage: 'home',

  init() {
    Exercises.init();
    this.bindNav();
    this.bindHome();
    this.bindWorkout();
    this.bindExercises();
    this.bindRestModal();
    this.bindTimers();
    Stats.init();
    this.showPage('home');
    this.renderHome();
  },

  // 路由
  showPage(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });

    if (page === 'home') this.renderHome();
    if (page === 'exercises') {
      Exercises.renderList(document.getElementById('exercises-list'));
      Exercises.populateSelect(document.getElementById('exercise-select'));
    }
    if (page === 'stats') Stats.render();
    if (page === 'workout') {
      Exercises.populateSelect(document.getElementById('exercise-select'));
      if (Workout.active) {
        Workout.renderWorkoutExercises(document.getElementById('workout-exercises'));
      }
      this.syncWorkoutTimerUI();
    }
  },

  bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.showPage(btn.dataset.page));
    });
  },

  // 首页
  bindHome() {
    document.getElementById('btn-start-workout').addEventListener('click', () => {
      if (Workout.active) {
        this.showPage('workout');
      } else {
        Workout.start();
        this.showPage('workout');
      }
    });
  },

  renderHome() {
    // 日期
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    document.getElementById('home-date').textContent = dateStr;

    // 今日摘要
    const todayWorkouts = Storage.getTodayWorkout();
    const summary = document.getElementById('home-summary');
    if (Workout.active) {
      summary.textContent = '训练进行中...';
    } else if (todayWorkouts.length > 0) {
      const totalMin = Math.round(todayWorkouts.reduce((s, w) => s + (w.duration || 0), 0) / 60);
      summary.textContent = `今日已完成 ${todayWorkouts.length} 次训练，共 ${totalMin} 分钟`;
    } else {
      summary.textContent = '今天还没有训练记录';
    }

    // 最近训练
    const recent = Storage.getRecentWorkouts(5);
    const container = document.getElementById('recent-workouts');
    if (recent.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无训练记录</p>';
      return;
    }
    container.innerHTML = recent.map(w => {
      const totalSets = (w.exercises || []).reduce((s, ex) => s + (ex.sets || []).length, 0);
      const totalEx = (w.exercises || []).length;
      return `
        <div class="recent-item">
          <div>
            <div class="ri-date">${w.date}</div>
          </div>
          <div class="ri-info">
            <div class="ri-duration">${Timer.format(w.duration || 0)}</div>
            <div class="ri-count">${totalEx} 个动作 · ${totalSets} 组</div>
          </div>
        </div>
      `;
    }).join('');
  },

  // 同步训练计时器的按钮图标和暂停样式
  syncWorkoutTimerUI() {
    const running = Timer.workout.running;
    document.getElementById('btn-timer-pause').innerHTML = running ? '&#10074;&#10074;' : '&#9654;';
    document.getElementById('workout-timer').classList.toggle('paused', !running);
  },

  // 训练页
  bindWorkout() {
    document.getElementById('btn-end-workout').addEventListener('click', () => {
      if (!Workout.active) return;
      if (confirm('确定结束本次训练？')) {
        Workout.end();
        this.syncWorkoutTimerUI();
        this.showPage('home');
      }
    });

    document.getElementById('btn-add-exercise').addEventListener('click', () => {
      const select = document.getElementById('exercise-select');
      const id = select.value;
      if (!id) return;
      Workout.addExercise(id);
      select.value = '';
      Workout.renderWorkoutExercises(document.getElementById('workout-exercises'));
      Workout.showToast('动作已添加');
    });

    document.getElementById('btn-timer-pause').addEventListener('click', () => {
      Timer.workout.toggle();
      this.syncWorkoutTimerUI();
    });
  },

  // 动作库
  bindExercises() {
    document.getElementById('btn-add-new-exercise').addEventListener('click', () => {
      Exercises.handleAdd();
    });

    document.getElementById('new-exercise-name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') Exercises.handleAdd();
    });
  },

  // 休息弹窗
  bindRestModal() {
    document.getElementById('btn-skip-rest').addEventListener('click', () => {
      Workout.hideRest();
    });

    // 恢复上次选择的休息时长
    const savedRest = localStorage.getItem('fit_rest_duration');
    if (savedRest) {
      document.querySelectorAll('.rest-options .btn-outline').forEach(b => b.classList.remove('active'));
      const target = document.querySelector(`.rest-options .btn-outline[data-rest="${savedRest}"]`);
      if (target) target.classList.add('active');
    }

    document.querySelectorAll('.rest-options .btn-outline').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rest-options .btn-outline').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const duration = parseInt(btn.dataset.rest);
        localStorage.setItem('fit_rest_duration', duration);
        Timer.rest.start(duration);
      });
    });
  },

  // 计时器回调绑定
  bindTimers() {
    Timer.workout.onTick = (seconds) => {
      document.getElementById('workout-timer').textContent = Timer.format(seconds);
    };

    Timer.rest.onTick = (remaining) => {
      document.getElementById('rest-timer').textContent = remaining;
    };
  },
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
