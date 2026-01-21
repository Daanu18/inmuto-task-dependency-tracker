import { api } from "./client";

export const tasksApi = {
  listTasks: async () => (await api.get("/tasks/")).data,
  createTask: async (payload) => (await api.post("/tasks/", payload)).data,
  updateTask: async (id, payload) => (await api.patch(`/tasks/${id}/`, payload)).data,
  deleteTask: async (id) => (await api.delete(`/tasks/${id}/`)).data,

  addDependency: async (taskId, dependsOnId) =>
    (await api.post(`/tasks/${taskId}/dependencies/`, { depends_on_id: dependsOnId })).data,

  listDependencies: async (taskId) =>
    (await api.get(`/tasks/${taskId}/dependencies/`)).data,

  getGraph: async () => (await api.get("/graph/")).data,
};
