import { motion } from "framer-motion";
import { Calendar, Flag } from "lucide-react";
import { formatTaskDate } from "../utils/date";

const priorityConfig = {
  critical: { color: "#FF5B5B", bg: "rgba(255, 91, 91, 0.15)", label: "Critical" },
  high: { color: "#FEC53D", bg: "rgba(254, 197, 61, 0.18)", label: "High" },
  medium: { color: "#4880FF", bg: "rgba(72, 128, 255, 0.15)", label: "Medium" },
  low: { color: "#00B69B", bg: "rgba(0, 182, 155, 0.15)", label: "Low" },
};

const TaskCard = ({ task, onClick, onDragStart }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const dateFormatted = formatTaskDate(task.dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      onClick={() => onClick?.(task)}
      className="task-card"
    >
      {/* Priority accent strip */}
      <div className="task-card__priority-strip" style={{ backgroundColor: priority.color }} />

      <div className="task-card__body">
        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="task-card__tags">
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="task-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h4 className="task-card__title">{task.title}</h4>

        {/* Description preview */}
        {task.description && (
          <p className="task-card__desc">
            {task.description.slice(0, 75)}
            {task.description.length > 75 ? "…" : ""}
          </p>
        )}

        {/* Footer */}
        <div className="task-card__footer">
          <div className="task-card__meta">
            {/* Priority badge */}
            <span
              className="task-card__badge"
              style={{ color: priority.color, backgroundColor: priority.bg }}
            >
              <Flag size={10} /> {priority.label}
            </span>

            {/* Due date */}
            {dateFormatted && (
              <span className={`task-card__date ${isOverdue ? "task-card__date--overdue" : ""}`}>
                <Calendar size={10} /> {dateFormatted}
              </span>
            )}
          </div>

          <div className="task-card__actions">
            {/* Assignee avatar */}
            {task.assignee && (
              <span
                className="task-card__assignee"
                title={task.assignee.username || "Assigned"}
              >
                {task.assignee.username?.charAt(0)?.toUpperCase() || "A"}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
