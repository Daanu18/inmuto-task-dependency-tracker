# DECISIONS.md

This document describes key engineering decisions taken during the implementation of the Task Dependency Tracker (INMUTO SDE Intern Assignment).

---

## 1. Backend Framework Choice
**Decision:** Django + Django REST Framework  
**Reason:**
- Fast API development with serializers + views
- Clean model structure
- DRF supports easy CRUD and validation

---

## 2. Database Design
### Models
Two models were implemented exactly as per instructions:

#### Task
Fields:
- id
- title
- description
- status (pending/in_progress/completed/blocked)
- created_at
- updated_at

#### TaskDependency
Fields:
- id
- task (FK → Task)
- depends_on (FK → Task)
- created_at

**Reason:**
- Clear separation of tasks and dependencies
- Supports many-to-many dependency relationships via join model
- Easy querying and traversal

---

## 3. Circular Dependency Detection Algorithm
**Decision:** Depth First Search (DFS) graph cycle detection

**Why DFS?**
- Very common and reliable for cycle detection in directed graphs
- Easy to return cycle path
- Efficient enough for 20–30 tasks (assignment scope)

### Output
If a cycle exists, backend returns:
- error message
- exact circular path
Example:
`6 → 7 → 8 → 6`

Also prevents saving that dependency.

---

## 4. Status Auto Update Logic
**Decision:** Status derived from dependency states, applied on:
- dependency add
- task status PATCH updates

Rules:
- If ALL deps completed → task becomes `in_progress`
- If ANY dep blocked → task becomes `blocked`
- If deps exist but not completed → remains `pending`
- If task is completed → tasks depending on it re-evaluated

**Why?**
Matches screenshot + requirement rules, and ensures consistency across graph.

---

## 5. Frontend Choice
**Decision:** React + Vite

**Reason:**
- Fast dev server and build
- Simple structure and quick deployment

---

## 6. Styling System
**Decision:** Tailwind CSS

**Reason:**
- Easy UI polish
- Fast iteration with utility classes
- Cleaner than writing large CSS files
- Accepted under "MUI/Antd/Shadcn or any modern UI approach" type assessments

---

## 7. UI/UX Component Strategy
**Decision:** Custom lightweight components (TaskForm, TaskList, DependencyPanel, GraphView)

**Reason:**
- Keeps the frontend modular
- Each component handles a single responsibility
- Easy debugging and future extension

---

## 8. Graph Visualization Approach
**Decision:** SVG-based visualization

Constraints from assignment:
- No graph libraries like D3/Cytoscape etc.

**Why SVG?**
- Easier arrows, edges, and click handling compared to canvas
- Supports transforms for zoom/pan
- Simple DOM-based event handling (click node = highlight deps)

---

## 9. Error Handling
**Decision:** Toast notification system

**Reason:**
- Uniform UX feedback for all actions:
  - create task
  - update status
  - delete task
  - add dependency
  - cycle warnings
- Improves clarity during evaluation

---

## 10. Code Quality / Maintainability
- API calls isolated in `tasksApi.js`
- React logic centralized in `Dashboard.jsx`
- State management using simple React state (no Redux needed)
- Defensive checks added for invalid selectedTaskId / deleted tasks

---

## 11. Deployment Readiness
- Frontend uses Vite build pipeline
- Backend uses requirements.txt and environment-friendly config
- Clean .gitignore avoids committing venv, dist, node_modules

---

✅ End of Decisions
