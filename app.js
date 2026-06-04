/**
 * TIMELY — Local-First Life Planner 
 * Core Application Engine (Vanilla Modern Architecture)
 */

// --- Application Core State ---
let state = {
    currentMode: 'schedule', // 'schedule' | 'planning'
    currentScheduleView: 'daily', // 'daily' | 'weekly' | 'monthly' | 'reminders'
    currentPlanningView: 'goals', // 'goals' | 'projects'
    carouselIndex: 0, // Track column sliding viewport offset
    cards: [],
    containers: [] // For Goals & Projects
};

const CAROUSEL_VISIBLE_LIMIT = 3; // Max number of visible columns in carousel

// --- Initialization & Bootstrapping ---
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    initDefaultContainers();
    registerGlobalEventListeners();
    renderApp();
});

// --- Local Storage Mechanics ---
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

// --- Modified Default Containers ---
function initDefaultContainers() {
    if (state.containers.length === 0) {
        state.containers = [
            { id: 'g-1', title: 'Health & Vitality', type: 'goal' },
            { id: 'g-2', title: 'Deep Work Philosophy', type: 'goal' },
            { id: 'g-3', title: 'Financial Independence', type: 'goal' },
            { id: 'g-4', title: 'Mindfulness Practice', type: 'goal' },
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

    // Schedule Sub-view Tab Navigations
    document.querySelectorAll('#schedule-view-selector .sub-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#schedule-view-selector .sub-nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            switchScheduleView(e.target.dataset.view);
        });
    });

    // Inboxes And Utility Fast Adds
    document.getElementById('btn-add-universal').addEventListener('click', () => {
        createNewCard({ type: 'Universal Card', targetZone: 'universal', targetIndex: 'universal' });
    });
    
    // Native Drag And Drop Management Hooks
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
    state.carouselIndex = 0; // Reset viewport alignment
    document.getElementById('btn-schedule-mode').classList.toggle('active', targetMode === 'schedule');
    document.getElementById('btn-planning-mode').classList.toggle('active', targetMode === 'planning');
    
    const schedNav = document.getElementById('schedule-view-selector');
    const planNav = document.getElementById('planning-view-selector');

    if (targetMode === 'schedule') {
        if (schedNav) schedNav.classList.remove('hidden');
        if (planNav) planNav.classList.add('hidden');
    } else {
        if (schedNav) schedNav.classList.add('hidden');
        if (planNav) planNav.classList.remove('hidden');
        setupPlanningNavListeners();
    }
    renderApp();
}

function setupPlanningNavListeners() {
    const planNav = document.getElementById('planning-view-selector');
    if (!planNav) return;
    
    // Capitalized consistently to match 'Active Projects'
    planNav.innerHTML = `
        <button class="sub-nav-btn ${state.currentPlanningView === 'goals' ? 'active' : ''}" data-pview="goals">Current Goals</button>
        <button class="sub-nav-btn ${state.currentPlanningView === 'projects' ? 'active' : ''}" data-pview="projects">Active Projects</button>
    `;

    planNav.querySelectorAll('.sub-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            planNav.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentPlanningView = e.target.dataset.pview;
            state.carouselIndex = 0; // Reset slider window bounds
            renderApp();
        });
    });
}

function switchScheduleView(targetView) {
    state.currentScheduleView = targetView;
    renderApp();
}

// --- Container Creation Management ---
window.addNewPlanningContainer = function() {
    const inputEl = document.getElementById('new-container-title');
    if (!inputEl || !inputEl.value.trim()) return;

    const title = inputEl.value.trim();
    const type = state.currentPlanningView === 'goals' ? 'goal' : 'project';
    const prefix = type === 'goal' ? 'g-' : 'p-';
    const id = prefix + Date.now();

    state.containers.push({ id, title, type });
    saveDataToStorage();
    inputEl.value = '';
    renderApp();
};

// --- Container Deletion Mechanic ---
window.deletePlanningContainer = function(containerId) {
    if (!confirm("Are you sure you want to delete this track? All active cards inside will be returned safely to your Universal Board.")) return;

    // 1. Target and sweep structural elements inside the array
    state.containers = state.containers.filter(c => c.id !== containerId);

    // 2. Structural Catch: Redirect orphan tasks cleanly back onto the Universal Board
    state.cards.forEach(card => {
        if (card.targetIndex === containerId) {
            card.targetZone = 'universal';
            card.targetIndex = 'universal';
            card.type = 'Universal Card';
            card.position = Date.now();
        }
    });

    // 3. Keep sliding viewport bounds from getting pushed out of tracking alignment
    const typeFilter = state.currentPlanningView === 'goals' ? 'goal' : 'project';
    const remainingCount = state.containers.filter(c => c.type === typeFilter).length;
    if (state.carouselIndex > remainingCount - CAROUSEL_VISIBLE_LIMIT) {
        state.carouselIndex = Math.max(0, remainingCount - CAROUSEL_VISIBLE_LIMIT);
    }

    saveDataToStorage();
    renderApp();
};

