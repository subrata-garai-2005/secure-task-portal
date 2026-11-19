import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Calendar, Flag, Tag, User, Trash2, ShieldAlert, Sparkles, KeyRound } from "lucide-react";
import { scanInputs } from "../utils/attackDetection";
import {
  scanTextForSecrets,
  scanObjectForSecrets,
  redactText,
  autoRedactObject,
} from "../utils/secretScanner";
import SecretLeakModal from "./SecretLeakModal";

const TaskModal = ({ task, onClose, onSave, onDelete, users = [], onWarning }) => {
  const { token, user: currentUser } = useAuth();
  const isNew = !task?._id;

  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "todo",
    assignee: task?.assignee?._id || task?.assignee || "",
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    tags: task?.tags?.join(", ") || "",
  });

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secretLeakPending, setSecretLeakPending] = useState(null); // { findings: [...], target: "task" | "comment" }

  // Real-time secret leaks detection for inline UI
  const titleLeaks = useMemo(() => scanTextForSecrets(form.title, "title"), [form.title]);
  const descLeaks = useMemo(() => scanTextForSecrets(form.description, "description"), [form.description]);
  const commentLeaks = useMemo(() => scanTextForSecrets(newComment, "comment"), [newComment]);

  useEffect(() => {
    if (task?._id) {
      api.getTask(token, task._id).then((data) => {
        setComments(data.comments || []);
      }).catch(() => {});
    }
  }, [task?._id]);

  const executeSave = async (sanitizedTitle, sanitizedDesc) => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        title: sanitizedTitle.trim(),
        description: sanitizedDesc.trim(),
        priority: form.priority,
        status: form.status,
        assignee: form.assignee || null,
        dueDate: form.dueDate || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      await onSave(task?._id, payload, isNew);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }

    // 1. Attack detection (SQLi / XSS)
    const threat = scanInputs({ title: form.title, description: form.description });
    if (threat) { onWarning?.(threat); return; }

    // 2. Secret & Credential Leak Detection
    const secretCheck = scanObjectForSecrets({
      title: form.title,
      description: form.description,
    });

    if (secretCheck.hasSecrets) {
      setSecretLeakPending({
        findings: secretCheck.findings,
        target: "task",
      });
      return;
    }

    // 3. Clean save
    await executeSave(form.title, form.description);
  };

  const executeAddComment = async (sanitizedComment) => {
    try {
      const data = await api.addComment(token, task._id, sanitizedComment.trim());
      setComments((prev) => [data.comment, ...prev]);
      setNewComment("");
    } catch (e) {
      setError("Failed to add comment");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // 1. Attack detection (SQLi / XSS)
    const threat = scanInputs({ comment: newComment });
    if (threat) { onWarning?.(threat); return; }

    // 2. Secret & Credential Leak Detection
    const leaks = scanTextForSecrets(newComment, "comment");
    if (leaks.length > 0) {
      setSecretLeakPending({
        findings: leaks,
        target: "comment",
      });
      return;
    }

    // 3. Clean comment save
    await executeAddComment(newComment);
  };

  // Auto-redact handler for SecretLeakModal
  const handleConfirmAutoRedact = () => {
    if (!secretLeakPending) return;

    if (secretLeakPending.target === "task") {
      const { redactedObj } = autoRedactObject({
        title: form.title,
        description: form.description,
      });

      setForm((prev) => ({
        ...prev,
        title: redactedObj.title,
        description: redactedObj.description,
      }));
      setSecretLeakPending(null);

      // Execute save with safe redacted content
      executeSave(redactedObj.title, redactedObj.description);
    } else if (secretLeakPending.target === "comment") {
      const { redactedText } = redactText(newComment, "comment");
      setNewComment(redactedText);
      setSecretLeakPending(null);

      // Execute comment creation with safe redacted content
      executeAddComment(redactedText);
    }
  };

  // Inline Auto-Redact click
  const handleInlineRedactField = (field) => {
    if (field === "description") {
      const res = redactText(form.description, "description");
      setForm((prev) => ({ ...prev, description: res.redactedText }));
    } else if (field === "title") {
      const res = redactText(form.title, "title");
      setForm((prev) => ({ ...prev, title: res.redactedText }));
    } else if (field === "comment") {
      const res = redactText(newComment, "comment");
      setNewComment(res.redactedText);
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="task-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="task-modal__header">
              <div className="flex items-center gap-2.5">
                <h2 className="task-modal__title">{isNew ? "Create Task" : "Edit Task"}</h2>
                <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Protected
                </span>
              </div>
              <div className="task-modal__header-actions">
                {!isNew && currentUser?.role === "admin" && (
                  <button onClick={() => { onDelete?.(task._id); onClose(); }} className="task-modal__delete">
                    <Trash2 size={16} /> Delete
                  </button>
                )}
                <button onClick={onClose} className="task-modal__close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {error && <div className="task-modal__error">⚠ {error}</div>}

            <div className="task-modal__body">
              {/* Left: Form */}
              <div className="task-modal__form">
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label>Title</label>
                    {titleLeaks.length > 0 && (
                      <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                        <KeyRound size={11} /> Credential detected in title
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Task title..."
                    className={`form-input ${titleLeaks.length > 0 ? "border-amber-500/60 focus:border-amber-500" : ""}`}
                  />
                  {titleLeaks.length > 0 && (
                    <div className="mt-1 flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg text-amber-300">
                      <span>Detected: {titleLeaks.map((l) => l.type).join(", ")}</span>
                      <button
                        type="button"
                        onClick={() => handleInlineRedactField("title")}
                        className="text-[11px] font-semibold text-amber-200 hover:text-white underline cursor-pointer"
                      >
                        Auto-Redact
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label>Description</label>
                    {descLeaks.length > 0 && (
                      <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1 animate-pulse">
                        <ShieldAlert size={12} /> {descLeaks.length} Secret{descLeaks.length > 1 ? "s" : ""} Exposed
                      </span>
                    )}
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the task (API keys and sensitive tokens are automatically guarded)..."
                    className={`form-input form-textarea ${descLeaks.length > 0 ? "border-amber-500/60 focus:border-amber-500" : ""}`}
                    rows={4}
                  />

                  {/* Inline Secret Warning & Quick Auto-Redact Pill */}
                  {descLeaks.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 flex items-center justify-between text-xs bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-300"
                    >
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-400 shrink-0" />
                        <span>
                          <strong>Smart Leak Scanner:</strong> Found {descLeaks.length} credential{descLeaks.length > 1 ? "s" : ""} ({descLeaks.map((l) => l.type).join(", ")})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInlineRedactField("description")}
                        className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 border border-amber-500/40 rounded font-medium text-[11px] transition-colors cursor-pointer shrink-0"
                      >
                        <Sparkles size={11} /> Auto-Redact
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><Flag size={12} /> Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="form-input">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input">
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><User size={12} /> Assignee</label>
                    <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="form-input">
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u._id || u.id} value={u._id || u.id}>{u.username || u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label><Calendar size={12} /> Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label><Tag size={12} /> Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="frontend, bug, urgent"
                    className="form-input"
                  />
                </div>

                <button onClick={handleSave} disabled={loading} className="btn btn--primary btn--full">
                  {loading ? "Saving…" : isNew ? "Create Task" : "Save Changes"}
                </button>
              </div>

              {/* Right: Comments (only for existing tasks) */}
              {!isNew && (
                <div className="task-modal__comments">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="task-modal__comments-title mb-0">Comments</h3>
                    {commentLeaks.length > 0 && (
                      <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                        <KeyRound size={11} /> Credential detected
                      </span>
                    )}
                  </div>

                  <div className="task-modal__comment-input">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      placeholder="Write a comment..."
                      className={`form-input ${commentLeaks.length > 0 ? "border-amber-500/60" : ""}`}
                    />
                    <button onClick={handleAddComment} className="btn btn--icon">
                      <Send size={14} />
                    </button>
                  </div>

                  {commentLeaks.length > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg text-amber-300">
                      <span>Detected: {commentLeaks.map((l) => l.type).join(", ")}</span>
                      <button
                        type="button"
                        onClick={() => handleInlineRedactField("comment")}
                        className="text-[11px] font-semibold text-amber-200 hover:text-white underline cursor-pointer"
                      >
                        Auto-Redact
                      </button>
                    </div>
                  )}

                  <div className="task-modal__comment-list mt-3">
                    {comments.length === 0 ? (
                      <p className="task-modal__no-comments">No comments yet</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c._id} className="task-modal__comment">
                          <div className="task-modal__comment-header">
                            <span className="task-modal__comment-avatar">
                              {c.author?.username?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                            <span className="task-modal__comment-author">{c.author?.username || "Unknown"}</span>
                            <span className="task-modal__comment-time">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="task-modal__comment-text">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Smart Secret Leak Modal */}
      {secretLeakPending && (
        <SecretLeakModal
          findings={secretLeakPending.findings}
          onAutoRedact={handleConfirmAutoRedact}
          onEditManually={() => setSecretLeakPending(null)}
        />
      )}
    </>
  );
};

export default TaskModal;
