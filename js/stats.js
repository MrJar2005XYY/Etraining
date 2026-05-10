// stats.js — 统计图表模块
const Stats = {
  durationChart: null,
  countVolumeChart: null,
  timeVolumeChart: null,
  currentRange: 'week',

  init() {
    // 监听 tab 切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentRange = btn.dataset.range;
        this.render();
      });
    });
  },

  render() {
    const workouts = Storage.getWorkouts();
    const { labels, durationData, countVolumeMap, timeVolumeMap } = this.aggregate(workouts);
    this.renderDurationChart(labels, durationData);
    this.renderCountVolumeChart(countVolumeMap);
    this.renderTimeVolumeChart(timeVolumeMap);
    this.renderSummary(workouts);
  },

  aggregate(workouts) {
    const now = new Date();
    let startDate, labels, groupFn;

    if (this.currentRange === 'week') {
      // 本周 周一到周日
      const day = now.getDay() || 7;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day + 1);
      startDate.setHours(0, 0, 0, 0);
      labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      groupFn = (d) => {
        const dt = new Date(d);
        const diff = Math.floor((dt - startDate) / 86400000);
        return diff >= 0 && diff < 7 ? diff : -1;
      };
    } else if (this.currentRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
      groupFn = (d) => {
        const dt = new Date(d);
        if (dt.getMonth() !== now.getMonth() || dt.getFullYear() !== now.getFullYear()) return -1;
        return dt.getDate() - 1;
      };
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      groupFn = (d) => {
        const dt = new Date(d);
        if (dt.getFullYear() !== now.getFullYear()) return -1;
        return dt.getMonth();
      };
    }

    const durationData = new Array(labels.length).fill(0);
    const countVolumeMap = {};
    const timeVolumeMap = {};

    workouts.forEach(w => {
      const idx = groupFn(w.date);
      if (idx < 0) return;
      durationData[idx] += Math.round((w.duration || 0) / 60); // 分钟

      (w.exercises || []).forEach(ex => {
        const exInfo = Exercises.getById(ex.exerciseId);
        const name = ex.exerciseName || (exInfo ? exInfo.name : '未知');
        const isTime = (ex.exerciseType || (exInfo && exInfo.type)) === 'time';
        const map = isTime ? timeVolumeMap : countVolumeMap;
        if (!map[name]) map[name] = 0;
        (ex.sets || []).forEach(set => {
          if (isTime) {
            map[name] += Math.round((set.duration || 0) / 60);
          } else {
            map[name] += (set.reps || 0);
          }
        });
      });
    });

    return { labels, durationData, countVolumeMap, timeVolumeMap };
  },

  renderDurationChart(labels, data) {
    const ctx = document.getElementById('duration-chart');
    if (!ctx) return;

    if (this.durationChart) this.durationChart.destroy();

    this.durationChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '训练时长（分钟）',
          data,
          borderColor: '#4A90D9',
          backgroundColor: 'rgba(74, 144, 217, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#4A90D9',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });
  },

  renderCountVolumeChart(volumeMap) {
    const ctx = document.getElementById('count-volume-chart');
    if (!ctx) return;

    if (this.countVolumeChart) this.countVolumeChart.destroy();

    const entries = Object.entries(volumeMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      this.countVolumeChart = null;
      return;
    }

    this.countVolumeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(e => e[0]),
        datasets: [{
          label: '次数',
          data: entries.map(e => e[1]),
          backgroundColor: '#6DB3F8',
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: '次' } } },
      },
    });
  },

  renderTimeVolumeChart(volumeMap) {
    const ctx = document.getElementById('time-volume-chart');
    if (!ctx) return;

    if (this.timeVolumeChart) this.timeVolumeChart.destroy();

    const entries = Object.entries(volumeMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      this.timeVolumeChart = null;
      return;
    }

    this.timeVolumeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(e => e[0]),
        datasets: [{
          label: '分钟',
          data: entries.map(e => e[1]),
          backgroundColor: '#F5A623',
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: '分钟' } } },
      },
    });
  },

  renderSummary(workouts) {
    const container = document.getElementById('stats-summary');
    if (!container) return;

    // 过滤当前范围内的数据
    const now = new Date();
    let filtered = workouts;
    if (this.currentRange === 'week') {
      const day = now.getDay() || 7;
      const start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      filtered = workouts.filter(w => new Date(w.date) >= start);
    } else if (this.currentRange === 'month') {
      filtered = workouts.filter(w => {
        const d = new Date(w.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else {
      filtered = workouts.filter(w => new Date(w.date).getFullYear() === now.getFullYear());
    }

    const totalWorkouts = filtered.length;
    const totalMinutes = Math.round(filtered.reduce((s, w) => s + (w.duration || 0), 0) / 60);
    let totalSets = 0;
    filtered.forEach(w => (w.exercises || []).forEach(ex => totalSets += (ex.sets || []).length));

    container.innerHTML = `
      <div class="summary-row"><span class="summary-label">训练次数</span><span class="summary-value">${totalWorkouts} 次</span></div>
      <div class="summary-row"><span class="summary-label">总训练时长</span><span class="summary-value">${totalMinutes} 分钟</span></div>
      <div class="summary-row"><span class="summary-label">总组数</span><span class="summary-value">${totalSets} 组</span></div>
    `;
  },
};
