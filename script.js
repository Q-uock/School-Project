class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.currentPriorityFilter = null;
        this.editingId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.priorityFilterBtns = document.querySelectorAll('.priority-filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        this.totalTodos = document.getElementById('totalTodos');
        this.pendingTodos = document.getElementById('pendingTodos');
        this.completedTodos = document.getElementById('completedTodos');
    }

    attachEventListeners() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter todos
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Priority filter
        this.priorityFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setPriorityFilter(e.target.dataset.priority);
            });
        });

        // Clear actions
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: this.generateId(),
            text: text,
            completed: false,
            priority: this.prioritySelect.value,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.todos.unshift(todo);
        this.todoInput.value = '';
        this.prioritySelect.value = 'medium';
        this.saveTodos();
        this.render();

        // Show success feedback
        this.showNotification('Aufgabe hinzugefügt!', 'success');
        
        // Update statistics if visible
        this.updateStatisticsIfVisible();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            this.saveTodos();
            this.render();
            
            const message = todo.completed ? 'Aufgabe erledigt!' : 'Aufgabe wieder geöffnet!';
            this.showNotification(message, 'success');
            
            // Update statistics if visible
            this.updateStatisticsIfVisible();
        }
    }

    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        showCustomConfirm(
            'Aufgabe löschen',
            `Möchtest du die Aufgabe "${todo.text}" wirklich löschen?`,
            'danger'
        ).then((confirmed) => {
            if (confirmed) {
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveTodos();
                this.render();
                this.showNotification('Aufgabe gelöscht!', 'error');
                
                // Update statistics if visible
                this.updateStatisticsIfVisible();
            }
        });
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        showCustomEdit('Aufgabe bearbeiten', todo.text).then((newText) => {
            if (newText !== null && newText.trim() !== '') {
                todo.text = newText.trim();
                this.saveTodos();
                this.render();
                this.showNotification('Aufgabe aktualisiert!', 'success');
                
                // Update statistics if visible
                this.updateStatisticsIfVisible();
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    setPriorityFilter(priority) {
        if (this.currentPriorityFilter === priority) {
            this.currentPriorityFilter = null;
        } else {
            this.currentPriorityFilter = priority;
        }
        
        this.priorityFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === this.currentPriorityFilter);
        });
        this.render();
    }

    getFilteredTodos() {
        let filtered = [...this.todos];

        // Apply status filter
        if (this.currentFilter === 'pending') {
            filtered = filtered.filter(todo => !todo.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        }

        // Apply priority filter
        if (this.currentPriorityFilter) {
            filtered = filtered.filter(todo => todo.priority === this.currentPriorityFilter);
        }

        return filtered;
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('Keine erledigten Aufgaben vorhanden!', 'info');
            return;
        }

        showCustomConfirm(
            'Erledigte Aufgaben löschen',
            `Möchtest du wirklich alle ${completedCount} erledigten Aufgaben löschen?`,
            'danger'
        ).then((confirmed) => {
            if (confirmed) {
                this.todos = this.todos.filter(t => !t.completed);
                this.saveTodos();
                this.render();
                this.showNotification(`${completedCount} erledigte Aufgaben gelöscht!`, 'success');
                
                // Update statistics if visible
                this.updateStatisticsIfVisible();
            }
        });
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showNotification('Keine Aufgaben vorhanden!', 'info');
            return;
        }

        showCustomConfirm(
            'Alle Aufgaben löschen',
            `Möchtest du wirklich alle ${this.todos.length} Aufgaben löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
            'danger'
        ).then((confirmed) => {
            if (confirmed) {
                this.todos = [];
                this.saveTodos();
                this.render();
                this.showNotification('Alle Aufgaben gelöscht!', 'success');
                
                // Update statistics if visible
                this.updateStatisticsIfVisible();
            }
        });
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTodos.textContent = total;
        this.pendingTodos.textContent = pending;
        this.completedTodos.textContent = completed;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Heute';
        if (diffDays === 2) return 'Gestern';
        if (diffDays <= 7) return `vor ${diffDays - 1} Tagen`;
        
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getPriorityText(priority) {
        const priorities = {
            high: 'Hoch',
            medium: 'Mittel',
            low: 'Niedrig'
        };
        return priorities[priority] || priority;
    }

    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;

        li.innerHTML = `
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="app.toggleTodo('${todo.id}')">
                ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="todo-content">
                <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                <div class="todo-meta">
                    <span class="priority-badge priority-${todo.priority}">
                        ${this.getPriorityText(todo.priority)}
                    </span>
                    <span class="todo-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${this.formatDate(todo.createdAt)}
                    </span>
                    ${todo.completedAt ? `
                        <span class="completed-date">
                            <i class="fas fa-check-circle"></i>
                            Erledigt: ${this.formatDate(todo.completedAt)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="todo-actions">
                <button class="action-icon edit-btn" onclick="app.editTodo('${todo.id}')" title="Bearbeiten">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-icon delete-btn" onclick="app.deleteTodo('${todo.id}')" title="Löschen">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return li;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        // Clear todo list
        this.todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            this.emptyState.style.display = 'block';
            this.todoList.style.display = 'none';
        } else {
            this.emptyState.style.display = 'none';
            this.todoList.style.display = 'block';
            
            // Sort todos: incomplete first, then by priority, then by creation date
            filteredTodos.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            filteredTodos.forEach(todo => {
                const todoElement = this.createTodoElement(todo);
                this.todoList.appendChild(todoElement);
            });
        }

        this.updateStats();
    }

    updateStatisticsIfVisible() {
        // Check if statistics page is currently visible
        const statisticsPage = document.getElementById('statisticsPage');
        if (statisticsPage && statisticsPage.style.display === 'block') {
            updateStatisticsData();
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Fehler beim Speichern der Todos:', error);
            this.showNotification('Fehler beim Speichern!', 'error');
        }
    }

    loadTodos() {
        try {
            const saved = localStorage.getItem('todos');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Fehler beim Laden der Todos:', error);
            return [];
        }
    }
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
    initializeBurgerMenu();
    initializePaymentModal();
    initializeCrownButton();
    initializeSearchDropdown();
    initializeFilterDropdown();
});


// Crown Button - Premium Access
function initializeCrownButton() {
    const crownBtn = document.getElementById('crownBtn');
    
    if (crownBtn) {
        crownBtn.addEventListener('click', () => {
            showPaymentModal();
        });
    }
    
    // Also update nav upgrade button to open payment modal
    const navUpgradeBtn = document.querySelector('.nav-upgrade-btn');
    if (navUpgradeBtn) {
        navUpgradeBtn.addEventListener('click', () => {
            showPaymentModal();
            // Close navigation
            const offCanvasNav = document.getElementById('offCanvasNav');
            const navOverlay = document.getElementById('navOverlay');
            const burgerMenu = document.getElementById('burgerMenu');
            if (offCanvasNav) offCanvasNav.classList.remove('open');
            if (navOverlay) navOverlay.classList.remove('active');
            if (burgerMenu) burgerMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

// Search Dropdown in Navigation
function initializeSearchDropdown() {
    const searchToggle = document.getElementById('searchToggle');
    const searchDropdown = document.getElementById('searchDropdown');
    const navSearchInput = document.getElementById('navSearchInput');
    const clearNavSearchBtn = document.getElementById('clearNavSearch');
    const navSearchResults = document.getElementById('navSearchResults');
    
    // Toggle dropdown
    searchToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        searchToggle.classList.toggle('active');
        searchDropdown.classList.toggle('open');
        
        // Focus input when opening
        if (searchDropdown.classList.contains('open')) {
            setTimeout(() => navSearchInput.focus(), 100);
        }
    });
    
    // Search input handler
    navSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length > 0) {
            clearNavSearchBtn.classList.add('visible');
            performNavSearch(query);
        } else {
            clearNavSearchBtn.classList.remove('visible');
            navSearchResults.classList.remove('active');
            navSearchResults.innerHTML = '';
        }
    });
    
    // Clear search
    clearNavSearchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navSearchInput.value = '';
        clearNavSearchBtn.classList.remove('visible');
        navSearchResults.classList.remove('active');
        navSearchResults.innerHTML = '';
        navSearchInput.focus();
    });
    
    // Perform search
    function performNavSearch(query) {
        const results = window.app.todos.filter(todo => 
            todo.text.toLowerCase().includes(query)
        );
        
        if (results.length > 0) {
            navSearchResults.innerHTML = '';
            
            // Add count
            const countEl = document.createElement('div');
            countEl.className = 'nav-search-count';
            countEl.textContent = `${results.length} ${results.length === 1 ? 'Ergebnis' : 'Ergebnisse'}`;
            navSearchResults.appendChild(countEl);
            
            // Add results
            results.forEach(todo => {
                const resultItem = document.createElement('div');
                resultItem.className = 'nav-search-result-item';
                
                const priorityLabels = {
                    high: 'Hoch',
                    medium: 'Mittel',
                    low: 'Niedrig'
                };
                
                resultItem.innerHTML = `
                    <div class="nav-search-result-text">
                        <i class="fas fa-${todo.completed ? 'check-circle' : 'circle'}"></i>
                        ${todo.text}
                    </div>
                    <div class="nav-search-result-meta">
                        <span class="nav-search-result-priority ${todo.priority}">${priorityLabels[todo.priority]}</span>
                        <span class="nav-search-result-status">${todo.completed ? 'Erledigt' : 'Offen'}</span>
                    </div>
                `;
                
                // Click to close dropdown and show todo in main view
                resultItem.addEventListener('click', () => {
                    // Close dropdown
                    searchToggle.classList.remove('active');
                    searchDropdown.classList.remove('open');
                    
                    // Switch to add view and scroll to todo
                    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                    document.getElementById('addView').classList.add('active');
                    
                    // Highlight the todo briefly
                    setTimeout(() => {
                        const todoElement = document.querySelector(`[data-id="${todo.id}"]`);
                        if (todoElement) {
                            todoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            todoElement.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.6)';
                            setTimeout(() => {
                                todoElement.style.boxShadow = '';
                            }, 2000);
                        }
                    }, 300);
                });
                
                navSearchResults.appendChild(resultItem);
            });
            
            navSearchResults.classList.add('active');
        } else {
            navSearchResults.innerHTML = '';
            navSearchResults.classList.remove('active');
        }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchToggle.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchToggle.classList.remove('active');
            searchDropdown.classList.remove('open');
        }
    });
}

// Filter Dropdown in Navigation
function initializeFilterDropdown() {
    const filterToggle = document.getElementById('filterToggle');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterDropdownBtns = document.querySelectorAll('.filter-dropdown-btn');
    const priorityDropdownBtns = document.querySelectorAll('.priority-dropdown-btn');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const dateQuickBtns = document.querySelectorAll('.date-quick-btn');
    const resetFiltersBtn = document.getElementById('resetFilters');
    
    let currentFilter = 'all';
    let currentPriorityFilter = null;
    let currentDateFrom = null;
    let currentDateTo = null;
    
    // Toggle dropdown
    filterToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        filterToggle.classList.toggle('active');
        filterDropdown.classList.toggle('open');
    });
    
    // Status filter buttons
    filterDropdownBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdownBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyDropdownFilters();
        });
    });
    
    // Priority filter buttons
    priorityDropdownBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentPriorityFilter = null;
            } else {
                priorityDropdownBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPriorityFilter = btn.dataset.priority;
            }
            applyDropdownFilters();
        });
    });
    
    // Date inputs
    dateFromInput.addEventListener('change', () => {
        currentDateFrom = dateFromInput.value ? new Date(dateFromInput.value) : null;
        dateQuickBtns.forEach(btn => btn.classList.remove('active'));
        applyDropdownFilters();
    });
    
    dateToInput.addEventListener('change', () => {
        currentDateTo = dateToInput.value ? new Date(dateToInput.value) : null;
        dateQuickBtns.forEach(btn => btn.classList.remove('active'));
        applyDropdownFilters();
    });
    
    // Quick date filter buttons
    dateQuickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            dateQuickBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const range = btn.dataset.range;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (range === 'today') {
                currentDateFrom = new Date(today);
                currentDateTo = new Date(today);
                currentDateTo.setHours(23, 59, 59, 999);
            } else if (range === 'week') {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                currentDateFrom = weekStart;
                currentDateTo = new Date();
            } else if (range === 'month') {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                currentDateFrom = monthStart;
                currentDateTo = new Date();
            }
            
            // Update input fields
            dateFromInput.value = currentDateFrom ? currentDateFrom.toISOString().split('T')[0] : '';
            dateToInput.value = currentDateTo ? currentDateTo.toISOString().split('T')[0] : '';
            
            applyDropdownFilters();
        });
    });
    
    // Reset filters
    resetFiltersBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Reset to default
        currentFilter = 'all';
        currentPriorityFilter = null;
        currentDateFrom = null;
        currentDateTo = null;
        
        // Reset UI
        filterDropdownBtns.forEach(b => b.classList.remove('active'));
        priorityDropdownBtns.forEach(b => b.classList.remove('active'));
        dateQuickBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-dropdown-btn[data-filter="all"]').classList.add('active');
        dateFromInput.value = '';
        dateToInput.value = '';
        
        // Apply filters
        applyDropdownFilters();
    });
    
    // Apply filters to current view
    function applyDropdownFilters() {
        const activeView = document.querySelector('.page.active');
        
        // Get filtered todos
        let filteredTodos = window.app.todos;
        
        // Apply status filter
        if (currentFilter === 'pending') {
            filteredTodos = filteredTodos.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTodos = filteredTodos.filter(t => t.completed);
        }
        
        // Apply priority filter
        if (currentPriorityFilter) {
            filteredTodos = filteredTodos.filter(t => t.priority === currentPriorityFilter);
        }
        
        // Apply date filter
        if (currentDateFrom || currentDateTo) {
            filteredTodos = filteredTodos.filter(t => {
                const todoDate = new Date(t.createdAt);
                todoDate.setHours(0, 0, 0, 0);
                
                if (currentDateFrom && currentDateTo) {
                    const from = new Date(currentDateFrom);
                    from.setHours(0, 0, 0, 0);
                    const to = new Date(currentDateTo);
                    to.setHours(23, 59, 59, 999);
                    return todoDate >= from && todoDate <= to;
                } else if (currentDateFrom) {
                    const from = new Date(currentDateFrom);
                    from.setHours(0, 0, 0, 0);
                    return todoDate >= from;
                } else if (currentDateTo) {
                    const to = new Date(currentDateTo);
                    to.setHours(23, 59, 59, 999);
                    return todoDate <= to;
                }
                return true;
            });
        }
        
        // Update the active view's todo list
        const activeListId = activeView.querySelector('.todo-list')?.id;
        const activeList = document.getElementById(activeListId);
        const activeEmptyState = activeView.querySelector('.empty-state');
        
        if (activeList) {
            if (filteredTodos.length > 0) {
                activeList.innerHTML = '';
                filteredTodos.forEach(todo => {
                    const li = window.app.createTodoElement(todo);
                    activeList.appendChild(li);
                });
                if (activeEmptyState) activeEmptyState.style.display = 'none';
            } else {
                activeList.innerHTML = '';
                if (activeEmptyState) activeEmptyState.style.display = 'flex';
            }
        }
        
        // Update stats if available
        updateStatsForActiveView(filteredTodos, activeView);
    }
    
    function updateStatsForActiveView(todos, view) {
        const viewId = view.id;
        
        if (viewId === 'addView') {
            document.getElementById('totalTodos').textContent = todos.length;
            document.getElementById('pendingTodos').textContent = todos.filter(t => !t.completed).length;
            document.getElementById('completedTodos').textContent = todos.filter(t => t.completed).length;
        }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!filterToggle.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterToggle.classList.remove('active');
            filterDropdown.classList.remove('open');
        }
    });
}

// Burger Menu Functionality
function initializeBurgerMenu() {
    const burgerMenu = document.getElementById('burgerMenu');
    const offCanvasNav = document.getElementById('offCanvasNav');
    const navOverlay = document.getElementById('navOverlay');
    const closeNav = document.getElementById('closeNav');
    const navLinks = document.querySelectorAll('.nav-menu a:not(#filterToggle):not(#searchToggle)');
    const navUpgradeBtn = document.querySelector('.nav-upgrade-btn');
    
    // Toggle navigation
    function toggleNav() {
        const isOpen = offCanvasNav.classList.contains('open');
        
        if (isOpen) {
            closeNavigation();
        } else {
            openNavigation();
        }
    }
    
    function openNavigation() {
        offCanvasNav.classList.add('open');
        navOverlay.classList.add('active');
        burgerMenu.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Add entrance animation to menu items
        navLinks.forEach((link, index) => {
            link.style.opacity = '0';
            link.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                link.style.transition = 'all 0.3s ease';
                link.style.opacity = '1';
                link.style.transform = 'translateX(0)';
            }, index * 50 + 100);
        });
    }
    
    function closeNavigation() {
        offCanvasNav.classList.remove('open');
        navOverlay.classList.remove('active');
        burgerMenu.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        
        // Reset menu item styles
        navLinks.forEach(link => {
            link.style.transition = '';
            link.style.opacity = '';
            link.style.transform = '';
        });
    }
    
    // Event listeners
    burgerMenu.addEventListener('click', toggleNav);
    closeNav.addEventListener('click', closeNavigation);
    navOverlay.addEventListener('click', closeNavigation);
    
    // Close navigation when clicking on nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');
            
            // Handle navigation based on href
            handleNavigation(href, link);
            
            // Close navigation after a short delay
            setTimeout(() => {
                closeNavigation();
            }, 300);
        });
    });
    
    // Handle upgrade button in navigation - now handled in initializeCrownButton()
    
    // Close navigation with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && offCanvasNav.classList.contains('open')) {
            closeNavigation();
        }
    });
    
    // Set initial active state for add link
    const addLink = document.querySelector('.nav-menu a[href="#add"]');
    if (addLink) {
        addLink.classList.add('active');
    }
    
    // Initialize back to todos button
    const backToTodos = document.getElementById('backToTodos');
    if (backToTodos) {
        backToTodos.addEventListener('click', showTodoPage);
    }
}

// Handle navigation actions
function handleNavigation(href, linkElement) {
    const section = href.replace('#', '');
    
    // Skip navigation for filter and search (handled by dropdowns)
    if (section === 'filter' || section === 'search') {
        return;
    }
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav links (except filter and search)
    document.querySelectorAll('.nav-menu a:not(#filterToggle):not(#searchToggle)').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    if (linkElement) {
        linkElement.classList.add('active');
    }
    
    // Show selected page
    switch (section) {
        case 'add':
            document.getElementById('addView').classList.add('active');
            break;
        default:
            document.getElementById('addView').classList.add('active');
    }
}

// Show navigation-specific notifications
function showNavigationNotification(message, type = 'info') {
    // Remove existing navigation notifications
    const existingNotifications = document.querySelectorAll('.nav-notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `nav-notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(102, 126, 234, 0.9)'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 2000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: slideInTop 0.3s ease;
        max-width: 400px;
        text-align: center;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutTop 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Page Navigation Functions
function showStatistics() {
    const todoPage = document.getElementById('todoPage');
    const statisticsPage = document.getElementById('statisticsPage');
    
    // Hide todo page, show statistics page
    todoPage.style.display = 'none';
    statisticsPage.style.display = 'block';
    
    // Close off-canvas navigation
    closeNavigation();
    
    // Update statistics data
    updateStatisticsData();
    
    showNavigationNotification('Statistiken werden angezeigt', 'success');
}

function showTodoPage() {
    const todoPage = document.getElementById('todoPage');
    const statisticsPage = document.getElementById('statisticsPage');
    
    // Show todo page, hide statistics page
    todoPage.style.display = 'block';
    statisticsPage.style.display = 'none';
}

function updateStatisticsData() {
    const todos = window.app ? window.app.todos : [];
    
    // Basic counts
    const totalTodos = todos.length;
    const completedTodos = todos.filter(t => t.completed).length;
    const pendingTodos = totalTodos - completedTodos;
    
    // Update overview cards
    document.getElementById('statTotalTodos').textContent = totalTodos;
    document.getElementById('statCompletedTodos').textContent = completedTodos;
    document.getElementById('statPendingTodos').textContent = pendingTodos;
    
    // Update progress
    const progressPercentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
    document.getElementById('progressPercentage').textContent = progressPercentage + '%';
    document.getElementById('progressFill').style.width = progressPercentage + '%';
    
    // Priority breakdown
    const highPriority = todos.filter(t => t.priority === 'high').length;
    const mediumPriority = todos.filter(t => t.priority === 'medium').length;
    const lowPriority = todos.filter(t => t.priority === 'low').length;
    
    document.getElementById('statHighPriority').textContent = highPriority;
    document.getElementById('statMediumPriority').textContent = mediumPriority;
    document.getElementById('statLowPriority').textContent = lowPriority;
    
    // Update activity timeline
    updateActivityTimeline(todos);
    
    // Update insights
    updateProductivityInsights(todos);
}

function updateActivityTimeline(todos) {
    const timeline = document.getElementById('activityTimeline');
    
    // Get recent activities (last 10 completed or created todos)
    const recentActivities = [];
    
    // Add completed todos
    todos.filter(t => t.completed && t.completedAt)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5)
        .forEach(todo => {
            recentActivities.push({
                type: 'completed',
                text: `"${todo.text}" erledigt`,
                time: todo.completedAt,
                icon: 'fas fa-check-circle'
            });
        });
    
    // Add recently created todos
    todos.filter(t => !t.completed)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .forEach(todo => {
            recentActivities.push({
                type: 'created',
                text: `"${todo.text}" erstellt`,
                time: todo.createdAt,
                icon: 'fas fa-plus-circle'
            });
        });
    
    // Sort by time and take top 8
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const topActivities = recentActivities.slice(0, 8);
    
    if (topActivities.length === 0) {
        timeline.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon"><i class="fas fa-info-circle"></i></div>
                <div class="activity-text">Keine Aktivitäten vorhanden</div>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = topActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}"><i class="${activity.icon}"></i></div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${formatTimeAgo(activity.time)}</div>
            </div>
        </div>
    `).join('');
}

function updateProductivityInsights(todos) {
    // Calculate streak (consecutive days with completed todos)
    const streak = calculateStreak(todos);
    document.getElementById('streakDays').textContent = streak + ' Tage';
    
    // Calculate best week (most todos completed in a week)
    const bestWeek = calculateBestWeek(todos);
    document.getElementById('bestWeek').textContent = bestWeek + ' erledigt';
    
    // Calculate average per day
    const avgPerDay = calculateAveragePerDay(todos);
    document.getElementById('avgPerDay').textContent = avgPerDay.toFixed(1);
}

function calculateStreak(todos) {
    const completedTodos = todos.filter(t => t.completed && t.completedAt)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    if (completedTodos.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if there's activity today or yesterday
    const today = new Date(currentDate);
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let hasActivityToday = completedTodos.some(todo => {
        const todoDate = new Date(todo.completedAt);
        todoDate.setHours(0, 0, 0, 0);
        return todoDate.getTime() === today.getTime();
    });
    
    let hasActivityYesterday = completedTodos.some(todo => {
        const todoDate = new Date(todo.completedAt);
        todoDate.setHours(0, 0, 0, 0);
        return todoDate.getTime() === yesterday.getTime();
    });
    
    // Start counting from today or yesterday
    let checkDate = hasActivityToday ? today : (hasActivityYesterday ? yesterday : null);
    
    if (!checkDate) return 0;
    
    // Count consecutive days
    while (checkDate) {
        const hasActivity = completedTodos.some(todo => {
            const todoDate = new Date(todo.completedAt);
            todoDate.setHours(0, 0, 0, 0);
            return todoDate.getTime() === checkDate.getTime();
        });
        
        if (hasActivity) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

function calculateBestWeek(todos) {
    const completedTodos = todos.filter(t => t.completed && t.completedAt);
    if (completedTodos.length === 0) return 0;
    
    const weekCounts = {};
    
    completedTodos.forEach(todo => {
        const date = new Date(todo.completedAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        
        const weekKey = weekStart.toISOString().split('T')[0];
        weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    });
    
    return Math.max(...Object.values(weekCounts));
}

function calculateAveragePerDay(todos) {
    const completedTodos = todos.filter(t => t.completed && t.completedAt);
    if (completedTodos.length === 0) return 0;
    
    const oldestDate = new Date(Math.min(...completedTodos.map(t => new Date(t.completedAt))));
    const today = new Date();
    const daysDiff = Math.max(1, Math.ceil((today - oldestDate) / (1000 * 60 * 60 * 24)));
    
    return completedTodos.length / daysDiff;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
        return `vor ${diffMinutes} Min.`;
    } else if (diffHours < 24) {
        return `vor ${diffHours} Std.`;
    } else if (diffDays === 1) {
        return 'Gestern';
    } else if (diffDays < 7) {
        return `vor ${diffDays} Tagen`;
    } else {
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
}

// Payment Modal Functions
function initializePaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentBtn = document.getElementById('closePayment');
    const cancelPaymentBtn = document.getElementById('cancelPayment');
    const paymentForm = document.getElementById('paymentForm');
    
    // Close payment modal
    if (closePaymentBtn) {
        closePaymentBtn.addEventListener('click', hidePaymentModal);
    }
    
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', hidePaymentModal);
    }
    
    // Close modal when clicking overlay
    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                hidePaymentModal();
            }
        });
    }
    
    // Handle form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmission);
    }
    
    // Initialize form validation and formatting
    initializePaymentFormValidation();
}

function showPaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    
    // Show payment modal
    if (paymentModal) {
        paymentModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = paymentModal.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }
}

function hidePaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    
    if (paymentModal) {
        paymentModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        const form = document.getElementById('paymentForm');
        if (form) {
            form.reset();
        }
    }
}

function initializePaymentFormValidation() {
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    const zipCodeInput = document.getElementById('zipCode');
    
    // Format card number
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Format expiry date
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Format CVV (numbers only)
    if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Format ZIP code (numbers only for German postal codes)
    if (zipCodeInput) {
        zipCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 5);
        });
    }
    
    // Auto-fill card name from billing name
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const cardNameInput = document.getElementById('cardName');
    
    function updateCardName() {
        if (firstNameInput && lastNameInput && cardNameInput) {
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            if (firstName && lastName && !cardNameInput.value) {
                cardNameInput.value = `${firstName} ${lastName}`;
            }
        }
    }
    
    if (firstNameInput) firstNameInput.addEventListener('blur', updateCardName);
    if (lastNameInput) lastNameInput.addEventListener('blur', updateCardName);
}

function handlePaymentSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const completePaymentBtn = document.getElementById('completePayment');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Check terms acceptance
    const termsCheckbox = document.getElementById('terms');
    if (!termsCheckbox.checked) {
        alert('Bitte akzeptieren Sie die AGB und Datenschutzbestimmungen.');
        return;
    }
    
    // Simulate payment processing
    completePaymentBtn.disabled = true;
    completePaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zahlung wird verarbeitet...';
    
    // Simulate API call delay
    setTimeout(() => {
        // Simulate successful payment
        showPaymentSuccess();
        hidePaymentModal();
        
        // Reset button
        completePaymentBtn.disabled = false;
        completePaymentBtn.innerHTML = '<i class="fas fa-lock"></i> Sicher bezahlen - €4.99';
    }, 3000);
}

function showPaymentSuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'notification notification-success payment-success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <div class="success-content">
            <h3>Zahlung erfolgreich!</h3>
            <p>Willkommen bei Todo App Premium! Alle Features sind jetzt freigeschaltet.</p>
        </div>
    `;
    
    // Add success-specific styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);
        z-index: 10001;
        max-width: 400px;
        animation: slideInRight 0.5s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
    
    // Update app to premium state (you could store this in localStorage)
    localStorage.setItem('isPremium', 'true');
}

// Custom Modal Functions
function showCustomConfirm(title, message, type = 'default') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleElement = document.getElementById('confirmTitle');
        const messageElement = document.getElementById('confirmMessage');
        const iconElement = document.getElementById('confirmIcon');
        const cancelBtn = document.getElementById('confirmCancel');
        const okBtn = document.getElementById('confirmOk');
        
        // Set content
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Set icon and button style based on type
        if (type === 'danger') {
            iconElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            okBtn.classList.add('danger');
            okBtn.innerHTML = '<i class="fas fa-trash"></i> Löschen';
        } else {
            iconElement.innerHTML = '<i class="fas fa-question-circle"></i>';
            okBtn.classList.remove('danger');
            okBtn.innerHTML = '<i class="fas fa-check"></i> Bestätigen';
        }
        
        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on cancel button by default
        setTimeout(() => cancelBtn.focus(), 100);
        
        // Event handlers
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Enter' && e.target === okBtn) {
                handleConfirm();
            }
        };
        
        const handleOverlayClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };
        
        const cleanup = () => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleConfirm);
            document.removeEventListener('keydown', handleKeydown);
            modal.removeEventListener('click', handleOverlayClick);
        };
        
        // Add event listeners
        cancelBtn.addEventListener('click', handleCancel);
        okBtn.addEventListener('click', handleConfirm);
        document.addEventListener('keydown', handleKeydown);
        modal.addEventListener('click', handleOverlayClick);
    });
}

