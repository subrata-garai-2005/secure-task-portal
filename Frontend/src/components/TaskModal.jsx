import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Calendar, Flag, Tag, User, Trash2, ShieldAlert, Sparkles, KeyRound, UserCheck, CheckCircle2 } from "lucide-react";
import { scanInputs } from "../utils/attackDetection";
import {
  scanTextForSecrets,
  scanObjectForSecrets,
  redactText,
  autoRedactObject,
} from "../utils/secretScanner";
import SecretLeakModal from "./SecretLeakModal";
import { formatTimeAgo } from "../utils/date";
import { fireConfetti, playSuccessChime } from "../utils/confetti";

const TaskModal = ({ task, onClose, onSave, onDelete, users = [], onWarning }) => {
  const { token, user: currentUser } = useAuth();
  const isNew = !task?._id;

  const isAdminOrEditor = currentUser?.role === "admin" || currentUser?.role === "editor";
  const isAssignedToMe = Boolean(
    currentUser?.id && (task?.assignee?._id === currentUser.id || task?.assignee === currentUser.id)
  );
  const isOnlyAssignee = !isNew && !isAdminOrEditor && isAssignedToMe;

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
  const [secretLeakPending, setSecretLeakPending] = useState(null);

  // Real-time secret leaks detection for inline UI
  const titleLeaks = useMemo(() => scanTextForSecrets(form.title, "title"), [form.title]);
  const descLeaks = useMemo(() => scanTextForSecrets(form.description, "description"), [form.description]);
  const commentLeaks = useMemo(() => scanTextForSecrets(newComment, "comment"), [newComment]);

  useEffect(() => {
    if (task?._id && token) {
      api.getTask(token, task._id)
        .then((data) => {
          setComments(data.comments || []);
        })
        .catch(() => {});
    }
  }, [task?._id, token]);

  const executeSave = async (sanitizedTitle, sanitizedDesc, overrideStatus) => {
    setLoading(true);
    setError("");
    try {
      const targetStatus = overrideStatus || form.status;
      const payload = isOnlyAssignee
        ? { status: targetStatus }
        : {
            title: sanitizedTitle.trim(),
            description: sanitizedDesc.trim(),
            priority: form.priority,
            status: targetStatus,
            assignee: form.assignee || null,
            dueDate: form.dueDate || null,
            tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          };

      await onSave(task?._id, payload, isNew);
      if (targetStatus === "done") {
        fireConfetti();
        playSuccessChime();
      }
      onClose();
    } catch (saveError) {
      setError(saveError.response?.data?.error || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMarkComplete = async () => {
    setForm((prev) => ({ ...prev, status: "done" }));
    await executeSave(form.title, form.description, "done");
  };

  const handleSave = async () => {
    if (isOnlyAssignee) {
      // Assignee only updates status
      await executeSave(form.title, form.description);
      return;
    }

    if (!form.title.trim()) { setError("Title is required"); return; }

    // 1. Attack detection (SQLi / XSS)
    const threat = scanInputs({ title: form.title, description: form.description });
    if (threat) { onWarning?.(threat); return; }

    // 2. Secret & Credential Leak Detection (JWT Token, API Key, Access Tokens, Credentials)
    const secretCheck = scanObjectForSecrets({
      title: form.title,
      description: form.description,
      tags: form.tags,
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
    } catch (_err) {
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

  // Auto-redact handler for SecretLeakModal (Security Alert)
  const handleConfirmAutoRedact = () => {
    if (!secretLeakPending) return;

    if (secretLeakPending.target === "task") {
      const { redactedObj } = autoRedactObject({
        title: form.title,
        description: form.description,
        tags: form.tags,
      });

      setForm((prev) => ({
        ...prev,
        title: redactedObj.title,
        description: redactedObj.description,
        tags: redactedObj.tags,
      }));
      setSecretLeakPending(null);

      executeSave(redactedObj.title, redactedObj.description);
    } else if (secretLeakPending.target === "comment") {
      const { redactedText } = redactText(newComment, "comment");
      setNewComment(redactedText);
      setSecretLeakPending(null);
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
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="task-modal"
            onClick={(ev) => ev.stopPropagation()}
          >
            {/* Header */}
            <div className="task-modal__header">
              <div className="flex items-center gap-2.5">
                <h2 className="task-modal__title">{isNew ? "Create Task" : "Edit Task"}</h2>
                <span className="badge badge--success">
                  Protected
                </span>
              </div>
              <div className="task-modal__header-actions">
                {!isNew && currentUser?.role === "admin" && (
                  <button onClick={() => { onDelete?.(task._id); onClose(); }} className="task-modal__delete">
                    <Trash2 size={16} /> Delete
                  </button>
                )}
                <button onClick={onClose} className="task-modal__close" aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>
            </div>

            {error && <div className="task-modal__error">⚠ {error}</div>}

            <div className="task-modal__body">
              {/* Left: Form */}
              <div className="task-modal__form">
                {/* Notice for assigned users */}
                {isOnlyAssignee && (
                  <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-[#4880FF] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <UserCheck size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--text-primary)] block">
                          Task Assigned to You
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] block">
                          You are responsible for completing this task. Update status below when finished.
                        </span>
                      </div>
                    </div>

                    {form.status !== "done" && (
                      <button
                        type="button"
                        onClick={handleQuickMarkComplete}
                        className="btn btn--primary bg-[#00B69B] hover:bg-[#00B69B]/90 border-[#00B69B] text-white font-bold text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        Complete Task
                      </button>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label>Title {isOnlyAssignee && <span className="text-[10px] text-[var(--text-muted)]">(Set by Admin)</span>}</label>
                    {titleLeaks.length > 0 && (
                      <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                        <KeyRound size={11} /> Credential detected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.title}
                    disabled={isOnlyAssignee}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Task title..."
                    className={`form-input ${titleLeaks.length > 0 ? "border-amber-500/60 focus:border-amber-500" : ""} ${isOnlyAssignee ? "opacity-80 bg-[var(--bg-tertiary)] cursor-not-allowed" : ""}`}
                  />
                  {titleLeaks.length > 0 && (
                    <div className="mt-1 flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg text-amber-300">
                      <span>Detected: {titleLeaks.map((l) => l.type).join(", ")}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSecretLeakPending({ findings: titleLeaks, target: "task" })}
                          className="text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
                        >
                          View Alert
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInlineRedactField("title")}
                          className="text-[11px] font-semibold text-amber-200 hover:text-white underline cursor-pointer"
                        >
                          Auto-Redact
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label>Description {isOnlyAssignee && <span className="text-[10px] text-[var(--text-muted)]">(Instructions)</span>}</label>
                    {descLeaks.length > 0 && (
                      <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                        <ShieldAlert size={12} /> {descLeaks.length} Secret{descLeaks.length > 1 ? "s" : ""} Exposed
                      </span>
                    )}
                  </div>
                  <textarea
                    value={form.description}
                    disabled={isOnlyAssignee}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the task (API keys and credentials are automatically guarded)..."
                    className={`form-input form-textarea ${descLeaks.length > 0 ? "border-amber-500/60 focus:border-amber-500" : ""} ${isOnlyAssignee ? "opacity-80 bg-[var(--bg-tertiary)] cursor-not-allowed" : ""}`}
                    rows={4}
                  />

                  {/* Inline Secret Warning & Quick Auto-Redact Pill */}
                  {descLeaks.length > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-400 shrink-0" />
                        <span>
                          <strong>Smart Leak Scanner:</strong> Found {descLeaks.length} credential{descLeaks.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSecretLeakPending({ findings: descLeaks, target: "task" })}
                          className="text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
                        >
                          View Alert
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInlineRedactField("description")}
                          className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded font-medium text-[11px] transition-colors cursor-pointer shrink-0"
                        >
                          <Sparkles size={11} /> Auto-Redact
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><Flag size={12} /> Priority</label>
                    <select
                      value={form.priority}
                      disabled={isOnlyAssignee}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className={`form-input ${isOnlyAssignee ? "opacity-80 bg-[var(--bg-tertiary)] cursor-not-allowed" : ""}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="flex items-center justify-between">
                      <span>Status</span>
                      {isOnlyAssignee && <span className="text-[10px] text-[#4880FF] font-bold">Editable by you</span>}
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={`form-input ${isOnlyAssignee ? "ring-2 ring-[#4880FF]/50 border-[#4880FF] font-semibold" : ""}`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done (Completed)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><User size={12} /> Assignee</label>
                    <select
                      value={form.assignee}
                      disabled={isOnlyAssignee}
                      onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                      className={`form-input ${isOnlyAssignee ? "opacity-80 bg-[var(--bg-tertiary)] cursor-not-allowed" : ""}`}
                    >
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
                      disabled={isOnlyAssignee}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className={`form-input ${isOnlyAssignee ? "opacity-80 bg-[var(--bg-tertiary)] cursor-not-allowed" : ""}`}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label><Tag size={12} /> Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    disabled={isOnlyAssignee}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="frontend, security, urgent"
                    className={`form-input ${isOnlyAssignee ? "opacity-80 bg-[var(--bg-tertiary)] cursor-not-allowed" : ""}`}
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`btn btn--primary btn--full ${isOnlyAssignee && form.status === "done" ? "bg-[#00B69B] hover:bg-[#00B69B]/90 border-[#00B69B]" : ""}`}
                >
                  {loading
                    ? "Saving…"
                    : isOnlyAssignee
                    ? form.status === "done"
                      ? "Mark Task as Completed 🎉"
                      : "Update Status"
                    : isNew
                    ? "Create Task"
                    : "Save Changes"}
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
                    <button onClick={handleAddComment} className="btn btn--icon" aria-label="Send comment">
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
                            <span className="task-modal__comment-time">{formatTimeAgo(c.createdAt)}</span>
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
