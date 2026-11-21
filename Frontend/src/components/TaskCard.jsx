import { motion } from "framer-motion";
import { Calendar, Flag, CheckCircle2, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatTaskDate } from "../utils/date";
import { fireConfetti, playSuccessChime } from "../utils/confetti";

const priorityConfig = {
  critical: { color: "#FF5B5B", bg: "rgba(255, 91, 91, 0.15)", label: "Critical" },
  high: { color: "#FEC53D", bg: "rgba(254, 197, 61, 0.18)", label: "High" },
  medium: { color: "#4880FF", bg: "rgba(72, 128, 255, 0.15)", label: "Medium" },
  low: { color: "#00B69B", bg: "rgba(0, 182, 155, 0.15)", label: "Low" },
};

const TaskCard = ({ task, onClick, onDragStart, onStatusChange, canEdit = true }) => {
  const { user } = useAuth();
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const isDone = task.status === "done";
  const dateFormatted = formatTaskDate(task.dueDate);

  // Check if this task is assigned to the currently logged in user
  const isAssignedToMe = Boolean(
    user?.id && (task.assignee?._id === user.id || task.assignee === user.id)
  );

  // Either Admin/Editor or the assigned user is authorized to complete / change status
  const canChangeStatus = canEdit || isAssignedToMe;

  const handleQuickComplete = (e) => {
    e.stopPropagation();
    if (canChangeStatus && !isDone && onStatusChange) {
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
      draggable={canChangeStatus}
      onDragStart={(e) => canChangeStatus && onDragStart?.(e, task)}
      onClick={() => onClick?.(task)}
      className={`task-card ${isAssignedToMe && !isDone ? "ring-1 ring-blue-500/35" : ""}`}
    >
      {/* Priority accent strip */}
      <div className="task-card__priority-strip" style={{ backgroundColor: priority.color }} />

      <div className="task-card__body">
        {/* Top Badges / Tags */}
        <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
          {isAssignedToMe && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4880FF]/15 text-[#4880FF] border border-[#4880FF]/30 flex items-center gap-1 shadow-sm">
              <UserCheck size={10} /> Assigned to you
            </span>
          )}

          {task.tags?.length > 0 && (
            <div className="task-card__tags">
              {task.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="task-card__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

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
            {/* Quick Complete / Task Completion Action */}
            {canChangeStatus && (
              <>
                {isDone ? (
                  <span
                    className="text-[10px] font-bold text-[#00B69B] bg-[#00B69B]/10 border border-[#00B69B]/25 px-2 py-0.5 rounded-md flex items-center gap-1"
                    title="Task has been completed"
                  >
                    <CheckCircle2 size={11} className="fill-[#00B69B]/20" /> Done
                  </span>
                ) : isAssignedToMe ? (
                  <button
                    type="button"
                    onClick={handleQuickComplete}
                    className="text-[10px] font-bold py-1 px-2 rounded-md bg-[#00B69B]/15 hover:bg-[#00B69B]/25 text-[#00B69B] border border-[#00B69B]/30 flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                    title="Mark this assigned task as completed (🎉)"
                    aria-label="Complete assigned task"
                  >
                    <CheckCircle2 size={11} />
                    <span>Complete</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleQuickComplete}
                    className="p-1 rounded-md text-gray-400 hover:text-[#00B69B] hover:bg-[#00B69B]/10 cursor-pointer transition-colors"
                    title="Mark as completed (🎉)"
                    aria-label="Toggle Complete"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                )}
              </>
            )}

            {/* Assignee avatar */}
            {task.assignee && (
              <span
                className="task-card__assignee"
                title={`Assigned to: ${task.assignee.username || "User"}`}
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
