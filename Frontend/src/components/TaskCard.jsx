import { motion } from "framer-motion";
import { Calendar, Flag, CheckCircle2 } from "lucide-react";
import { formatTaskDate } from "../utils/date";
import { fireConfetti, playSuccessChime } from "../utils/confetti";

const priorityConfig = {
  critical: { color: "#FF5B5B", bg: "rgba(255, 91, 91, 0.15)", label: "Critical" },
  high: { color: "#FEC53D", bg: "rgba(254, 197, 61, 0.18)", label: "High" },
  medium: { color: "#4880FF", bg: "rgba(72, 128, 255, 0.15)", label: "Medium" },
  low: { color: "#00B69B", bg: "rgba(0, 182, 155, 0.15)", label: "Low" },
};

const TaskCard = ({ task, onClick, onDragStart, onStatusChange, canEdit = true }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const isDone = task.status === "done";
  const dateFormatted = formatTaskDate(task.dueDate);

  const handleQuickComplete = (e) => {
    e.stopPropagation();
    if (canEdit && !isDone && onStatusChange) {
      fireConfetti();
      playSuccessChime();
      onStatusChange(task._id || task.id, "done");
    }
  };

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

          <div className="task-card__actions flex items-center gap-1.5">
            {/* Quick Complete Button */}
            {canEdit && (
              <button
                type="button"
                onClick={handleQuickComplete}
                className={`p-1 rounded-md transition-colors ${
                  isDone
                    ? "text-[#00B69B] opacity-90 cursor-default"
                    : "text-gray-400 hover:text-[#00B69B] hover:bg-[#00B69B]/10 cursor-pointer"
                }`}
                title={isDone ? "Completed" : "Mark as completed (🎉)"}
                aria-label="Toggle Complete"
              >
                <CheckCircle2 size={14} className={isDone ? "fill-[#00B69B]/20" : ""} />
              </button>
            )}

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
