// Main JS file for Task Manager

document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme Management ----
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        updateThemeIcon();
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon();
        });
    }

    function updateThemeIcon() {
        const iconContainer = document.getElementById('theme-icon');
        if (!iconContainer) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            // Sun icon
            iconContainer.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
        } else {
            // Moon icon
            iconContainer.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
    }

    // ---- Routing & Auth Check ----
    const token = localStorage.getItem('token');
    const path = window.location.pathname;

    if (!token && path === '/') {
        window.location.href = '/login';
        return;
    }

    if (token && (path === '/login' || path === '/register')) {
        window.location.href = '/';
        return;
    }

    if (path === '/') {
        // Dashboard logic
        loadTasks();
        setupDashboard();
    } else if (path === '/login') {
        setupLogin();
    } else if (path === '/register') {
        setupRegister();
    }

    // ---- Login Logic ----
    function setupLogin() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('auth-error');

            try {
                // OAuth2 expects form data
                const formData = new URLSearchParams();
                formData.append('username', email);
                formData.append('password', password);

                const res = await fetch('/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Login failed');

                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user_email', email);
                window.location.href = '/';
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // ---- Register Logic ----
    function setupRegister() {
        const form = document.getElementById('register-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('auth-error');

            try {
                const res = await fetch('/users/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Registration failed');

                // Auto login after register
                const formData = new URLSearchParams();
                formData.append('username', email);
                formData.append('password', password);
                
                const loginRes = await fetch('/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });
                const loginData = await loginRes.json();
                
                localStorage.setItem('token', loginData.access_token);
                localStorage.setItem('user_email', email);
                window.location.href = '/';
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // ---- Dashboard Logic ----
    function setupDashboard() {
        const userEmailDisplay = document.getElementById('user-email-display');
        if (userEmailDisplay) {
            userEmailDisplay.textContent = localStorage.getItem('user_email') || '';
        }

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user_email');
            window.location.href = '/login';
        });

        // Modal Logic
        const modal = document.getElementById('task-modal');
        const newTaskBtn = document.getElementById('new-task-btn');
        const closeBtns = document.querySelectorAll('.close-modal');
        const taskForm = document.getElementById('task-form');

        newTaskBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Create Task';
            document.getElementById('task-id').value = '';
            taskForm.reset();
            modal.classList.remove('hidden');
        });

        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => modal.classList.add('hidden'));
        });

        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('task-id').value;
            const title = document.getElementById('task-title').value;
            const description = document.getElementById('task-desc').value;

            const payload = { title, description };

            try {
                const url = id ? `/tasks/${id}` : '/tasks/';
                const method = id ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('Failed to save task');
                
                modal.classList.add('hidden');
                loadTasks();
            } catch (err) {
                alert(err.message);
            }
        });
    }

    async function loadTasks() {
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const taskList = document.getElementById('task-list');

        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        taskList.classList.add('hidden');
        taskList.innerHTML = '';

        try {
            const res = await fetch('/tasks/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            const tasks = await res.json();
            
            loadingState.classList.add('hidden');

            if (tasks.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                tasks.forEach(task => {
                    const li = document.createElement('li');
                    li.className = `task-item ${task.completed ? 'completed' : ''}`;
                    li.innerHTML = `
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                        <div class="task-content">
                            <div class="task-title">${escapeHTML(task.title)}</div>
                            ${task.description ? `<div class="task-desc">${escapeHTML(task.description)}</div>` : ''}
                        </div>
                        <div class="task-actions">
                            <button class="icon-btn btn-edit" data-id="${task.id}" data-title="${escapeHTML(task.title)}" data-desc="${escapeHTML(task.description || '')}" title="Edit Task">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="icon-btn btn-delete" data-id="${task.id}" title="Delete Task">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    `;
                    taskList.appendChild(li);
                });

                taskList.classList.remove('hidden');
                attachTaskListeners();
            }
        } catch (err) {
            console.error('Error loading tasks:', err);
            loadingState.classList.add('hidden');
            alert('Failed to load tasks.');
        }
    }

    function attachTaskListeners() {
        // Toggle completion
        document.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const id = e.target.getAttribute('data-id');
                const completed = e.target.checked;
                const li = e.target.closest('.task-item');
                
                if (completed) {
                    li.classList.add('completed');
                } else {
                    li.classList.remove('completed');
                }

                try {
                    // Fetch existing to retain title/desc, or our API allows partial update?
                    // The API requires title (TaskCreate schema).
                    const titleEl = li.querySelector('.task-title');
                    const descEl = li.querySelector('.task-desc');
                    const payload = {
                        title: titleEl ? titleEl.textContent : '',
                        description: descEl ? descEl.textContent : '',
                        completed: completed
                    };

                    await fetch(`/tasks/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(payload)
                    });
                } catch (err) {
                    console.error(err);
                    e.target.checked = !completed; // Revert
                }
            });
        });

        // Edit
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                const title = btn.getAttribute('data-title');
                const desc = btn.getAttribute('data-desc');

                document.getElementById('modal-title').textContent = 'Edit Task';
                document.getElementById('task-id').value = id;
                document.getElementById('task-title').value = title;
                document.getElementById('task-desc').value = desc;
                
                document.getElementById('task-modal').classList.remove('hidden');
            });
        });

        // Delete
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm('Are you sure you want to delete this task?')) return;
                
                const id = btn.getAttribute('data-id');
                try {
                    await fetch(`/tasks/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    loadTasks();
                } catch (err) {
                    console.error(err);
                    alert('Failed to delete task');
                }
            });
        });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }
});