function showCustomEdit(title, currentText) {
    return new Promise((resolve) => {
        const modal = document.getElementById('editModal');
        const input = document.getElementById('editInput');
        const charCount = document.getElementById('charCount');
        const cancelBtn = document.getElementById('editCancel');
        const saveBtn = document.getElementById('editSave');
        
        // Set initial values
        input.value = currentText;
        updateCharCount();
        
        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on input and select text
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);
        
        // Update character count
        function updateCharCount() {
            const count = input.value.length;
            charCount.textContent = count;
            
            const counter = charCount.parentElement;
            counter.classList.remove('warning', 'danger');
            
            if (count > 180) {
                counter.classList.add('danger');
            } else if (count > 150) {
                counter.classList.add('warning');
            }
            
            // Disable save button if empty or too long
            saveBtn.disabled = count === 0 || count > 200;
            if (saveBtn.disabled) {
                saveBtn.style.opacity = '0.5';
                saveBtn.style.cursor = 'not-allowed';
            } else {
                saveBtn.style.opacity = '';
                saveBtn.style.cursor = '';
            }
        }
        
        // Event handlers
        const handleCancel = () => {
            cleanup();
            resolve(null);
        };
        
        const handleSave = () => {
            if (input.value.trim() && input.value.length <= 200) {
                cleanup();
                resolve(input.value);
            }
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
            }
        };
        
        const handleOverlayClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };
        
        const cleanup = () => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            cancelBtn.removeEventListener('click', handleCancel);
            saveBtn.removeEventListener('click', handleSave);
            input.removeEventListener('input', updateCharCount);
            document.removeEventListener('keydown', handleKeydown);
            modal.removeEventListener('click', handleOverlayClick);
        };
        
        // Add event listeners
        cancelBtn.addEventListener('click', handleCancel);
        saveBtn.addEventListener('click', handleSave);
        input.addEventListener('input', updateCharCount);
        document.addEventListener('keydown', handleKeydown);
        modal.addEventListener('click', handleOverlayClick);
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add todo
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('todoInput').focus();
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        const nav = document.getElementById('offCanvasNav');
        
        if (!nav.classList.contains('open')) {
            document.getElementById('todoInput').value = '';
            document.getElementById('todoInput').blur();
        }
    }
    
    // Ctrl/Cmd + M to toggle navigation
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        const burgerMenu = document.getElementById('burgerMenu');
        if (burgerMenu) {
            burgerMenu.click();
        }
    }
});

