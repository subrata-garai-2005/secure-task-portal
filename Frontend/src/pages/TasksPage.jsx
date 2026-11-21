import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import KanbanBoard from "../components/KanbanBoard";
import TaskModal from "../components/TaskModal";
import SecurityWarningModal from "../components/SecurityWarningModal";
import SkeletonLoader from "../components/SkeletonLoader";
import { motion, AnimatePresence } from "framer-motion";
import { fireConfetti, playSuccessChime } from "../utils/confetti";
import {
  LayoutGrid, List, Plus, Search, Flag, ClipboardList,
  Calendar, User as UserIcon, CheckCircle2, UserCheck
} from "lucide-react";

const TasksPage = () => {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("kanban"); // kanban | list
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [modalTask, setModalTask] = useState(null); // null = closed, {} = new, task = edit
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [warning, setWarning] = useState(null);

  const canEdit = user?.role === "admin" || user?.role === "editor";

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      const filters = {};
      if (filterPriority) filters.priority = filterPriority;
      if (search.trim()) filters.search = search.trim();
      const data = await api.getTasks(token, filters);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [token, filterPriority, search]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getUsers(token);
      setUsers(data.users || []);
    } catch (_err) {
      // Ignore if user lacks permission
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(token, taskId, newStatus);
      setTasks((prev) => prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: newStatus } : t)));
      if (newStatus === "done") {
        fireConfetti();
        playSuccessChime();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSaveTask = async (taskId, payload, isNew) => {
    if (isNew) {
      const data = await api.createTask(token, payload);
      setTasks((prev) => [data.task, ...prev]);
      if (payload.status === "done") {
        fireConfetti();
        playSuccessChime();
      }
    } else {
      const data = await api.updateTask(token, taskId, payload);
      setTasks((prev) => prev.map((t) => ((t._id || t.id) === taskId ? data.task : t)));
      if (payload.status === "done") {
        fireConfetti();
        playSuccessChime();
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(token, taskId);
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const openNewTask = () => {
    setModalTask({});
    setShowModal(true);
  };

  const openEditTask = (task) => {
    setModalTask(task);
    setShowModal(true);
  };

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...tasks].sort(
    (a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  );

  return (
    <div className="page">
      {warning && <SecurityWarningModal attackType={warning} onClose={() => setWarning(null)} />}

      {showModal && (
        <TaskModal
          task={modalTask}
          onClose={() => { setShowModal(false); setModalTask(null); }}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          users={users}
          onWarning={setWarning}
        />
      )}

      {/* Header */}
      <div className="page__header">
        <div>
          <h1 className="page__title">Task Workload</h1>
          <p className="page__subtitle">
            {user?.role === "viewer"
              ? `${tasks.length} task(s) assigned to you — Complete and mark tasks as done`
              : `${tasks.length} total active tasks across organization`}
          </p>
        </div>
        <div className="page__actions">
          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`view-toggle__btn ${view === "kanban" ? "view-toggle__btn--active" : ""}`}
              onClick={() => setView("kanban")}
              title="Kanban Board View"
              aria-label="Kanban Board View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`view-toggle__btn ${view === "list" ? "view-toggle__btn--active" : ""}`}
              onClick={() => setView("list")}
              title="List View"
              aria-label="List View"
            >
              <List size={16} />
            </button>
          </div>

          {canEdit && (
            <button onClick={openNewTask} className="btn btn--primary flex items-center gap-1.5">
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, description or tags..."
            className="search-bar__input"
          />
          {search && (
            <button onClick={() => setSearch("")} className="search-bar__clear">✕</button>
          )}
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader type="card" count={8} />
      ) : view === "kanban" ? (
        <KanbanBoard
          tasks={sortedTasks}
          onTaskClick={openEditTask}
          onStatusChange={handleStatusChange}
          onAddTask={openNewTask}
          canEdit={canEdit}
        />
      ) : (
        /* List View */
        <div className="task-list">
          <div className="task-list__header">
            <span>Task Title</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Assignee</span>
            <span>Due Date</span>
            <span>Action</span>
          </div>
          <AnimatePresence>
            {sortedTasks.map((task) => (
              <motion.div
                key={task._id || task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="task-list__row"
                onClick={() => openEditTask(task)}
              >
                <span className="task-list__title flex items-center gap-2">
                  {(task.assignee?._id || task.assignee) === user?.id && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-[#4880FF] border border-blue-500/30 shrink-0">
                      You
                    </span>
                  )}
                  {task.title}
                </span>
                <span className={`task-list__priority task-list__priority--${task.priority}`}>
                  <Flag size={12} /> {task.priority}
                </span>
                <span className={`task-list__status task-list__status--${task.status}`}>
                  {task.status?.replace("_", " ")}
                </span>
                <span className="task-list__assignee flex items-center gap-1.5">
                  <UserIcon size={13} className="text-[var(--text-muted)]" />
                  {task.assignee?.username || "Unassigned"}
                </span>
                <span
                  className={`task-list__due flex items-center gap-1.5 ${
                    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done"
                      ? "task-list__due--overdue"
                      : ""
                  }`}
                >
                  <Calendar size={13} className="text-[var(--text-muted)]" />
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "No date"}
                </span>
                <span className="task-list__action flex items-center" onClick={(e) => e.stopPropagation()}>
                  {task.status === "done" ? (
                    <span className="text-[11px] font-bold text-[#00B69B] flex items-center gap-1 bg-[#00B69B]/10 border border-[#00B69B]/25 px-2 py-0.5 rounded-md">
                      <CheckCircle2 size={12} className="fill-[#00B69B]/20" /> Done
                    </span>
                  ) : (canEdit || (task.assignee?._id || task.assignee) === user?.id) ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(task._id || task.id, "done")}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#00B69B]/15 hover:bg-[#00B69B]/25 text-[#00B69B] border border-[#00B69B]/30 flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                      title="Complete this task"
                    >
                      <CheckCircle2 size={12} /> Complete
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {sortedTasks.length === 0 && (
            <div className="task-list__empty">
              <ClipboardList size={32} className="text-[var(--text-muted)] mb-2" />
              <p>No tasks found. {canEdit ? "Create your first task above." : ""}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
