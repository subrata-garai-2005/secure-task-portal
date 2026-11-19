import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import KanbanBoard from "../components/KanbanBoard";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import SecurityWarningModal from "../components/SecurityWarningModal";
import SkeletonLoader from "../components/SkeletonLoader";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, List, Plus, Search, Filter, Flag, Calendar } from "lucide-react";

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

  const fetchTasks = async () => {
    try {
      const filters = {};
      if (filterPriority) filters.priority = filterPriority;
      if (search) filters.search = search;
      const data = await api.getTasks(token, filters);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers(token);
      setUsers(data.users || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [token, filterPriority]);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(token, taskId, newStatus);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTask = async (taskId, payload, isNew) => {
    if (isNew) {
      const data = await api.createTask(token, payload);
      setTasks((prev) => [...prev, data.task]);
    } else {
      const data = await api.updateTask(token, taskId, payload);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(token, taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
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
  const sortedTasks = [...tasks].sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

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
          <h1 className="page__title">Tasks</h1>
          <p className="page__subtitle">{tasks.length} task{tasks.length !== 1 ? "s" : ""} total</p>
        </div>
        <div className="page__actions">
          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`view-toggle__btn ${view === "kanban" ? "view-toggle__btn--active" : ""}`}
              onClick={() => setView("kanban")}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`view-toggle__btn ${view === "list" ? "view-toggle__btn--active" : ""}`}
              onClick={() => setView("list")}
            >
              <List size={16} />
            </button>
          </div>

          {canEdit && (
            <button onClick={openNewTask} className="btn btn--primary">
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
            placeholder="Search tasks..."
            className="search-bar__input"
          />
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
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
        />
      ) : (
        /* List View */
        <div className="task-list">
          <div className="task-list__header">
            <span>Task</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Assignee</span>
            <span>Due Date</span>
          </div>
          <AnimatePresence>
            {sortedTasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="task-list__row"
                onClick={() => openEditTask(task)}
              >
                <span className="task-list__title">{task.title}</span>
                <span className={`task-list__priority task-list__priority--${task.priority}`}>
                  <Flag size={12} /> {task.priority}
                </span>
                <span className={`task-list__status task-list__status--${task.status}`}>
                  {task.status.replace("_", " ")}
                </span>
                <span className="task-list__assignee">
                  {task.assignee?.username || "—"}
                </span>
                <span className={`task-list__due ${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done" ? "task-list__due--overdue" : ""}`}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {sortedTasks.length === 0 && (
            <div className="task-list__empty">
              <span>📋</span>
              <p>No tasks found. {canEdit ? "Create your first task!" : ""}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
