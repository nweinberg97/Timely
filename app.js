/**
 * TIMELY — Local-First Life Planner 
 * Core Application Engine (Vanilla Modern Architecture)
 */

// --- Real-World Wall-Clock Anchors ---
const todayRealWorld = new Date(); 

// --- Application Core State ---
let state = {
    currentMode: 'schedule', // 'schedule' | 'planning'
    currentScheduleView: 'daily', // 'daily' | 'weekly' | 'monthly' | 'reminders'
    currentPlanningView: 'goals', // 'goals' | 'projects'
    carouselIndex: 0, // Track column sliding viewport offset
    currentDate: new Date(), // Dynamically initialized to the actual current date
    syncMode: 'none', // 'none' | 'event' | 'routine' | 'reminder'
    selectedCardIds: new Set(), // Set of selected cards for custom targeted sync exports
    cards: [],
    containers: [] // For Goals & Projects
};

const CAROUSEL_VISIBLE_LIMIT = 3; // Max number of visible columns in carousel

// Real-world operational constants for calendar mapping reference
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_OF_YEAR = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
            cancelSyncMode(); // Exit out of selection mode cleanly when changing views
            switchScheduleView(e.target.dataset.view);
        });
    });

    // Inboxes And Utility Fast Adds
    document.getElementById('btn-add-universal').addEventListener('click', () => {
        createNewCard({ type: 'Universal Card', targetZone:
