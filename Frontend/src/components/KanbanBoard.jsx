import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import { Plus, CircleDot, Clock, Eye, CheckCircle2 } from "lucide-react";

const columns = [
  { id: "todo", label: "To Do", icon: CircleDot, color: "#64748B" },
  { id: "in_progress", label: "In Progress", icon: Clock, color: "#4880FF" },
  { id: "review", label: "In Review", icon: Eye, color: "#FEC53D" },
  { id: "done", label: "Completed", icon: CheckCircle2, color: "#00B69B" },
];

const KanbanBoard = ({ tasks = [], onTaskClick, onStatusChange, onAddTask, canEdit = true }) => {
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
    if (fromStatus && fromStatus !== toStatus) {
      onStatusChange?.(taskId, toStatus);
    }
  };

  return (
    <div className="kanban">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isOver = dragOver === col.id;
        const ColIcon = col.icon;

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
                <ColIcon size={15} style={{ color: col.color }} />
                <span>{col.label}</span>
                <span className="kanban__count">{columnTasks.length}</span>
              </div>
              {col.id === "todo" && canEdit && (
                <button
                  onClick={() => onAddTask?.()}
                  className="kanban__add-btn"
                  title="Add Task"
                  aria-label="Add Task"
                >
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
