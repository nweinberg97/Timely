# Timely — Local-First Life Planner

> 🚧 **Work in Progress**
>
> Timely is an actively developed component of LifeOS, a larger local-first productivity system currently under development. The core planning and scheduling concepts are in place, but the application is still being refined and is not yet considered a finished or production-ready product.
>
> Timely currently serves as the scheduling and higher-level planning prototype for the broader LifeOS system. Its features, design, architecture, and integration points may change as LifeOS continues to evolve.

Timely is a clean, minimalist, local-first web application designed to help balance rigorous execution tracking with intentional high-level systemic thinking. Built using vanilla web standards, it brings time-blocking and open-ended planning into a single workflow.

## 🚀 Core Features

* **Dual-Mode System**

  * **Schedule Mode (Execution):** Work through structured hourly grids in the **Daily View**, coordinate high-level timeline cadences using five fixed day-parts (Morning, Noon, Afternoon, Evening, Night) in the **Weekly View**, view a complete monthly horizon in the **Monthly View**, or manage flexible floating cards inside the **Reminders Board**.
  * **Planning Mode (Thinking):** Create higher-level **Goals** and active **Projects** without tying everything to a rigid date or schedule.

* **Universal Transformation Rule (Inbox Concept):** The right-hand sidebar acts as a mental clearinghouse. Dragging a card from any context into the **Universal Board** removes its contextual constraints and turns it into an open-ended `Universal Card`.

* **Local-First Architecture:** Timely currently uses `localStorage` for local data persistence, with automatic saving when cards are modified or repositioned. No external APIs or services are required for the core application.

* **iCal Calendar Synchronization:** Timely includes a native `.ics` generator for exporting Active Schedule items to external calendar applications.

* **Recurrence Engine:** Items can be configured with daily, weekly, or monthly recurrence rules, with visual indicators showing their recurrence status.

## 🛠️ Design Philosophy

Timely is built around structural simplicity over unnecessary engineering complexity. Drag-and-drop interaction acts as the primary way to organize information across schedules, boards, and containers.

The broader design goal is to make planning feel **spatial, constrained, and tangible** rather than turning everything into another list of tasks.

## 💻 Tech Stack

* **Structure:** HTML5
* **Presentation:** CSS3
* **Execution:** Vanilla JavaScript (ECMAScript)
* **Persistence:** Browser `localStorage`
* **Dependencies:** No frameworks, build tools, or NPM packages required

## 🚧 Development Status

Timely is currently a **work in progress**.

The application is functional and the core planning system has been implemented, but development is ongoing. Current and future work may include:

* Refining the UI and interaction patterns
* Improving responsiveness and usability
* Testing edge cases and data persistence
* Refining existing scheduling and recurrence behavior
* Adding or modifying features as the underlying planning system evolves
* General bug fixing and polish

**Expect changes as the project develops.**