// --- Carousel Pagination Controls ---
window.shiftCarousel = function(direction) {
    const typeFilter = state.currentPlanningView === 'goals' ? 'goal' : 'project';
    const totalContainers = state.containers.filter(c => c.type === typeFilter).length;
    
    state.carouselIndex += direction;
    
    // Safety Bounds Verification
    if (state.carouselIndex < 0) state.carouselIndex = 0;
    if (state.carouselIndex > totalContainers - CAROUSEL_VISIBLE_LIMIT) {
        state.carouselIndex = Math.max(0, totalContainers - CAROUSEL_VISIBLE_LIMIT);
    }
    renderApp();
};

// --- High Performance Render System ---
function renderApp() {
    const mainWorkspace = document.getElementById('workspace-main');
    mainWorkspace.innerHTML = ''; 

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
    attachContainerInteractions(); // Bind interactive header elements securely
}

// --- Specific View Templates Execution ---
function renderDailyView(target) {
    let html = `<div class="pane-header"><h2>daily schedule</h2><button class="add-card-btn" onclick="createNewCardFromUI('Daily Card', '08:00')">+ Add Time Block</button></div>`;
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
    let html = `
        <div class="pane-header">
            <h2>weekly schedule</h2>
            <button class="add-card-btn" onclick="createNewCardFromUI('Weekly Card', 'Monday-Morning')">+ Add Routine</button>
        </div>`;
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
    let html = `
        <div class="pane-header">
            <h2>monthly calendar</h2>
            <button class="add-card-btn" onclick="createNewCardFromUI('Monthly Card', 'day-1')">+ Add Event</button>
        </div>`;
    html += `<div class="monthly-layout">`;
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekDays.forEach(wd => html += `<div class="month-day-head">${wd}</div>`);

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
        <div class="pane-header"><h2>Reminders Board</h2></div>
        <div class="reminders-layout">
            <div class="flex-board-column">
                <div class="pane-header"><strong>Things I need to remember</strong><button class="add-card-btn" onclick="createNewCardFromUI('Reminder Card', 'reminders-main')">+ Add</button></div>
                <div class="drop-zone" data-zone-type="reminders" data-zone-id="reminders-main">
                    ${renderCardsForZone('reminders', 'reminders-main')}
                </div>
            </div>
        </div>
    `;
    target.innerHTML = html;
}

function renderPlanningModeView(target) {
    const isGoals = state.currentPlanningView === 'goals';
    const typeFilter = isGoals ? 'goal' : 'project';
    const list = state.containers.filter(c => c.type === typeFilter);
    
    // Slice active columns out for carousel sliding calculation logic
    const visibleColumns = list.slice(state.carouselIndex, state.carouselIndex + CAROUSEL_VISIBLE_LIMIT);

    let html = `
        <div class="pane-header">
            <h2>${isGoals ? "Things I'm Working Towards" : "Things I'm Building"}</h2>
            <div class="carousel-fast-add-panel">
                <input type="text" id="new-container-title" placeholder="New ${isGoals ? 'Goal Track' : 'Project Board'}..." />
                <button class="action-btn primary" onclick="addNewPlanningContainer()">+ Build Container</button>
            </div>
        </div>
    `;

    html += `<div class="carousel-view-viewport-frame">`;
    
    // Left Sliding Button Selector
    const leftDisabled = state.carouselIndex === 0 ? 'disabled' : '';
    html += `<button class="carousel-nav-btn left-arrow" ${leftDisabled} onclick="shiftCarousel(-1)">◀</button>`;
    
    html += `<div class="planning-layout carousel-grid-display">`;
    
    if (visibleColumns.length === 0) {
        html += `<div class="empty-view-placeholder-prompt">No tracking layouts initialized. Use the form above to add structures.</div>`;
    }

    visibleColumns.forEach(item => {
        const cardOriginType = isGoals ? 'Goal Task Card' : 'Project Task Card';
        html += `
            <div class="flex-board-column animate-column-entry">
                <div class="pane-header">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-grow: 1;">
                        <button class="card-btn" onclick="deletePlanningContainer('${item.id}')" title="Delete Column" style="font-size: 0.85rem; padding: 0.1rem 0.3rem; color: var(--trash-text);">✕</button>
                        <strong class="container-title" contenteditable="true" data-id="${item.id}" style="outline: none; cursor: text;">${item.title}</strong>
                    </div>
                    <button class="add-card-btn" onclick="createNewCardFromUI('${cardOriginType}', '${item.id}')">+ Add Step</button>
                </div>
                <div class="drop-zone" data-zone-type="${typeFilter}" data-zone-id="${item.id}">
                    ${renderCardsForZone(typeFilter, item.id)}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    // Right Sliding Button Selector
    const rightDisabled = (state.carouselIndex >= list.length - CAROUSEL_VISIBLE_LIMIT) || list.length <= CAROUSEL_VISIBLE_LIMIT ? 'disabled' : '';
    html += `<button class="carousel-nav-btn right-arrow" ${rightDisabled} onclick="shiftCarousel(1)">▶</button>`;
    
    html += `</div>`;
    target.innerHTML = html;
}

function renderUniversalBoard() {
    const board = document.getElementById('universal-board');
    if (board) board.innerHTML = renderCardsForZone('universal', 'universal');
}

function renderCardsForZone(zoneType, zoneId) {
    return state.cards
        .filter(c => c.targetZone === zoneType && c.targetIndex === zoneId)
        .sort((a, b) => a.position - b.position)
        .map(c => generateCardHTML(c))
        .join('');
}

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

function createNewCard({ type, targetZone, targetIndex }) {
    const newCard = {
        id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: 'Untitled Plan',
        description: '',
        type: type, 
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

    document.querySelectorAll('.edit-trigger').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(e.target.dataset.id);
        });
    });

    document.querySelectorAll('.timely-card').forEach(cardEl => {
        cardEl.addEventListener('dragstart', handleDragStart);
        cardEl.addEventListener('dragend', handleDragEnd);
    });
}

// --- Planning Container Interaction Routing Module ---
function attachContainerInteractions() {
    document.querySelectorAll('.container-title').forEach(el => {
        el.addEventListener('blur', (e) => {
            const containerId = e.target.dataset.id;
            const container = state.containers.find(c => c.id === containerId);
            if (container) {
                container.title = e.target.innerText.trim() || 'Untitled Track';
                saveDataToStorage();
            }
        });
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { 
                e.preventDefault(); 
                e.target.blur(); 
            }
        });
    });
}

// --- Native High Fidelity Drag And Drop Engine ---
let draggedCardId = null;

function setupDragAndDropFramework() {
    const workspace = document.getElementById('workspace-main');
    
    // Initial bindings for static sidebar nodes
    bindDropZoneEvents(document.getElementById('universal-board'));
    bindDropZoneEvents(document.getElementById('trash-zone'));

    const observer = new MutationObserver(() => {
        // Track the sidebar nodes explicitly to guarantee permanence
        bindDropZoneEvents(document.getElementById('universal-board'));
        bindDropZoneEvents(document.getElementById('trash-zone'));
        
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

// --- Dynamic Cleanup Logic ---
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.drop-zone, #universal-board, #trash-zone, .trash-container').forEach(z => {
        z.classList.remove('drag-over');
    });
    draggedCardId = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// --- Toggle Active Structural Presentation State ---
function handleDragEnter(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.add('drag-over');
}

function handleDragLeave(e) {
    const zone = e.currentTarget;
    
    // Verify focus hasn't entered internal card space boundaries
    const rect = zone.getBoundingClientRect();
    const isLeaving = e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom;
    
    if (isLeaving) {
        zone.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');

    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (!cardId) return;

    if (zone.id === 'trash-zone' || zone.classList.contains('trash-container')) {
        state.cards = state.cards.filter(c => c.id !== cardId);
        saveDataToStorage();
        renderApp();
        return;
    }

    const zoneType = zone.dataset.zoneType || 'universal';
    const zoneId = zone.dataset.zoneId || 'universal';

    const card = state.cards.find(c => c.id === cardId);
    if (card) {
        card.targetZone = zoneType;
        card.targetIndex = zoneId;
        card.position = Date.now();

        if (zoneType === 'universal') {
            card.type = 'Universal Card';
        } else if (zoneType === 'daily') {
            card.type = 'Daily Card';
        } else if (zoneType === 'weekly') {
            card.type = 'Weekly Card';
        } else if (zoneType === 'monthly') {
            card.type = 'Monthly Card';
        } else if (zoneType === 'reminders') {
            card.type = 'Reminder Card';
        } else if (zoneType === 'goal') {
            card.type = 'Goal Task Card';
        } else if (zoneType === 'project') {
            card.type = 'Project Task Card';
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
        icsContent.push(`DTSTART:${todayStr}`); 
        icsContent.push(`SUMMARY:${card.title}`);
        if (card.description) {
            icsContent.push(`DESCRIPTION:${card.description.replace(/\n/g, '\\n')}`);
        }
        
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

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `timely_schedule_${Date.now()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
