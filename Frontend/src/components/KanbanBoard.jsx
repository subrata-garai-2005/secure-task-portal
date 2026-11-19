import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";

const columns = [
  { id: "todo", label: "To Do", emoji: "📋", color: "#6b7280" },
  { id: "in_progress", label: "In Progress", emoji: "🔄", color: "#3b82f6" },
  { id: "review", label: "Review", emoji: "👀", color: "#a855f7" },
  { id: "done", label: "Done", emoji: "✅", color: "#22c55e" },
];

const KanbanBoard = ({ tasks, onTaskClick, onStatusChange, onAddTask }) => {
  const [dragOver, setDragOver] = useState(null);

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("taskId", task._id || task.id);
    e.dataTransfer.setData("fromStatus", task.status);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOver(columnId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e, toStatus) => {
    e.preventDefault();
    setDragOver(null);
    const taskId = e.dataTransfer.getData("taskId");
    const fromStatus = e.dataTransfer.getData("fromStatus");
    if (fromStatus !== toStatus) {
      onStatusChange?.(taskId, toStatus);
    }
  };

  return (
    <div className="kanban">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isOver = dragOver === col.id;

        return (
          <div
            key={col.id}
            className={`kanban__column ${isOver ? "kanban__column--dragover" : ""}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="kanban__column-header">
              <div className="kanban__column-title">
                <span>{col.emoji}</span>
                <span>{col.label}</span>
                <span className="kanban__count">{columnTasks.length}</span>
              </div>
              {col.id === "todo" && (
                <button onClick={() => onAddTask?.()} className="kanban__add-btn">
                  <Plus size={14} />
                </button>
              )}
            </div>

            <div className="kanban__cards">
              <AnimatePresence>
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task._id || task.id}
                    task={task}
                    onClick={onTaskClick}
                    onDragStart={handleDragStart}
                  />
                ))}
              </AnimatePresence>

              {columnTasks.length === 0 && (
                <div className="kanban__empty">
                  <span>No tasks</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
