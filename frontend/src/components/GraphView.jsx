import { useState, useMemo, useRef, useCallback } from "react"

const statusColors = {
  pending: { fill: "#f1f5f9", stroke: "#94a3b8", text: "#475569" },
  in_progress: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e40af" },
  completed: { fill: "#dcfce7", stroke: "#22c55e", text: "#166534" },
  blocked: { fill: "#fee2e2", stroke: "#ef4444", text: "#991b1b" },
}

export function GraphView({
  tasks,
  dependencies,
  selectedTaskId,
  onSelectTask,
}) {
  const [zoom, setZoom] = useState(1)
  const [draggedPositions, setDraggedPositions] = useState({})
  const [draggingId, setDraggingId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.4))
  const handleResetZoom = () => setZoom(1)

  // Calculate initial positions based on dependency levels
  const calculatedPositions = useMemo(() => {
    const positions = {}
    const nodeCount = tasks.length
    
    if (nodeCount === 0) return positions
    
    const taskIds = tasks.map(t => String(t.id))
    const incomingCount = {}
    const outgoingDeps = {}
    
    taskIds.forEach(id => {
      incomingCount[id] = 0
      outgoingDeps[id] = []
    })
    
    Object.entries(dependencies).forEach(([taskId, depIds]) => {
      if (taskIds.includes(taskId)) {
        depIds.forEach(depId => {
          const depIdStr = String(depId)
          if (taskIds.includes(depIdStr)) {
            incomingCount[depIdStr] = (incomingCount[depIdStr] || 0) + 1
            outgoingDeps[taskId] = outgoingDeps[taskId] || []
            outgoingDeps[taskId].push(depIdStr)
          }
        })
      }
    })
    
    const levels = {}
    const assigned = new Set()
    
    taskIds.forEach(id => {
      const deps = dependencies[id] || []
      if (deps.length === 0) {
        levels[id] = 0
        assigned.add(id)
      }
    })
    
    let maxIterations = nodeCount + 1
    while (assigned.size < nodeCount && maxIterations > 0) {
      maxIterations--
      taskIds.forEach(id => {
        if (assigned.has(id)) return
        const deps = (dependencies[id] || []).map(d => String(d))
        const validDeps = deps.filter(d => taskIds.includes(d))
        
        if (validDeps.every(d => assigned.has(d))) {
          const maxDepLevel = validDeps.length > 0 
            ? Math.max(...validDeps.map(d => levels[d]))
            : -1
          levels[id] = maxDepLevel + 1
          assigned.add(id)
        }
      })
    }
    
    taskIds.forEach(id => {
      if (!assigned.has(id)) {
        levels[id] = 0
      }
    })
    
    const levelGroups = {}
    taskIds.forEach(id => {
      const level = levels[id] || 0
      if (!levelGroups[level]) levelGroups[level] = []
      levelGroups[level].push(id)
    })
    
    const levelKeys = Object.keys(levelGroups).map(Number).sort((a, b) => a - b)
    const spacingX = nodeCount > 15 ? 120 : 150
    const spacingY = nodeCount > 15 ? 80 : 100
    
    levelKeys.forEach(level => {
      const tasksInLevel = levelGroups[level]
      const levelX = 100 + level * spacingX
      const totalHeight = (tasksInLevel.length - 1) * spacingY
      const startY = 175 - totalHeight / 2
      
      tasksInLevel.forEach((id, index) => {
        positions[id] = {
          x: levelX,
          y: Math.max(60, startY + index * spacingY),
        }
      })
    })
    
    return positions
  }, [tasks, dependencies])

  // Merge calculated positions with dragged positions
  const nodePositions = useMemo(() => {
    const merged = { ...calculatedPositions }
    Object.entries(draggedPositions).forEach(([id, pos]) => {
      if (merged[id]) {
        merged[id] = pos
      }
    })
    return merged
  }, [calculatedPositions, draggedPositions])

  // Drag handlers
  const getSVGPoint = useCallback((clientX, clientY) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: svgP.x / zoom, y: svgP.y / zoom }
  }, [zoom])

  const handleMouseDown = useCallback((e, taskId) => {
    e.stopPropagation()
    const svgPoint = getSVGPoint(e.clientX, e.clientY)
    const nodePos = nodePositions[String(taskId)]
    if (nodePos) {
      setDraggingId(String(taskId))
      setDragOffset({
        x: svgPoint.x - nodePos.x,
        y: svgPoint.y - nodePos.y,
      })
    }
  }, [getSVGPoint, nodePositions])

  const handleMouseMove = useCallback((e) => {
    if (!draggingId) return
    const svgPoint = getSVGPoint(e.clientX, e.clientY)
    setDraggedPositions(prev => ({
      ...prev,
      [draggingId]: {
        x: Math.max(40, Math.min(560, svgPoint.x - dragOffset.x)),
        y: Math.max(40, Math.min(310, svgPoint.y - dragOffset.y)),
      }
    }))
  }, [draggingId, dragOffset, getSVGPoint])

  const handleMouseUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  const handleResetLayout = useCallback(() => {
    setDraggedPositions({})
  }, [])

  // Export as PNG
  const handleExportPNG = useCallback(() => {
    if (!svgRef.current) return
    
    const svg = svgRef.current
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)
    
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = svg.viewBox.baseVal.width * 2
      canvas.height = svg.viewBox.baseVal.height * 2
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "#f8fafc"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const pngUrl = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.href = pngUrl
      downloadLink.download = "task-dependency-graph.png"
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [])

  const highlightedIds = useMemo(() => {
    if (!selectedTaskId) return new Set()
    const ids = new Set([String(selectedTaskId)])
    const taskDeps = dependencies[String(selectedTaskId)] || []
    taskDeps.forEach((depId) => ids.add(String(depId)))
    return ids
  }, [selectedTaskId, dependencies])

  const edges = useMemo(() => {
    const result = []
    Object.entries(dependencies).forEach(([taskId, depIds]) => {
      const taskPos = nodePositions[String(taskId)]
      if (!taskPos) return
      depIds.forEach((depId) => {
        const depPos = nodePositions[String(depId)]
        if (!depPos) return
        result.push({
          id: `${depId}-${taskId}`,
          x1: depPos.x,
          y1: depPos.y,
          x2: taskPos.x,
          y2: taskPos.y,
          sourceId: String(depId),
          targetId: String(taskId),
        })
      })
    })
    return result
  }, [dependencies, nodePositions])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Dependency Graph
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleExportPNG}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Export as PNG"
            title="Export as PNG"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleResetLayout}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Reset layout"
            title="Reset node positions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6">
        <div 
          className="relative w-full h-[350px] rounded-xl bg-slate-50 border border-slate-200 overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {tasks.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-slate-500">No tasks to display</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${Math.max(500, Object.keys(dependencies).length > 0 ? 600 : 500, tasks.length * 40)} ${Math.max(350, tasks.length * 30)}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              className="transition-transform duration-200"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="35"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <marker
                  id="arrowhead-highlighted"
                  markerWidth="10"
                  markerHeight="7"
                  refX="35"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>
              
              {/* Render edges */}
              {edges.map((edge) => {
                const isHighlighted = 
                  String(selectedTaskId) === edge.targetId && 
                  highlightedIds.has(edge.sourceId)
                return (
                  <line
                    key={edge.id}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={isHighlighted ? "#3b82f6" : "#cbd5e1"}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    markerEnd={isHighlighted ? "url(#arrowhead-highlighted)" : "url(#arrowhead)"}
                    className="transition-all duration-200"
                  />
                )
              })}
              
              {/* Render nodes */}
              {tasks.map((task) => {
                const pos = nodePositions[String(task.id)]
                if (!pos) return null
                const isSelected = String(selectedTaskId) === String(task.id)
                const isHighlighted = highlightedIds.has(String(task.id))
                const isDragging = draggingId === String(task.id)
                const colors = statusColors[task.status] || statusColors.pending
                
                return (
                  <g
                    key={task.id}
                    onMouseDown={(e) => handleMouseDown(e, task.id)}
                    onClick={() => !isDragging && onSelectTask(task.id)}
                    className={`${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onSelectTask(task.id)
                      }
                    }}
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? 32 : 28}
                      fill={isSelected ? "#3b82f6" : colors.fill}
                      stroke={isSelected ? "#1d4ed8" : isHighlighted ? "#3b82f6" : colors.stroke}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-200"
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isSelected ? "#ffffff" : colors.text}
                      fontSize="10"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                    >
                      {task.title.length > 8 ? task.title.slice(0, 8) + "..." : task.title}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isSelected ? "#ffffff" : "#64748b"}
                      fontSize="8"
                      className="pointer-events-none select-none"
                    >
                      id: {task.id}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-400"></span>
            <span className="text-slate-600">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-200 border border-blue-500"></span>
            <span className="text-slate-600">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-200 border border-green-500"></span>
            <span className="text-slate-600">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-200 border border-red-500"></span>
            <span className="text-slate-600">Blocked</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
          <span>Drag nodes to reposition | Click to select</span>
        </div>
      </div>
    </div>
  )
}
