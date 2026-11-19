import { motion } from "framer-motion";
import { Calendar, User, Flag, MessageSquare } from "lucide-react";

const priorityConfig = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Critical" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "High" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.1)", label: "Medium" },
  low: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Low" },
};

const TaskCard = ({ task, onClick, onDragStart }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  const formatDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    const now = new Date();
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      onClick={() => onClick?.(task)}
      className="task-card"
    >
      {/* Priority strip */}
      <div className="task-card__priority-strip" style={{ backgroundColor: priority.color }} />

      <div className="task-card__body">
        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="task-card__tags">
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="task-card__tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h4 className="task-card__title">{task.title}</h4>

        {/* Description preview */}
        {task.description && (
          <p className="task-card__desc">{task.description.slice(0, 80)}{task.description.length > 80 ? "…" : ""}</p>
        )}

        {/* Footer */}
        <div className="task-card__footer">
          <div className="task-card__meta">
            {/* Priority badge */}
            <span className="task-card__badge" style={{ color: priority.color, backgroundColor: priority.bg }}>
              <Flag size={10} /> {priority.label}
            </span>

            {/* Due date */}
            {task.dueDate && (
              <span className={`task-card__date ${isOverdue ? "task-card__date--overdue" : ""}`}>
                <Calendar size={10} /> {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          <div className="task-card__actions">
            {/* Assignee avatar */}
            {task.assignee && (
              <span className="task-card__assignee" title={task.assignee.username}>
                {task.assignee.username?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
