/**
 * TIMELY — Local-First Life Planner 
 * Core Application Engine (Vanilla Modern Architecture)
 */

// --- Application Core State ---
let state = {
    currentMode: 'schedule', // 'schedule' | 'planning'
    currentScheduleView: 'daily', // 'daily' | 'weekly' | 'monthly' | 'reminders'
    cards: [],
    containers: [] // For Goals & Projects
};

// --- Initialization & Bootstrapping ---
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    initDefaultContainers();
    registerGlobalEventListeners();
    renderApp();
});

// --- LocalStorage Mechanics ---
function saveDataToStorage() {
    localStorage.setItem('timely_state_cards', JSON.stringify(state.cards));
    localStorage.setItem('timely_state_containers', JSON.stringify(state.containers));
}

function loadDataFromStorage() {
    const savedCards = localStorage.getItem('timely_state_cards');
    const savedContainers = localStorage.getItem('timely_state_containers');
    
    if (savedCards) state.cards = JSON.parse(savedCards);
    if (savedContainers) state.containers = JSON.parse(savedContainers);
}

function initDefaultContainers() {
    if (state.containers.length === 0) {
        state.containers = [
            { id: 'g-1', title: 'Health & Vitality', type: 'goal' },
            { id: 'g-2', title: 'Deep Work Philosophy', type: 'goal' },
            { id: 'p-1', title: 'Forth Hub Buildout', type: 'project' },
            { id: 'p-2', title: 'The Call of Guardians MS', type: 'project' }
        ];
        saveDataToStorage();
    }
}

// --- Global Event Router ---
function registerGlobalEventListeners() {
    // Primary Layout Switchers
    document.getElementById('btn-schedule-mode').addEventListener('click', () => switchMode('schedule'));
    document.getElementById('btn-planning-mode').addEventListener('click', () => switchMode('planning'));

    // Sub-view Tab Navigations
    document.querySelectorAll('#schedule-view-selector .sub-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#schedule-view-selector .sub-nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            switchScheduleView(e.target.dataset.view);
        });
    });

    // Inboxes and Utility Fast-Adds
    document.getElementById('btn-add-universal').addEventListener('click', () => {
        createNewCard({ type: 'Universal Card', targetZone: 'universal', targetIndex: '0' });
    });

    // Native Drag and Drop Management Hooks
    setupDragAndDropFramework();

    // Modal Interaction Interfaces
    document.getElementById('btn-modal-close').addEventListener('click', closeModal);
    document.getElementById('btn-modal-save').addEventListener('click', saveModalChanges);
    
    // iCal Downloader Action Trigger
    document.getElementById('btn-export-ical').addEventListener('click', exportSelectedToICal);
}

// --- View Navigation Controllers ---
function switchMode(targetMode) {
    state.currentMode = targetMode;
    document.getElementById('btn-schedule-mode').classList.toggle('active', targetMode === 'schedule');
    document.getElementById('btn-planning-mode').classList.toggle('active', targetMode === 'planning');
    
    const subNav = document.getElementById('schedule-view-selector');
    if (targetMode === 'schedule') {
        subNav.classList.remove('hidden');
    } else {
        subNav.classList.add('hidden');
    }
    renderApp();
}

function switchScheduleView(targetView) {
    state.currentScheduleView = targetView;
    renderApp();
}

// --- High-Performance Render System ---
function renderApp() {
    const mainWorkspace = document.getElementById('workspace-main');
    mainWorkspace.innerHTML = ''; // Clean old context nodes completely

    if (state.currentMode === 'schedule') {
        switch (state.currentScheduleView) {
            case 'daily': renderDailyView(mainWorkspace); break;
            case 'weekly': renderWeeklyView(mainWorkspace); break;
            case 'monthly': renderMonthlyView(mainWorkspace); break;
            case 'reminders': renderRemindersView(mainWorkspace); break;
        }
    } else {
        renderPlanningModeView(mainWorkspace);
    }

    renderUniversalBoard();
    attachCardInteractions();
}

