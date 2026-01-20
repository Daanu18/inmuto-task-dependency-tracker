from rest_framework import serializers
from .models import Task, TaskDependency


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "title", "description", "status", "created_at", "updated_at"]


class TaskDependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskDependency
        fields = ["id", "task", "depends_on", "created_at"]
        read_only_fields = ["id", "created_at", "task"]
