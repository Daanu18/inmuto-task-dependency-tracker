from .models import TaskDependency


def detect_cycle_path(task_id: int, depends_on_id: int):
    """
    We are trying to add: task_id -> depends_on_id

    Cycle occurs if depends_on_id can already reach task_id.
    Return cycle path like: [task_id, ..., depends_on_id, task_id]
    If no cycle, return None
    """

    # Build adjacency list from DB
    deps = TaskDependency.objects.values_list("task_id", "depends_on_id")
    graph = {}
    for t, d in deps:
        graph.setdefault(t, []).append(d)

    # Temporarily add the new edge
    graph.setdefault(task_id, []).append(depends_on_id)

    visited = set()
    stack = []
    on_path = set()

    def dfs(node):
        visited.add(node)
        stack.append(node)
        on_path.add(node)

        for nxt in graph.get(node, []):
            if nxt not in visited:
                res = dfs(nxt)
                if res:
                    return res
            elif nxt in on_path:
                # Found a cycle, extract cycle path
                idx = stack.index(nxt)
                cycle = stack[idx:] + [nxt]
                return cycle

        stack.pop()
        on_path.remove(node)
        return None

    for start in list(graph.keys()):
        if start not in visited:
            cycle = dfs(start)
            if cycle:
                return cycle

    return None
