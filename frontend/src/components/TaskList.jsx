import { useState, useRef, useEffect } from "react"

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-100 text-red-700 border-red-200",
  },
}

const priorityConfig = {
  1: { label: "Low", color: "bg-slate-400", textColor: "text-slate-600" },
  2: { label: "Med-Low", color: "bg-blue-400", textColor: "text-blue-600" },
  3: { label: "Medium", color: "bg-yellow-400", textColor: "text-yellow-600" },
  4: { label: "Med-High", color: "bg-orange-400", textColor: "text-orange-600" },
  5: { label: "High", color: "bg-red-500", textColor: "text-red-600" },
}

function PriorityIndicator({ priority }) {
  const config = priorityConfig[priority] || priorityConfig[3]
  return (
    <div className="flex items-center gap-1" title={`${config.label} Priority`}>
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={`w-1.5 h-3 rounded-sm ${
            level <= priority ? config.color : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  )
}

function StatusSelect({ value, onChange, onClick }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const statuses = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "blocked", label: "Blocked" },
  ]

  const currentLabel =
    statuses.find((s) => s.value === value)?.label || "Pending"

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(e)
          setIsOpen(!isOpen)
        }}
        className="flex items-center justify-between w-[130px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span>{currentLabel}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {statuses.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(status.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                value === status.value
                  ? "bg-slate-50 font-medium text-slate-900"
                  : "text-slate-700"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DeleteConfirmDialog({ isOpen, onConfirm, onCancel, taskTitle, affectedTasks }) {
  if (!isOpen) return null

  const hasAffectedTasks = affectedTasks && affectedTasks.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onCancel}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${hasAffectedTasks ? "bg-amber-100" : "bg-red-100"}`}>
            <svg className={`w-5 h-5 ${hasAffectedTasks ? "text-amber-600" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {hasAffectedTasks ? "Warning: Task Has Dependents" : "Delete Task"}
          </h3>
        </div>
        
        <p className="text-slate-600 mb-4">
          Are you sure you want to delete <span className="font-medium text-slate-900">"{taskTitle}"</span>? This action cannot be undone.
        </p>
        
        {hasAffectedTasks && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-2">
              The following tasks depend on this task and will be affected:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {affectedTasks.map((task) => (
                <span 
                  key={task.id} 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300"
                >
                  {task.title}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            {hasAffectedTasks ? "Delete Anyway" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  onUpdateStatus,
  onDeleteTask,
  dependencies = {},
}) {
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, task: null, affectedTasks: [] })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Filter tasks based on search and status
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Find tasks that depend on the task being deleted
  const findAffectedTasks = (taskId) => {
    const affected = []
    Object.entries(dependencies).forEach(([dependentTaskId, depIds]) => {
      if (depIds.includes(taskId) || depIds.includes(String(taskId))) {
        const dependentTask = tasks.find((t) => String(t.id) === String(dependentTaskId))
        if (dependentTask) {
          affected.push(dependentTask)
        }
      }
    })
    return affected
  }

  const handleDeleteClick = (e, task) => {
    e.stopPropagation()
    const affectedTasks = findAffectedTasks(task.id)
    setDeleteConfirm({ isOpen: true, task, affectedTasks })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.task) {
      onDeleteTask(deleteConfirm.task.id)
    }
    setDeleteConfirm({ isOpen: false, task: null, affectedTasks: [] })
  }

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, task: null, affectedTasks: [] })
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
            <span className="text-sm text-slate-500">
              {filteredTasks.length} of {tasks.length} tasks
            </span>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-100 p-3 mb-4">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900">No tasks yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Create a task to get started
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-100 p-3 mb-4">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900">No matching tasks</p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your search or filter
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectTask(task.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`group flex items-center justify-between gap-4 rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                    String(selectedTaskId) === String(task.id)
                      ? "border-blue-500 bg-blue-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900 truncate">
                        {task.title}
                      </h3>
                      <StatusBadge status={task.status} />
                      {task.priority && <PriorityIndicator priority={task.priority} />}
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-500 truncate">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusSelect
                      value={task.status}
                      onChange={(value) => onUpdateStatus(task.id, value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      onClick={(e) => handleDeleteClick(e, task)}
                      aria-label={`Delete ${task.title}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        taskTitle={deleteConfirm.task?.title || ""}
        affectedTasks={deleteConfirm.affectedTasks}
      />
    </>
  )
}
