import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { addComment, editComment, deleteComment } from '../../store/tasksSlice';
import { addToast } from '../../store/toastSlice';
import { canComment, canDeleteComment, roleAtLeast } from '../../utils/permissions';
import ConfirmDialog from '../common/ConfirmDialog';

const SIMULATED_LINES = [
  "Just checked this — looks good so far!",
  "Any update on this one?",
  "I'll pick this up after lunch.",
  "This might be blocked on the API changes.",
  "👍 agreed, moving forward with this.",
  "Can we sync on this tomorrow?",
  "Nice progress here.",
];

const LIVE_INTERVAL_MS = 20000;
const LIVE_CHANCE = 0.45;

function renderWithMentions(text, projectMembers) {
  const members = projectMembers || []; // SAFE FALLBACK
  const names = members.map((u) => `${u.firstName} ${u.lastName}`);
  if (names.length === 0) return text;

  const pattern = new RegExp(`@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <span key={match.index} className="mention-tag">
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function TaskComments({ task, projectMembers, currentUser, focusedCommentId = null }) {
  const dispatch = useDispatch();
  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState(null);

  const textareaRef = useRef(null);
  const commentRefs = useRef({});

  // SAFE FALLBACKS for undefined data
  const members = projectMembers || [];
  const comments = task?.comments || [];

  const canPost = canComment(currentUser);
  const isOwnerOrAdmin = roleAtLeast(currentUser, 'Admin');

  // Scroll to and highlight focused comment from activity feed
  useEffect(() => {
    if (!focusedCommentId) return;
    const timer = setTimeout(() => {
      const element = commentRefs.current[focusedCommentId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('focused-comment-pulse');
        const clearPulse = setTimeout(() => {
          element.classList.remove('focused-comment-pulse');
        }, 3500);
        return () => clearTimeout(clearPulse);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [focusedCommentId, comments.length]);

  // Simulated live collaborator updates
  useEffect(() => {
    const others = members.filter((u) => u.id !== currentUser?.id);
    if (others.length === 0) return;

    const timer = setInterval(() => {
      if (Math.random() > LIVE_CHANCE) return;
      const author = others[Math.floor(Math.random() * others.length)];
      const line = SIMULATED_LINES[Math.floor(Math.random() * SIMULATED_LINES.length)];
      dispatch(addComment({ taskId: task.id, authorId: author.id, text: line, simulated: true }));
    }, LIVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [task.id, members, currentUser?.id, dispatch]);

  const mentionMatches =
    mentionQuery === null
      ? []
      : members.filter((u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
        );

  const handleTextChange = (e) => {
    if (!canPost) return;
    const value = e.target.value;
    setText(value);

    const cursor = e.target.selectionStart;
    const uptoCursor = value.slice(0, cursor);
    const atIndex = uptoCursor.lastIndexOf('@');

    if (atIndex !== -1 && !/\s/.test(uptoCursor.slice(atIndex + 1))) {
      setMentionQuery(uptoCursor.slice(atIndex + 1));
    } else {
      setMentionQuery(null);
    }
  };

  const handlePickMention = (user) => {
    if (!canPost) return;
    const cursor = textareaRef.current?.selectionStart ?? text.length;
    const uptoCursor = text.slice(0, cursor);
    const atIndex = uptoCursor.lastIndexOf('@');
    const before = text.slice(0, atIndex);
    const after = text.slice(cursor);
    const inserted = `${before}@${user.firstName} ${user.lastName} ${after}`;
    setText(inserted);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const extractMentionedIds = (value) => {
    const names = members.map((u) => ({ id: u.id, full: `${u.firstName} ${u.lastName}` }));
    return names.filter((n) => value.includes(`@${n.full}`)).map((n) => n.id);
  };

  const handleSubmit = () => {
    if (!canPost || !text.trim() || !currentUser) return;
    dispatch(
      addComment({
        taskId: task.id,
        authorId: currentUser.id,
        text,
        mentionedUserIds: extractMentionedIds(text),
      })
    );
    setText('');
    setMentionQuery(null);
  };

  const startEdit = (comment) => {
    if (!canPost) return;
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const saveEdit = (commentId) => {
    if (!canPost) return;
    dispatch(editComment({ taskId: task.id, commentId, text: editText }));
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (!commentToDelete) return;
    dispatch(deleteComment({ taskId: task.id, commentId: commentToDelete.id }));
    dispatch(addToast({ message: 'Comment removed', type: 'info' }));
    setCommentToDelete(null);
  };

  const findAuthor = (authorId) =>
    members.find((u) => u.id === authorId) ||
    (authorId === currentUser?.id ? currentUser : null);

  return (
    <div>
      <div className="comments-live-indicator">
        <span className="live-dot" />
        Live &mdash; simulated collaborator updates while this task is open
      </div>

      <div className="comment-list">
        {comments.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>No comments yet.</p>
        )}
        {comments.map((c, index) => {
          const author = findAuthor(c.authorId);
          const isOwn = c.authorId === currentUser?.id;
          const isEditing = editingId === c.id;
          const canDelete = canDeleteComment(currentUser, c);
          const isFocused = focusedCommentId === c.id;

          return (
            <div
              // FIX: Added index to key to prevent "Duplicate Key" crashes from mock data
              key={`${c.id}-${index}`}
              ref={(element) => {
                commentRefs.current[c.id] = element;
              }}
              className={`comment-item ${isFocused ? 'focused-comment' : ''}`}
              tabIndex={isFocused ? -1 : undefined}
            >
              <div className="avatar-sm" style={{ background: 'var(--accent-blue)' }}>
                {author ? `${author.firstName[0]}${author.lastName[0]}` : '?'}
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">
                    {author ? `${author.firstName} ${author.lastName}` : 'Unknown'}
                  </span>
                  <span className="comment-time">
                    {/* FIX: Safe date parsing */}
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Unknown date'}
                    {c.editedAt && ' (edited)'}
                  </span>
                  {c.simulated && <span className="comment-simulated-badge">live</span>}
                  {isFocused && <span className="comment-focused-badge">Highlighted</span>}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <input
                      className="auth-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)}
                      autoFocus
                    />
                    <button type="button" className="subtask-action-btn" onClick={() => saveEdit(c.id)}>
                      <Check />
                    </button>
                    <button type="button" className="subtask-action-btn" onClick={() => setEditingId(null)}>
                      <X />
                    </button>
                  </div>
                ) : (
                  <p className="comment-text">{renderWithMentions(c.text, members)}</p>
                )}

                {/* Comment Actions */}
                {!isEditing && (
                  <div className="comment-actions">
                    {isOwn && canPost && !c.simulated && (
                      <button type="button" onClick={() => startEdit(c)}>
                        <Pencil />
                        Edit
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className={`comment-delete-btn ${isOwnerOrAdmin && !isOwn ? 'mod-delete-btn' : ''}`}
                        onClick={() => setCommentToDelete(c)}
                        title={isOwnerOrAdmin && !isOwn ? 'Moderate/Delete comment as Admin/Owner' : 'Delete comment'}
                      >
                        <Trash2 />
                        {isOwnerOrAdmin && !isOwn ? 'Delete comment (Admin)' : 'Delete'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canPost ? (
        <div className="comment-composer">
          <textarea
            ref={textareaRef}
            className="auth-input"
            placeholder="Write a comment... use @ to mention someone"
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={2}
          />
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className="mention-dropdown">
              {mentionMatches.map((u) => (
                <button key={u.id} type="button" onClick={() => handlePickMention(u)}>
                  <span
                    className="avatar-sm"
                    style={{ width: 20, height: 20, fontSize: 9, background: 'var(--accent-blue)' }}
                  >
                    {u.firstName[0]}
                    {u.lastName[0]}
                  </span>
                  {u.firstName} {u.lastName}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            <Send />
            Comment
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 12 }}>
          Viewing as {currentUser?.role || 'Viewer'} - comments are read-only.
        </p>
      )}

      <ConfirmDialog
        isOpen={!!commentToDelete}
        title="Delete Comment?"
        message="Are you sure you want to remove this comment from the task discussion?"
        confirmText="Delete Comment"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
}