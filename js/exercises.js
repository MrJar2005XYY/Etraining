// exercises.js — 动作库管理
const Exercises = {
  _editingId: null,

  PRESETS: [
    { id: 'pushup', name: '俯卧撑', type: 'count', preset: true },
    { id: 'squat', name: '深蹲', type: 'count', preset: true },
    { id: 'situp', name: '仰卧起坐', type: 'count', preset: true },
    { id: 'pullup', name: '引体向上', type: 'count', preset: true },
    { id: 'plank', name: '平板支撑', type: 'time', preset: true },
    { id: 'lunge', name: '弓步蹲', type: 'count', preset: true },
    { id: 'burpee', name: '波比跳', type: 'count', preset: true },
    { id: 'jumpingjack', name: '开合跳', type: 'count', preset: true },
    { id: 'mountain', name: '登山跑', type: 'count', preset: true },
    { id: 'wall-sit', name: '靠墙静蹲', type: 'time', preset: true },
  ],

  init() {
    // 如果没有数据，写入预设动作
    const stored = Storage.getExercises();
    if (stored.length === 0) {
      Storage.saveExercises([...this.PRESETS]);
    }
  },

  getAll() {
    return Storage.getExercises();
  },

  getById(id) {
    return this.getAll().find(e => e.id === id);
  },

  add(name, type) {
    const exercise = {
      id: Storage.genId(),
      name: name.trim(),
      type,
      preset: false,
    };
    Storage.addExercise(exercise);
    return exercise;
  },

  update(id, updates) {
    Storage.updateExercise(id, updates);
  },

  remove(id) {
    Storage.deleteExercise(id);
  },

  renderList(container) {
    const exercises = this.getAll();
    if (exercises.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无动作</p>';
      return;
    }
    container.innerHTML = exercises.map(ex => {
      if (this._editingId === ex.id) {
        return `
          <div class="exercise-item" data-id="${ex.id}">
            <div class="exercise-edit">
              <input type="text" class="text-input" id="edit-name-${ex.id}" value="${ex.name}">
              <select class="select-input" id="edit-type-${ex.id}">
                <option value="count" ${ex.type === 'count' ? 'selected' : ''}>计次</option>
                <option value="time" ${ex.type === 'time' ? 'selected' : ''}>计时</option>
              </select>
            </div>
            <div class="exercise-edit-actions">
              <button class="btn-primary btn-sm" onclick="Exercises.handleSave('${ex.id}')">保存</button>
              <button class="btn-outline btn-sm" onclick="Exercises.handleCancelEdit()">取消</button>
            </div>
          </div>
        `;
      }
      return `
        <div class="exercise-item" data-id="${ex.id}">
          <div>
            <span class="ei-name">${ex.name}</span>
            <span class="ei-type">${ex.type === 'count' ? '计次' : '计时'}</span>
          </div>
          <div class="ei-actions">
            <button class="btn-outline btn-sm" onclick="Exercises.handleEdit('${ex.id}')">编辑</button>
            <button class="btn-danger btn-sm" onclick="Exercises.handleRemove('${ex.id}')">删除</button>
          </div>
        </div>
      `;
    }).join('');
  },

  handleRemove(id) {
    if (confirm('确定删除这个动作？')) {
      this.remove(id);
      this.renderList(document.getElementById('exercises-list'));
      this.populateSelect(document.getElementById('exercise-select'));
    }
  },

  handleEdit(id) {
    this._editingId = id;
    this.renderList(document.getElementById('exercises-list'));
    const input = document.getElementById(`edit-name-${id}`);
    if (input) input.focus();
  },

  handleSave(id) {
    const name = document.getElementById(`edit-name-${id}`).value.trim();
    const type = document.getElementById(`edit-type-${id}`).value;
    if (!name) return;
    this.update(id, { name, type });
    this._editingId = null;
    this.renderList(document.getElementById('exercises-list'));
    this.populateSelect(document.getElementById('exercise-select'));
  },

  handleCancelEdit() {
    this._editingId = null;
    this.renderList(document.getElementById('exercises-list'));
  },

  handleAdd() {
    const nameInput = document.getElementById('new-exercise-name');
    const typeSelect = document.getElementById('new-exercise-type');
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    this.add(name, typeSelect.value);
    nameInput.value = '';
    this.renderList(document.getElementById('exercises-list'));
    this.populateSelect(document.getElementById('exercise-select'));
  },

  populateSelect(select) {
    if (!select) return;
    const exercises = this.getAll();
    select.innerHTML = '<option value="">-- 选择动作 --</option>' +
      exercises.map(ex => `<option value="${ex.id}">${ex.name} (${ex.type === 'count' ? '计次' : '计时'})</option>`).join('');
  },
};
