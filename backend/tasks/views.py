from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, TaskDependency
from .serializers import TaskSerializer, TaskDependencySerializer
from .services import detect_cycle_path


def recalculate_task_status(task: Task):
    """
    Rules:
    - If any dependency is blocked -> blocked
    - If dependencies exist and all completed -> in_progress
    - If dependencies exist but not all completed -> pending
    - If no dependencies -> keep current unless pending (we leave as is)
    """
    dependencies = TaskDependency.objects.filter(task=task).select_related("depends_on")

    if not dependencies.exists():
        return task.status  # no change

    dep_statuses = [d.depends_on.status for d in dependencies]

    if any(s == Task.STATUS_BLOCKED for s in dep_statuses):
        return Task.STATUS_BLOCKED

    if all(s == Task.STATUS_COMPLETED for s in dep_statuses):
        return Task.STATUS_IN_PROGRESS

    return Task.STATUS_PENDING


def update_dependents_of(task: Task):
    """
    When task status changes (especially completed/blocked),
    update all tasks that depend on it.
    """
    dependent_links = TaskDependency.objects.filter(depends_on=task).select_related("task")
    for link in dependent_links:
        t = link.task
        new_status = recalculate_task_status(t)
        if t.status != new_status and t.status != Task.STATUS_COMPLETED:
            t.status = new_status
            t.save(update_fields=["status", "updated_at"])


class TaskListCreateAPIView(generics.ListCreateAPIView):
    queryset = Task.objects.all().order_by("-created_at")
    serializer_class = TaskSerializer


class TaskDetailUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def patch(self, request, *args, **kwargs):
        task = self.get_object()
        old_status = task.status

        serializer = self.get_serializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # If task status updated, cascade updates
        if old_status != task.status:
            update_dependents_of(task)

        return Response(serializer.data)


class TaskDetailUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def patch(self, request, *args, **kwargs):
        task = self.get_object()
        old_status = task.status

        serializer = self.get_serializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if old_status != task.status:
            update_dependents_of(task)

        return Response(serializer.data)



class AddDependencyAPIView(APIView):
    """
    GET  /api/tasks/{task_id}/dependencies/  -> list dependencies
    POST /api/tasks/{task_id}/dependencies/  -> add dependency
    Body: { "depends_on_id": 5 }
    """

    def get(self, request, task_id):
        deps = (
            TaskDependency.objects.filter(task_id=task_id)
            .select_related("depends_on")
            .order_by("-created_at")
        )

        data = [
            {
                "id": d.id,
                "task_id": d.task_id,
                "depends_on_id": d.depends_on_id,
                "depends_on_title": d.depends_on.title,
                "depends_on_status": d.depends_on.status,
                "created_at": d.created_at,
            }
            for d in deps
        ]
        return Response(data, status=200)

    def post(self, request, task_id):
        depends_on_id = request.data.get("depends_on_id")
        if depends_on_id is None:
            return Response(
                {"error": "depends_on_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if int(depends_on_id) == int(task_id):
            return Response(
                {"error": "Task cannot depend on itself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            task = Task.objects.get(id=task_id)
            depends_on = Task.objects.get(id=depends_on_id)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)

        # Prevent duplicates
        if TaskDependency.objects.filter(task=task, depends_on=depends_on).exists():
            return Response(
                {"error": "Dependency already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle_path = detect_cycle_path(task_id=int(task_id), depends_on_id=int(depends_on_id))
        if cycle_path:
            return Response(
                {"error": "Circular dependency detected", "path": cycle_path},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dep = TaskDependency.objects.create(task=task, depends_on=depends_on)

        # Recalculate task status
        if task.status != Task.STATUS_COMPLETED:
            new_status = recalculate_task_status(task)
            if new_status != task.status:
                task.status = new_status
                task.save(update_fields=["status", "updated_at"])

        serializer = TaskDependencySerializer(dep)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
