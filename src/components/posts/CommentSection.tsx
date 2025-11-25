/* eslint-disable @next/next/no-img-element */
"use client";

import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
  };
  likeCount: number;
  isLiked: boolean;
  likedBy: Array<{ id: string; email: string }>;
  replies: Reply[];
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
  };
  likeCount: number;
  isLiked: boolean;
  likedBy: Array<{ id: string; email: string }>;
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: () => void;
}

export function CommentSection({
  postId,
  comments: initialComments,
  onCommentAdded,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Sync comments with prop changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Fetch comments when user wants to show them
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();
      if (response.ok) {
        setComments(data.comments || []);
        setShowComments(true);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await response.json();

      if (response.ok) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
        setShowComments(true); // Show comments after adding
        onCommentAdded();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (
    commentId: string,
    currentLiked: boolean
  ) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              const newIsLiked = !currentLiked;
              return {
                ...comment,
                isLiked: newIsLiked,
                likeCount: newIsLiked
                  ? comment.likeCount + 1
                  : comment.likeCount - 1,
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleLikeReply = async (
    commentId: string,
    replyId: string,
    currentLiked: boolean
  ) => {
    try {
      const response = await fetch(`/api/replies/${replyId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: comment.replies.map((reply) => {
                  if (reply.id === replyId) {
                    const newIsLiked = !currentLiked;
                    return {
                      ...reply,
                      isLiked: newIsLiked,
                      likeCount: newIsLiked
                        ? reply.likeCount + 1
                        : reply.likeCount - 1,
                    };
                  }
                  return reply;
                }),
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling reply like:", error);
    }
  };

  const handleAddReply = async (commentId: string, replyContent: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: replyContent }),
      });

      const data = await response.json();

      if (response.ok) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...comment.replies, data.reply],
              };
            }
            return comment;
          })
        );
        onCommentAdded();
      }
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  return (
    <div className="_feed_inner_timeline_comment_section">
      <div className="_feed_inner_timeline_comment_input _padd_r24 _padd_l24 _mar_b16">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            disabled={isSubmitting}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      <button
        className="btn btn-link _padd_r24 _padd_l24 _mar_b16"
        onClick={() => {
          if (showComments) {
            setShowComments(false);
          } else {
            fetchComments();
          }
        }}
        disabled={isLoadingComments}
      >
        {isLoadingComments ? "Loading..." : showComments ? "Hide" : "Show"}{" "}
        {comments.length > 0 && `${comments.length} `}comment
        {comments.length !== 1 ? "s" : ""}
      </button>

      {showComments && comments.length > 0 && (
        <div className="_feed_inner_timeline_comments _padd_r24 _padd_l24">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={() => handleLikeComment(comment.id, comment.isLiked)}
              onReply={(content) => handleAddReply(comment.id, content)}
              onLikeReply={(replyId, currentLiked) =>
                handleLikeReply(comment.id, replyId, currentLiked)
              }
            />
          ))}
        </div>
      )}
      {showComments && comments.length === 0 && !isLoadingComments && (
        <div className="_padd_r24 _padd_l24 _mar_b16">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onLike,
  onReply,
  onLikeReply,
}: {
  comment: Comment;
  onLike: () => void;
  onReply: (content: string) => void;
  onLikeReply: (replyId: string, currentLiked: boolean) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const authorName = comment.author.email.split("@")[0];
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent);
      setReplyContent("");
      setIsReplying(false);
      setShowReplies(true);
    }
  };

  return (
    <div className="_feed_comment_item _mar_b16">
      <div className="_feed_comment_header">
        <strong>{authorName}</strong>
        <span className="_feed_comment_time">{timeAgo}</span>
      </div>
      <p className="_feed_comment_content">{comment.content}</p>
      <div className="_feed_comment_actions">
        <button
          className={`btn btn-sm btn-link ${
            comment.isLiked ? "text-primary" : ""
          }`}
          onClick={onLike}
        >
          {comment.isLiked ? "Liked" : "Like"} ({comment.likeCount})
        </button>
        {comment.likedBy.length > 0 && (
          <span className="_feed_liked_by">
            Liked by:{" "}
            {comment.likedBy.map((u) => u.email.split("@")[0]).join(", ")}
          </span>
        )}
        <button
          className="btn btn-sm btn-link"
          onClick={() => setIsReplying(!isReplying)}
        >
          Reply
        </button>
        {comment.replies.length > 0 && (
          <button
            className="btn btn-sm btn-link"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? "Hide" : "Show"} {comment.replies.length} reply
            {comment.replies.length !== 1 ? "ies" : ""}
          </button>
        )}
      </div>

      {isReplying && (
        <div className="_feed_reply_input _mar_t8">
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control"
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={handleReply}
              disabled={!replyContent.trim()}
            >
              Reply
            </button>
          </div>
        </div>
      )}

      {showReplies && comment.replies.length > 0 && (
        <div className="_feed_replies _mar_t8 _padd_l16">
          {comment.replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              onLike={() => onLikeReply(reply.id, reply.isLiked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReplyItem({ reply, onLike }: { reply: Reply; onLike: () => void }) {
  const authorName = reply.author.email.split("@")[0];
  const timeAgo = formatDistanceToNow(new Date(reply.createdAt), {
    addSuffix: true,
  });

  return (
    <div className="_feed_reply_item _mar_b8">
      <div className="_feed_reply_header">
        <strong>{authorName}</strong>
        <span className="_feed_reply_time">{timeAgo}</span>
      </div>
      <p className="_feed_reply_content">{reply.content}</p>
      <div className="_feed_reply_actions">
        <button
          className={`btn btn-sm btn-link ${
            reply.isLiked ? "text-primary" : ""
          }`}
          onClick={onLike}
        >
          {reply.isLiked ? "Liked" : "Like"} ({reply.likeCount})
        </button>
        {reply.likedBy.length > 0 && (
          <span className="_feed_liked_by">
            Liked by:{" "}
            {reply.likedBy.map((u) => u.email.split("@")[0]).join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}
