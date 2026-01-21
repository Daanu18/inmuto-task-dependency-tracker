import { useState, useCallback, useEffect } from "react"
import { tasksApi } from "../api/tasksApi"
import { TaskForm } from "../components/TaskForm"
import { TaskList } from "../components/TaskList"
import { GraphView } from "../components/GraphView"
import { DependencyPanel } from "../components/DependencyPanel"
import ToastProvider from "../components/Toast"
import { useToast } from "../components/useToast"

function DashboardContent() {
  const [tasks, setTasks] = useState([])
  const [dependencies, setDependencies] = useState({})
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { addToast } = useToast()

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await tasksApi.listTasks()
      // Validate data is an array
      if (Array.isArray(data)) {
        setTasks(data)
      } else {
        console.error("Invalid tasks data received:", data)
        addToast("Received invalid data from server", "error")
        setTasks([])
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message 
        || error.message 
        || "Failed to fetch tasks"
      addToast(errorMessage, "error")
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  const fetchGraph = useCallback(async () => {
    try {
      const graph = await tasksApi.getGraph()
      const depsMap = {}
      if (graph && graph.edges) {
        graph.edges.forEach((edge) => {
          if (!depsMap[edge.target]) {
            depsMap[edge.target] = []
          }
          depsMap[edge.target].push(edge.source)
        })
      }
      setDependencies(depsMap)
    } catch (error) {
        console.error(error);
      addToast("Failed to fetch dependency graph", "error")
    }
  }, [addToast])



  useEffect(() => {
    fetchTasks()
    fetchGraph()
  }, [fetchTasks, fetchGraph])

  // Reset selectedTaskId if the selected task no longer exists
  useEffect(() => {
    if (selectedTaskId !== null && tasks.length > 0) {
      const taskExists = tasks.some(
        (task) => String(task.id) === String(selectedTaskId)
      )
      if (!taskExists) {
        setSelectedTaskId(null)
      }
    }
  }, [tasks, selectedTaskId])

  const handleCreateTask = useCallback(
    async (title, description, priority = 3) => {
      try {
        setIsLoading(true)
        const newTask = await tasksApi.createTask({ title, description, priority })
        setTasks((prev) => [...prev, newTask])
        addToast("Task created successfully", "success")
      } catch (error) {
        console.error(error);
        addToast("Failed to create task", "error")
      } finally {
        setIsLoading(false)
      }
    },
    [addToast]
  )

  // Find tasks that depend on the updated task and might need auto-update
  const findTasksToAutoUpdate = useCallback((completedTaskId, updatedTasks) => {
    const tasksToUpdate = []
    
    Object.entries(dependencies).forEach(([taskId, depIds]) => {
      // Check if this task depends on the completed task
      if (depIds.includes(completedTaskId) || depIds.includes(String(completedTaskId))) {
        const task = updatedTasks.find(t => String(t.id) === String(taskId))
        // Only auto-update if task is blocked and all deps are now completed
        if (task && task.status === "blocked") {
          const allDepsCompleted = depIds.every(depId => {
            const depTask = updatedTasks.find(t => String(t.id) === String(depId))
            return depTask?.status === "completed"
          })
          if (allDepsCompleted) {
            tasksToUpdate.push(task)
          }
        }
      }
    })
    
    return tasksToUpdate
  }, [dependencies])

  const handleUpdateStatus = useCallback(
    async (id, status) => {
      // Store previous state for rollback on error
      const previousTasks = tasks
      
      // Optimistically update UI
      let updatedTasks = tasks.map((task) => (task.id === id ? { ...task, status } : task))
      setTasks(updatedTasks)
      
      try {
        await tasksApi.updateTask(id, { status })
        addToast("Task updated", "success")
        
        // Auto-update blocked tasks if a dependency was completed
        if (status === "completed") {
          const tasksToAutoUpdate = findTasksToAutoUpdate(id, updatedTasks)
          
          for (const task of tasksToAutoUpdate) {
            try {
              await tasksApi.updateTask(task.id, { status: "pending" })
              updatedTasks = updatedTasks.map(t => 
                t.id === task.id ? { ...t, status: "pending" } : t
              )
              addToast(`"${task.title}" unblocked - all dependencies completed`, "success")
            } catch (err) {
              console.error("Failed to auto-update task:", err)
            }
          }
          setTasks(updatedTasks)
        }
      } catch (error) {
        // Rollback on error (handles concurrent updates)
        setTasks(previousTasks)
        const errorMessage = error.response?.status === 409 
          ? "Task was modified by another user. Please refresh."
          : error.response?.data?.message || "Failed to update task"
        addToast(errorMessage, "error")
      }
    },
    [addToast, tasks, findTasksToAutoUpdate]
  )

  const handleDeleteTask = useCallback(
    async (id) => {
      try {
        await tasksApi.deleteTask(id)
        setTasks((prev) => prev.filter((task) => task.id !== id))
        setDependencies((prev) => {
          const updated = { ...prev }
          delete updated[id]
          Object.keys(updated).forEach((key) => {
            updated[key] = updated[key].filter((depId) => depId !== id)
          })
          return updated
        })
        if (selectedTaskId === id) {
          setSelectedTaskId(null)
        }
        addToast("Task deleted", "success")
      } catch (error) {
        console.error(error);
        addToast("Failed to delete task", "error")
      }
    },
    [selectedTaskId, addToast]
  )

  const handleSelectTask = useCallback((id) => {
    setSelectedTaskId((prev) => (prev === id ? null : id))
  }, [])

  const handleAddDependency = useCallback(
    async (taskId, dependencyId) => {
      try {
        await tasksApi.addDependency(taskId, dependencyId)
        setDependencies((prev) => ({
          ...prev,
          [taskId]: [...(prev[taskId] || []), dependencyId],
        }))
        addToast("Dependency added", "success")
      } catch (error) {
        // Handle specific error cases
        const errorMessage = error.response?.status === 400
          ? error.response?.data?.error || "Invalid dependency (may create a cycle)"
          : error.response?.data?.message || "Failed to add dependency"
        addToast(errorMessage, "error")
      }
    },
    [addToast]
  )

  const handleRemoveDependency = useCallback(
    async (taskId, dependencyId) => {
      try {
        setDependencies((prev) => ({
          ...prev,
          [taskId]: (prev[taskId] || []).filter((id) => id !== dependencyId),
        }))
        addToast("Dependency removed", "success")
      } catch (error) {
        console.error(error);
        addToast("Failed to remove dependency", "error")
      }
    },
    [addToast]
  )

  const handleRefresh = useCallback(() => {
    fetchTasks()
    fetchGraph()
  }, [fetchTasks, fetchGraph])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">
                Task Dependency Tracker
              </h1>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TaskForm onCreateTask={handleCreateTask} isLoading={isLoading} />
            <TaskList
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={handleSelectTask}
              onUpdateStatus={handleUpdateStatus}
              onDeleteTask={handleDeleteTask}
              dependencies={dependencies}
            />
            <GraphView
              tasks={tasks}
              dependencies={dependencies}
              selectedTaskId={selectedTaskId}
              onSelectTask={handleSelectTask}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <DependencyPanel
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                dependencies={dependencies}
                onAddDependency={handleAddDependency}
                onRemoveDependency={handleRemoveDependency}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  )
}