// --- Specific View Templates Execution ---
function renderDailyView(target) {
    let html = `<div class="pane-header"><h2>Daily Schedule Grid</h2><button class="add-card-btn" onclick="createNewCardFromUI('Daily Card', '08:00')">+ Add Time Block</button></div>`;
    html += `<div class="daily-layout">`;
    const hours = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
    
    hours.forEach(hour => {
        html += `
            <div class="time-slot-row">
                <div class="slot-time-label">${hour}</div>
                <div class="slot-drop-zone drop-zone" data-zone-type="daily" data-zone-id="${hour}">
                    ${renderCardsForZone('daily', hour)}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    target.innerHTML = html;
}

function renderWeeklyView(target) {
    let html = `<div class="pane-header"><h2>Weekly Routine Horizon</h2></div>`;
    html += `<div class="weekly-layout">`;
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const sections = ["Morning", "Noon", "Afternoon", "Evening", "Night"];

    days.forEach(day => {
        html += `<div class="weekly-day-col"><div class="day-col-header">${day}</div>`;
        sections.forEach(sec => {
            const compositeKey = `${day}-${sec}`;
            html += `
                <div class="weekly-section">
                    <div class="section-label">${sec}</div>
                    <div class="drop-zone" data-zone-type="weekly" data-zone-id="${compositeKey}">
                        ${renderCardsForZone('weekly', compositeKey)}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    });
    html += `</div>`;
    target.innerHTML = html;
}

function renderMonthlyView(target) {
    let html = `<div class="pane-header"><h2>Monthly Calendar Matrix</h2></div>`;
    html += `<div class="monthly-layout">`;
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekDays.forEach(wd => html += `<div class="month-day-head">${wd}</div>`);

    // Emulating standard 31-day view block
    for (let d = 1; d <= 31; d++) {
        html += `
            <div class="monthly-day-cell">
                <div class="cell-number">${d}</div>
                <div class="drop-zone" style="flex-grow:1;" data-zone-type="monthly" data-zone-id="day-${d}">
                    ${renderCardsForZone('monthly', `day-${d}`)}
                </div>
            </div>
        `;
    }
    html += `</div>`;
    target.innerHTML = html;
}

function renderRemindersView(target) {
    let html = `
        <div class="pane-header"><h2>Reminders Desk</h2></div>
        <div class="reminders-layout">
            <div class="flex-board-column">
                <div class="pane-header"><strong>Action Desk</strong><button class="add-card-btn" onclick="createNewCardFromUI('Reminder Card', 'reminders-main')">+ Add</button></div>
                <div class="drop-zone" data-zone-type="reminders" data-zone-id="reminders-main">
                    ${renderCardsForZone('reminders', 'reminders-main')}
                </div>
            </div>
        </div>
    `;
    target.innerHTML = html;
}

