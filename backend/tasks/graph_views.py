from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Task, TaskDependency


class GraphDataAPIView(APIView):
    def get(self, request):
        tasks = Task.objects.all().order_by("id")
        deps = TaskDependency.objects.all()

        nodes = [
            {
                "id": t.id,
                "title": t.title,
                "status": t.status,
            }
            for t in tasks
        ]

        edges = [
            {
                "from": d.task_id,       # task
                "to": d.depends_on_id,   # depends_on
            }
            for d in deps
        ]

        return Response({"nodes": nodes, "edges": edges}, status=200)
