// storage.js — localStorage 数据封装
const Storage = {
  KEYS: {
    EXERCISES: 'fit_exercises',
    WORKOUTS: 'fit_workouts',
    CATEGORIES: 'fit_categories',
    QUOTES: 'fit_quotes',
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

  // 分类管理
  getCategories() {
    return this.get(this.KEYS.CATEGORIES) || ['胸部', '背部', '腿部', '腹部', '肩部', '手臂', '核心', '全身'];
  },

  saveCategories(categories) {
    this.set(this.KEYS.CATEGORIES, categories);
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

  deleteWorkout(id) {
    const list = this.getWorkouts().filter(w => w.id !== id);
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

  // 自定义名言
  getQuotes() {
    return this.get(this.KEYS.QUOTES) || [];
  },

  saveQuotes(quotes) {
    this.set(this.KEYS.QUOTES, quotes);
  },

  addQuote(text) {
    const list = this.getQuotes();
    list.push(text);
    this.saveQuotes(list);
  },

  deleteQuote(index) {
    const list = this.getQuotes();
    list.splice(index, 1);
    this.saveQuotes(list);
  },

  // 数据导出
  exportData() {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      exercises: this.getExercises(),
      workouts: this.getWorkouts(),
      categories: this.getCategories(),
      quotes: this.getQuotes(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `健身助手_备份_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // 数据导入
  importData(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.exercises || !data.workouts) {
          throw new Error('数据格式不正确');
        }
        this.saveExercises(data.exercises);
        this.saveWorkouts(data.workouts);
        if (data.categories) this.saveCategories(data.categories);
        if (data.quotes) this.saveQuotes(data.quotes);
        onSuccess && onSuccess();
      } catch (err) {
        onError && onError(err.message || '导入失败');
      }
    };
    reader.readAsText(file);
  },
};
