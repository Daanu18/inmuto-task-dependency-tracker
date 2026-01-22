# Task Dependency Tracker

A full-stack **Task Dependency Tracker** that lets users create tasks, add dependencies between them, prevents circular dependencies using a **DFS graph cycle detection algorithm**, auto-updates task status based on dependency rules, and visualizes dependencies using a **custom SVG graph renderer** (no external graph libraries).

---

## 🌐 Live Demo

- **Frontend (Vercel):** https://task-dependency.vercel.app
- **Backend (Render):** https://inmuto-task-backend.onrender.com
- **Backend API Base (Prod):** https://inmuto-task-backend.onrender.com/api

---

## ✅ Features

### Backend (Django + DRF)
- CRUD for tasks
- Add dependencies between tasks
- ✅ **Circular dependency detection** using **DFS**
  - Prevents saving invalid dependency
  - Returns the **exact cycle path** when detected (example: `6 → 7 → 8 → 6`)
- ✅ **Auto task status update logic**
  - If **any dependency is blocked** → task becomes `blocked`
  - If **all dependencies are completed** → task becomes `in_progress`
  - Else → remains `pending`
  - When a task becomes completed → cascades updates to dependent tasks
- Dependency graph API for visualization

### Frontend (React + Vite + Tailwind CSS)
- Clean light UI (v0.dev-inspired)
- Add task (title + description)
- Update task status from dropdown
- Delete task with confirmation
- Add dependency using dropdown selector
- Shows current dependencies
- ✅ Dependency graph visualization
  - Custom **SVG layout**
  - Nodes color-coded by status:
    - `pending` = gray
    - `in_progress` = blue
    - `completed` = green
    - `blocked` = red
  - Edge arrows
  - Node click highlights dependencies
  - Zoom in/out + reset
- Toast notifications for success/error actions
- Loading states

---

## 🧱 Tech Stack

### Backend
- Python 3.x
- Django
- Django REST Framework
- django-cors-headers
- MySQL (local optional) / SQLite fallback

### Frontend
- React 18
- Vite
- Axios
- Tailwind CSS

---

## 📁 Repository Structure

```
root/
  backend/
    config/
    tasks/
    manage.py
    requirements.txt
  frontend/
    src/
      api/
      components/
      pages/
    package.json
  README.md
  DECISIONS.md
  .gitignore
```

---

## ⚙️ Setup Instructions

### 1) Clone repo
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd inmuto-task-dependency-tracker
```

---

## 🔥 Backend Setup (Django)

### 2) Create & activate virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate      # mac/linux
# OR
venv\Scripts\activate       # windows
```

### 3) Install dependencies
```bash
pip install -r requirements.txt
```

### 4) Database configuration (Evaluator-friendly)
This project is designed to be **plug-and-play** for evaluators.

✅ Default: **SQLite** (no setup required)  
Optional: MySQL can be enabled locally via `.env`.

### 5) Apply migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6) Start backend server
```bash
python manage.py runserver
```

Backend will run locally at:
```
http://127.0.0.1:8000/
```

---

## 🌈 Frontend Setup (React)

### 7) Install dependencies
Open a new terminal:
```bash
cd frontend
npm install
```

### 8) Start frontend dev server
```bash
npm run dev
```

Frontend will run locally at:
```
http://localhost:5173/
```

---

## 🔧 Frontend API Configuration (Evaluator + Deploy friendly)

The frontend reads backend URL from env variable:

- Uses `VITE_API_BASE_URL` if provided
- Else defaults to local backend: `http://127.0.0.1:8000/api`

Example `.env` for frontend (do not commit `.env`):
```env
VITE_API_BASE_URL=https://inmuto-task-backend.onrender.com/api
```

---

## ✅ Production build commands (IMPORTANT)

### 9) Build frontend
```bash
npm run build
```

### 10) Preview production build locally
```bash
npm run preview
```

Preview runs at:
```
http://localhost:4173/
```

---

## 🔌 API Endpoints (Backend)

### Base URLs
- Local: `http://127.0.0.1:8000/api`
- Production: `https://inmuto-task-backend.onrender.com/api`

### Tasks
- `GET /api/tasks/` → list all tasks
- `POST /api/tasks/` → create task
- `PATCH /api/tasks/{task_id}/` → update task status/title/description
- `DELETE /api/tasks/{task_id}/` → delete task

### Task Dependencies
- `POST /api/tasks/{task_id}/dependencies/`
  ```json
  { "depends_on_id": 5 }
  ```
- `GET /api/tasks/{task_id}/dependencies/`

### Dependency Graph
- `GET /api/graph/`

---

## 🧠 Circular Dependency Detection (Algorithm)

When adding dependency:
- Run **DFS** from the new dependency node
- Track recursion stack to detect cycle
- If cycle found:
  - return error response
  - include cycle path:
    ```json
    { "error": "Circular dependency detected", "path": [6,7,8,6] }
    ```

---

## 🧪 Testing checklist (manual)

- ✅ Create tasks
- ✅ Add dependencies
- ✅ Prevent self-dependency
- ✅ Detect cycle (example: 6 → 7 → 8 → 6)
- ✅ Update task status
- ✅ Auto update dependent tasks
- ✅ Graph updates correctly
- ✅ Delete task updates state

---

## 🚀 Deployment Notes

### Backend (Render)
- Build command:
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
  ```
- Start command:
  ```bash
  gunicorn config.wsgi:application
  ```

### Frontend (Vercel)
- Set root directory: `frontend`
- Build: `npm run build`
- Output: `dist`
- Env:
  - `VITE_API_BASE_URL=https://inmuto-task-backend.onrender.com/api`

---

## 👨‍💻 Author
**Daanu18**  
Built for INMUTO SDE Intern Assignment.
