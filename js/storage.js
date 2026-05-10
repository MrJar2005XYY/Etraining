// storage.js — localStorage 数据封装
const Storage = {
  KEYS: {
    EXERCISES: 'fit_exercises',
    WORKOUTS: 'fit_workouts',
  },

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // 动作库
  getExercises() {
    return this.get(this.KEYS.EXERCISES) || [];
  },

  saveExercises(exercises) {
    this.set(this.KEYS.EXERCISES, exercises);
  },

  addExercise(exercise) {
    const list = this.getExercises();
    list.push(exercise);
    this.saveExercises(list);
  },

  updateExercise(id, updates) {
    const list = this.getExercises();
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveExercises(list);
    }
  },

  deleteExercise(id) {
    const list = this.getExercises().filter(e => e.id !== id);
    this.saveExercises(list);
  },

  // 训练记录
  getWorkouts() {
    return this.get(this.KEYS.WORKOUTS) || [];
  },

  saveWorkouts(workouts) {
    this.set(this.KEYS.WORKOUTS, workouts);
  },

  addWorkout(workout) {
    const list = this.getWorkouts();
    list.push(workout);
    this.saveWorkouts(list);
  },

  getRecentWorkouts(count = 5) {
    return this.getWorkouts().slice(-count).reverse();
  },

  getTodayWorkout() {
    const today = new Date().toISOString().split('T')[0];
    return this.getWorkouts().filter(w => w.date === today);
  },

  // 生成唯一ID
  genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
};
