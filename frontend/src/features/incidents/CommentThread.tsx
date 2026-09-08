import React, { useState } from 'react';
import { useAddCommentMutation } from '../../api/incidentsApi';
import type { Comment } from '../../types';

interface CommentThreadProps {
  organizationId: string;
  incidentId: string;
  comments?: Comment[];
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  organizationId,
  incidentId,
  comments = [],
}) => {
  const [addComment, { isLoading: isPosting }] = useAddCommentMutation();
  const [bodyText, setBodyText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bodyText.trim() || !organizationId) return;
    try {
      setErrorMessage(null);
      await addComment({
        organizationId,
        incidentId,
        body: bodyText,
      }).unwrap();
      setBodyText('');
    } catch (err: unknown) {
      const errorData = (err as { data?: { detail?: string } })?.data;
      setErrorMessage(errorData?.detail || 'Failed to post comment.');
    }
  };

  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-base font-semibold text-white mb-4">Internal Discussion</h3>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <textarea
          rows={3}
          required
          placeholder="Leave a comment or note for the engineering team..."
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPosting || !bodyText.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg shadow-sm transition cursor-pointer"
          >
            {isPosting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </form>

      {/* Comment List */}
      {sortedComments.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">No comments yet. Start the conversation.</p>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment: Comment) => {
            const time = comment.created_at;
            const author = comment.user?.full_name || comment.user?.email || 'Engineer';

            return (
              <div key={comment.id} className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold">
                      {author[0]?.toUpperCase() || 'E'}
                    </div>
                    <span className="text-xs font-medium text-zinc-300">{author}</span>
                  </div>
                  {time && (
                    <span className="text-xs text-zinc-500">
                      {new Date(time).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.body}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
