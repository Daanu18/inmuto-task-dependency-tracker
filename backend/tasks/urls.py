from django.urls import path
from .graph_views import GraphDataAPIView

from .views import (
    TaskListCreateAPIView,
    TaskDetailUpdateAPIView,
    AddDependencyAPIView,
)

urlpatterns = [
    path("tasks/", TaskListCreateAPIView.as_view(), name="task-list-create"),
    path("tasks/<int:pk>/", TaskDetailUpdateAPIView.as_view(), name="task-detail-update"),  # GET/PATCH/DELETE
    path("tasks/<int:task_id>/dependencies/", AddDependencyAPIView.as_view(), name="task-dependency"),
    path("graph/", GraphDataAPIView.as_view(), name="graph-data"),
]