function renderPlanningModeView(target) {
    const goals = state.containers.filter(c => c.type === 'goal');
    const projects = state.containers.filter(c => c.type === 'project');

    let html = `<div class="pane-header"><h2>System Architecture Framework (Thinking Mode)</h2></div>`;
    
    html += `<h3>Strategic Long-Term Goals</h3><div class="planning-layout" style="margin-bottom: 2rem;">`;
    goals.forEach(g => {
        html += `
            <div class="flex-board-column">
                <div class="pane-header"><strong>${g.title}</strong><button class="add-card-btn" onclick="createNewCardFromUI('Goal Task Card', '${g.id}')">+ Add Step</button></div>
                <div class="drop-zone" data-zone-type="goal" data-zone-id="${g.id}">
                    ${renderCardsForZone('goal', g.id)}
                </div>
            </div>
        `;
    });
    html += `</div>`;

    html += `<h3>Active Implementation Projects</h3><div class="planning-layout">`;
    projects.forEach(p => {
        html += `
            <div class="flex-board-column">
                <div class="pane-header"><strong>${p.title}</strong><button class="add-card-btn" onclick="createNewCardFromUI('Project Task Card', '${p.id}')">+ Add Task</button></div>
                <div class="drop-zone" data-zone-type="project" data-zone-id="${p.id}">
                    ${renderCardsForZone('project', p.id)}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    
    target.innerHTML = html;
}

function renderUniversalBoard() {
    const board = document.getElementById('universal-board');
    board.innerHTML = renderCardsForZone('universal', 'universal');
}

function renderCardsForZone(zoneType, zoneId) {
    return state.cards
        .filter(c => c.targetZone === zoneType && c.targetIndex === zoneId)
        .sort((a, b) => a.position - b.position)
        .map(c => generateCardHTML(c))
        .join('');
}

// Global shortcut dynamic bindings helper
window.createNewCardFromUI = function(originType, zoneId) {
    let resolvedZone = 'universal';
    if (originType === 'Daily Card') resolvedZone = 'daily';
    if (originType === 'Weekly Card') resolvedZone = 'weekly';
    if (originType === 'Monthly Card') resolvedZone = 'monthly';
    if (originType === 'Reminder Card') resolvedZone = 'reminders';
    if (originType === 'Goal Task Card') resolvedZone = 'goal';
    if (originType === 'Project Task Card') resolvedZone = 'project';

    createNewCard({ type: originType, targetZone: resolvedZone, targetIndex: zoneId });
};

// --- Card HTML Generator Generator ---
function generateCardHTML(card) {
    const routineBadge = card.metadata && card.metadata.repeat && card.metadata.repeat !== 'none' 
        ? `<span class="badge routine">🔁 ${card.metadata.repeat}</span>` 
        : '';
    return `
        <div class="timely-card" draggable="true" id="card-${card.id}" data-id="${card.id}">
            <div class="card-header-row">
                <div class="card-title" contenteditable="true" data-id="${card.id}">${card.title}</div>
                <div class="card-actions-wrapper">
                    <button class="card-btn edit-trigger" data-id="${card.id}">⚙️</button>
                </div>
            </div>
            ${card.description ? `<div class="card-desc">${card.description}</div>` : ''}
            <div class="card-badges">
                <span class="badge origin">${card.type}</span>
                ${routineBadge}
            </div>
        </div>
    `;
}

// --- Mutation and Core CRUD Architecture ---
function createNewCard({ type, targetZone, targetIndex }) {
    const newCard = {
        id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: 'Untitled Plan',
        description: '',
        type: type, // Origin Type Permanent Record
        createdAt: new Date().toISOString(),
        status: 'open',
        position: Date.now(),
        targetZone: targetZone,
        targetIndex: targetIndex,
        metadata: { repeat: 'none' }
    };

    state.cards.push(newCard);
    saveDataToStorage();
    renderApp();
}

function attachCardInteractions() {
    // Structural ContentEditable Realtime Sync
    document.querySelectorAll('.card-title').forEach(el => {
        el.addEventListener('blur', (e) => {
            const cardId = e.target.dataset.id;
            const card = state.cards.find(c => c.id === cardId);
            if (card) {
                card.title = e.target.innerText.trim() || 'Untitled Plan';
                saveDataToStorage();
            }
        });
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
        });
    });

    // Custom Context Configurations Dialog Triggers
    document.querySelectorAll('.edit-trigger').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(e.target.dataset.id);
        });
    });

    // Drag Initialization Setup listeners
    document.querySelectorAll('.timely-card').forEach(cardEl => {
        cardEl.addEventListener('dragstart', handleDragStart);
        cardEl.addEventListener('dragend', handleDragEnd);
    });
}

// --- Native High-Fidelity Drag and Drop Engine ---
let draggedCardId = null;

function setupDragAndDropFramework() {
    const zones = [document.getElementById('universal-board'), document.getElementById('trash-zone')];
    
    // Delegate dynamic event hooks across shared workspace containers
    const workspace = document.getElementById('workspace-main');
    
    // Registering dynamic capture arrays for flexible execution
    bindDropZoneEvents(document.getElementById('universal-board'));
    bindDropZoneEvents(document.getElementById('trash-zone'));

    // Observe changes inside workspace main grid
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            bindDropZoneEvents(zone);
        });
    });
    observer.observe(workspace, { childList: true, subtree: true });
}

function bindDropZoneEvents(zone) {
    if (!zone || zone.dataset.bound === 'true') return;
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragenter', handleDragEnter);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
    zone.dataset.bound = 'true';
}

function handleDragStart(e) {
    draggedCardId = e.target.dataset.id;
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedCardId);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.drop-zone, .trash-container').forEach(z => {
        z.classList.remove('drag-over');
    });
    draggedCardId = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.add('drag-over');
}

function handleDragLeave(e) {
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');

    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (!cardId) return;

    // Trash Routing Flow Engine
    if (zone.id === 'trash-zone') {
        state.cards = state.cards.filter(c => c.id !== cardId);
        saveDataToStorage();
        renderApp();
        return;
    }

    // Capture Zone Target Structural Directives
    const zoneType = zone.dataset.zoneType;
    const zoneId = zone.dataset.zoneId || 'universal';

    const card = state.cards.find(c => c.id === cardId);
    if (card) {
        card.targetZone = zoneType;
        card.targetIndex = zoneId;
        card.position = Date.now(); // Put at end of list sequentially

        // CRITICAL TRANSFORMATION RULE INTERCEPTOR
        if (zoneType === 'universal') {
            card.type = 'Universal Card'; // Permanent Conversion Ruleset applied
        }

        saveDataToStorage();
        renderApp();
    }
}

// --- Modal Configuration Architecture ---
let activeModalCardId = null;

function openModal(cardId) {
    activeModalCardId = cardId;
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    document.getElementById('modal-card-title').value = card.title;
    document.getElementById('modal-card-desc').value = card.description || '';
    
    const repeatValue = (card.metadata && card.metadata.repeat) ? card.metadata.repeat : 'none';
    const radio = document.querySelector(`input[name="routine-repeat"][value="${repeatValue}"]`);
    if (radio) radio.checked = true;

    document.getElementById('card-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('card-modal').classList.add('hidden');
    activeModalCardId = null;
}

function saveModalChanges() {
    if (!activeModalCardId) return;
    const card = state.cards.find(c => c.id === activeModalCardId);
    if (card) {
        card.title = document.getElementById('modal-card-title').value.trim() || 'Untitled Plan';
        card.description = document.getElementById('modal-card-desc').value.trim();
        
        const selectedRepeat = document.querySelector('input[name="routine-repeat"]:checked').value;
        if (!card.metadata) card.metadata = {};
        card.metadata.repeat = selectedRepeat;

        saveDataToStorage();
        renderApp();
    }
    closeModal();
}

// --- iCal Sync Exporter Module Engine ---
function exportSelectedToICal() {
    // Selector restriction: Daily, Weekly, Monthly cards placed in schedule views
    const targetCards = state.cards.filter(c => 
        ['daily', 'weekly', 'monthly'].includes(c.targetZone)
    );

    if (targetCards.length === 0) {
        alert("No scheduled cards found in Daily, Weekly, or Monthly frames to export.");
        return;
    }

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Timely Local First Planner//NONSGML v1.0//EN',
        'CALSCALE:GREGORIAN'
    ];

    const todayStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    targetCards.forEach(card => {
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${card.id}@timely.local`);
        icsContent.push(`DTSTAMP:${todayStr}`);
        icsContent.push(`DTSTART:${todayStr}`); // Default fallback instant timeline window marker
        icsContent.push(`SUMMARY:${card.title}`);
        if (card.description) {
            icsContent.push(`DESCRIPTION:${card.description.replace(/\n/g, '\\n')}`);
        }
        
        // Routines serialization mapper pattern standard rules
        if (card.metadata && card.metadata.repeat && card.metadata.repeat !== 'none') {
            let freq = 'DAILY';
            if (card.metadata.repeat === 'weekly') freq = 'WEEKLY';
            if (card.metadata.repeat === 'monthly') freq = 'MONTHLY';
            icsContent.push(`RRULE:FREQ=${freq}`);
        }
        
        icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');
    const icsString = icsContent.join('\r\n');

    // Create secure transient execution down-pipe link element
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `timely_schedule_${Date.now()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
