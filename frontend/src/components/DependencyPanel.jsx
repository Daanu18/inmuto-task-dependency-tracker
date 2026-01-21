import { useState, useRef, useEffect } from "react"

function DependencySelect({ tasks, value, onChange, placeholder }) {
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

  const selectedTask = tasks.find((t) => t.id === value)

  return (
    <div ref={selectRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className={selectedTask ? "text-slate-900" : "text-slate-400"}>
          {selectedTask ? selectedTask.title : placeholder}
        </span>
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
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {tasks.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              No available tasks
            </div>
          ) : (
            tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  onChange(task.id)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                  value === task.id
                    ? "bg-slate-50 font-medium text-slate-900"
                    : "text-slate-700"
                }`}
              >
                {task.title}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Calculate estimated waiting time based on incomplete dependencies
function calculateEstimatedTime(taskId, tasks, dependencies, visited = new Set()) {
  if (visited.has(taskId)) return 0 // Prevent cycles
  visited.add(taskId)
  
  const taskDeps = dependencies[String(taskId)] || []
  if (taskDeps.length === 0) return 0
  
  let maxTime = 0
  
  for (const depId of taskDeps) {
    const depTask = tasks.find(t => String(t.id) === String(depId))
    if (!depTask) continue
    
    // If dependency is not completed, add time estimate
    if (depTask.status !== "completed") {
      // Base time: 1 day per task, adjusted by priority
      const priorityMultiplier = depTask.priority ? (6 - depTask.priority) / 3 : 1
      const baseTime = priorityMultiplier
      
      // Add time for nested dependencies
      const nestedTime = calculateEstimatedTime(depId, tasks, dependencies, new Set(visited))
      
      maxTime = Math.max(maxTime, baseTime + nestedTime)
    }
  }
  
  return maxTime
}

function formatEstimatedTime(days) {
  if (days === 0) return "Ready to start"
  if (days < 1) return "Less than 1 day"
  if (days === 1) return "~1 day"
  if (days < 7) return `~${Math.ceil(days)} days`
  const weeks = Math.ceil(days / 7)
  return `~${weeks} week${weeks > 1 ? 's' : ''}`
}

export function DependencyPanel({
  tasks,
  selectedTaskId,
  dependencies,
  onAddDependency,
  onRemoveDependency,
}) {
  const [selectedDependency, setSelectedDependency] = useState("")

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)
  const taskDependencies = selectedTaskId
    ? dependencies[selectedTaskId] || []
    : []

  const availableTasks = tasks.filter(
    (t) => t.id !== selectedTaskId && !taskDependencies.includes(t.id)
  )
  
  // Calculate estimated waiting time
  const estimatedWaitTime = selectedTaskId 
    ? calculateEstimatedTime(selectedTaskId, tasks, dependencies)
    : 0
    
  const incompleteDeps = taskDependencies.filter(depId => {
    const depTask = tasks.find(t => String(t.id) === String(depId))
    return depTask && depTask.status !== "completed"
  })

  const handleAddDependency = () => {
    if (selectedTaskId && selectedDependency) {
      onAddDependency(selectedTaskId, selectedDependency)
      setSelectedDependency("")
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm h-fit">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Dependencies</h2>
      </div>
      <div className="p-6">
        {!selectedTask ? (
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-900">
              No task selected
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Select a task to manage dependencies
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Selected Task
              </p>
              <p className="font-medium text-slate-900">{selectedTask.title}</p>
            </div>
            
            {/* Estimated Waiting Time - only show if task is NOT completed */}
            {taskDependencies.length > 0 && selectedTask.status !== "completed" && (
              <div className={`p-3 rounded-xl border ${
                incompleteDeps.length === 0 
                  ? "bg-green-50 border-green-200" 
                  : "bg-amber-50 border-amber-200"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <svg 
                    className={`w-4 h-4 ${incompleteDeps.length === 0 ? "text-green-600" : "text-amber-600"}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Estimated Wait
                  </p>
                </div>
                <p className={`font-medium ${
                  incompleteDeps.length === 0 ? "text-green-700" : "text-amber-700"
                }`}>
                  {formatEstimatedTime(estimatedWaitTime)}
                </p>
                {incompleteDeps.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {incompleteDeps.length} incomplete dependenc{incompleteDeps.length === 1 ? 'y' : 'ies'}
                  </p>
                )}
              </div>
            )}
            
            {/* Show completed status */}
            {selectedTask.status === "completed" && taskDependencies.length > 0 && (
              <div className="p-3 rounded-xl border bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <svg 
                    className="w-4 h-4 text-green-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="font-medium text-green-700">Task completed</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Add Dependency
              </label>
              <div className="flex gap-2">
                <DependencySelect
                  tasks={availableTasks}
                  value={selectedDependency}
                  onChange={setSelectedDependency}
                  placeholder="Select a task..."
                />
                <button
                  type="button"
                  onClick={handleAddDependency}
                  disabled={!selectedDependency}
                  className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Current Dependencies
              </label>
              {taskDependencies.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">
                  No dependencies added yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {taskDependencies.map((depId) => {
                    const depTask = tasks.find((t) => t.id === depId)
                    if (!depTask) return null
                    return (
                      <span
                        key={depId}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 text-sm font-medium"
                      >
                        {depTask.title}
                        <button
                          type="button"
                          onClick={() =>
                            onRemoveDependency(selectedTaskId, depId)
                          }
                          className="rounded-full hover:bg-blue-200 p-0.5 transition-colors"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="sr-only">Remove dependency</span>
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
