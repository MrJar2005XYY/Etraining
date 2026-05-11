// exercises.js — 动作库管理
const Exercises = {
  _editingId: null,
  _filterCategory: 'all',
  _filterType: 'all',

  getCategories() {
    return Storage.getCategories();
  },

  addCategory(name) {
    const categories = this.getCategories();
    if (!categories.includes(name)) {
      categories.push(name);
      Storage.saveCategories(categories);
    }
  },

  removeCategory(name) {
    const categories = this.getCategories().filter(c => c !== name);
    Storage.saveCategories(categories);
  },

  PRESETS: [
    { id: 'pushup', name: '俯卧撑', type: 'count', preset: true, category: '胸部' },
    { id: 'squat', name: '深蹲', type: 'count', preset: true, category: '腿部' },
    { id: 'situp', name: '仰卧起坐', type: 'count', preset: true, category: '腹部' },
    { id: 'pullup', name: '引体向上', type: 'count', preset: true, category: '背部' },
    { id: 'plank', name: '平板支撑', type: 'time', preset: true, category: '核心' },
    { id: 'lunge', name: '弓步蹲', type: 'count', preset: true, category: '腿部' },
    { id: 'burpee', name: '波比跳', type: 'count', preset: true, category: '全身' },
    { id: 'jumpingjack', name: '开合跳', type: 'count', preset: true, category: '全身' },
    { id: 'mountain', name: '登山跑', type: 'count', preset: true, category: '核心' },
    { id: 'wall-sit', name: '靠墙静蹲', type: 'time', preset: true, category: '腿部' },
  ],

  init() {
    // 如果没有数据，写入预设动作
    const stored = Storage.getExercises();
    if (stored.length === 0) {
      Storage.saveExercises([...this.PRESETS]);
    } else {
      // 更新预设动作的 category 为中文，其他运动添加默认分类
      const updated = stored.map(ex => {
        const preset = this.PRESETS.find(p => p.id === ex.id);
        if (preset) {
          return { ...ex, category: preset.category };
        }
        return ex.category ? ex : { ...ex, category: '未分类' };
      });
      Storage.saveExercises(updated);
    }
  },

  getAll() {
    return Storage.getExercises();
  },

  getById(id) {
    return this.getAll().find(e => e.id === id);
  },

  add(name, type, category) {
    const exercise = {
      id: Storage.genId(),
      name: name.trim(),
      type,
      preset: false,
      category: category || '未分类',
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
    this.applyFilter();
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
    const category = document.getElementById(`edit-category-${id}`).value;
    if (!name) return;
    this.update(id, { name, type, category });
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
    const categorySelect = document.getElementById('new-exercise-category');
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    this.add(name, typeSelect.value, categorySelect.value);
    nameInput.value = '';
    this.renderList(document.getElementById('exercises-list'));
    this.populateSelect(document.getElementById('exercise-select'));
  },

  populateSelect(select) {
    if (!select) return;
    const exercises = this.getAll();
    select.innerHTML = '<option value="">-- 选择动作 --</option>' +
      exercises.map(ex => `<option value="${ex.id}">${ex.name} [${ex.category || '未分类'}]</option>`).join('');
  },

  populateCategorySelect(select) {
    if (!select) return;
    const categories = this.getCategories();
    select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
  },

  renderFilterTags() {
    const container = document.getElementById('filter-category');
    if (!container) return;
    const categories = this.getCategories();
    container.innerHTML = `<button class="filter-tag${this._filterCategory === 'all' ? ' active' : ''}" data-value="all">全部</button>` +
      categories.map(c => `<button class="filter-tag${this._filterCategory === c ? ' active' : ''}" data-value="${c}">${c}</button>`).join('');
    container.querySelectorAll('.filter-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        this._filterCategory = btn.dataset.value;
        container.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyFilter();
      });
    });
  },

  bindFilterType() {
    const container = document.getElementById('filter-type');
    if (!container) return;
    container.querySelectorAll('.filter-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        this._filterType = btn.dataset.value;
        container.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyFilter();
      });
    });
  },

  applyFilter() {
    let exercises = this.getAll();
    if (this._filterCategory !== 'all') {
      exercises = exercises.filter(ex => ex.category === this._filterCategory);
    }
    if (this._filterType !== 'all') {
      exercises = exercises.filter(ex => ex.type === this._filterType);
    }
    const container = document.getElementById('exercises-list');
    if (!container) return;
    if (exercises.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无匹配的动作</p>';
      return;
    }
    const categoryOptions = this.getCategories().map(c => `<option value="${c}">${c}</option>`).join('');
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
              <select class="select-input" id="edit-category-${ex.id}">
                ${categoryOptions.replace(`value="${ex.category}"`, `value="${ex.category}" selected`)}
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
            <span class="ei-category">${ex.category || '未分类'}</span>
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

  renderCategoryList(container) {
    if (!container) return;
    const categories = this.getCategories();
    container.innerHTML = categories.map(c => `
      <div class="category-item">
        <span>${c}</span>
        <button class="btn-danger btn-sm" onclick="Exercises.handleRemoveCategory('${c}')">删除</button>
      </div>
    `).join('');
  },

  handleAddCategory() {
    const input = document.getElementById('new-category-name');
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    this.addCategory(name);
    input.value = '';
    this.renderCategoryList(document.getElementById('category-list'));
    this.populateCategorySelect(document.getElementById('new-exercise-category'));
    this.renderFilterTags();
    this.applyFilter();
  },

  handleRemoveCategory(name) {
    if (confirm(`确定删除分类"${name}"？`)) {
      this.removeCategory(name);
      this.renderCategoryList(document.getElementById('category-list'));
      this.populateCategorySelect(document.getElementById('new-exercise-category'));
      if (this._filterCategory === name) this._filterCategory = 'all';
      this.renderFilterTags();
      this.applyFilter();
    }
  },
};
