/* eslint-disable @next/next/no-img-element */
"use client";

import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
  post: {
    id: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: string;
    author: {
      id: string;
      email: string;
    };
    likeCount: number;
    isLiked: boolean;
    likedBy: Array<{ id: string; email: string }>;
  };
  onCommentAdded?: () => void;
}

export function PostCard({ post, onCommentAdded }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isToggling, setIsToggling] = useState(false);
  const [comments, setComments] = useState<
    Array<{
      id: string;
      content: string;
      createdAt: string;
      author: { id: string; email: string };
      likeCount: number;
      isLiked: boolean;
      likedBy: Array<{ id: string; email: string }>;
      replies: Array<{
        id: string;
        content: string;
        createdAt: string;
        author: { id: string; email: string };
        likeCount: number;
        isLiked: boolean;
        likedBy: Array<{ id: string; email: string }>;
      }>;
    }>
  >([]);
  const [showLikedBy, setShowLikedBy] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      const data = await response.json();
      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const handleCommentAdded = () => {
    fetchComments();
    onCommentAdded?.();
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  const authorName = post.author.email.split("@")[0];

  const handleLikeToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);
    const previousLiked = isLiked;
    const previousCount = likeCount;

    setIsLiked(!previousLiked);
    setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLiked(previousLiked);
        setLikeCount(previousCount);
        throw new Error(data.message || "Failed to toggle like");
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      console.error("Error toggling like:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <img src="/images/post_img.png" alt="" className="_post_img" />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {authorName}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo} .<a href="#0">Public</a>
              </p>
            </div>
          </div>
          <div className="_feed_inner_timeline_post_box_dropdown">
            <div className="_feed_timeline_post_dropdown">
              <a
                href="/profile"
                id="_timeline_show_drop_btn"
                className="_feed_timeline_post_dropdown_link"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="4"
                  height="17"
                  fill="none"
                  viewBox="0 0 4 17"
                >
                  <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        {post.content && (
          <h4 className="_feed_inner_timeline_post_title">{post.content}</h4>
        )}
        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            <img src={post.imageUrl} alt="Post" className="_time_img" />
          </div>
        )}
      </div>
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image">
          <img
            src="/images/react_img1.png"
            alt="Image"
            className="_react_img1"
          />
          <img
            src="/images/react_img2.png"
            alt="Image"
            className="_react_img"
          />
          <img
            src="/images/react_img3.png"
            alt="Image"
            className="_react_img _rect_img_mbl_none"
          />
          <img
            src="/images/react_img4.png"
            alt="Image"
            className="_react_img _rect_img_mbl_none"
          />
          <img
            src="/images/react_img5.png"
            alt="Image"
            className="_react_img _rect_img_mbl_none"
          />
          <p className="_feed_inner_timeline_total_reacts_para">
            {likeCount > 0 ? (
              <button
                className="btn btn-link p-0"
                onClick={() => setShowLikedBy(!showLikedBy)}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {likeCount}+
              </button>
            ) : (
              "0+"
            )}
          </p>
        </div>
        {showLikedBy && post.likedBy.length > 0 && (
          <div className="_feed_liked_by_popup _padd_r24 _padd_l24 _mar_b8">
            <strong>Liked by:</strong>{" "}
            {post.likedBy.map((u) => u.email.split("@")[0]).join(", ")}
          </div>
        )}
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <a href="#0">
              <span>{comments.length}</span> Comment
              {comments.length !== 1 ? "s" : ""}
            </a>
          </p>
          <p className="_feed_inner_timeline_total_reacts_para2">
            <span>0</span> Share
          </p>
        </div>
      </div>
      <div className="_feed_inner_timeline_reaction">
        <button
          className={`_feed_inner_timeline_reaction_emoji _feed_reaction ${
            isLiked ? "_feed_reaction_active" : ""
          }`}
          onClick={handleLikeToggle}
          disabled={isToggling}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                fill="none"
                viewBox="0 0 19 19"
              >
                <path
                  fill="#FFCC4D"
                  d="M9.5 19a9.5 9.5 0 100-19 9.5 9.5 0 000 19z"
                />
                <path
                  fill="#664500"
                  d="M9.5 11.083c-1.912 0-3.181-.222-4.75-.527-.358-.07-1.056 0-1.056 1.055 0 2.111 2.425 4.75 5.806 4.75 3.38 0 5.805-2.639 5.805-4.75 0-1.055-.697-1.125-1.055-1.055-1.57.305-2.838.527-4.75.527z"
                />
                <path
                  fill="#fff"
                  d="M4.75 11.611s1.583.528 4.75.528 4.75-.528 4.75-.528-1.056 2.111-4.75 2.111-4.75-2.11-4.75-2.11z"
                />
                <path
                  fill="#664500"
                  d="M6.333 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847zM12.667 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847z"
                />
              </svg>
              {isLiked ? "Liked" : "Like"}
            </span>
          </span>
        </button>
        <button className="_feed_inner_timeline_reaction_comment _feed_reaction">
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg
                className="_reaction_svg"
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                fill="none"
                viewBox="0 0 21 21"
              >
                <path
                  stroke="#000"
                  d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z"
                />
              </svg>
            </span>
            Comment
          </span>
        </button>
        <button className="_feed_inner_timeline_reaction_share _feed_reaction">
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg
                className="_reaction_svg"
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                fill="none"
                viewBox="0 0 21 21"
              >
                <path
                  stroke="#000"
                  d="M14.5 7.5l-3-3m3 3l-3 3m3-3H10a4.5 4.5 0 000 9h1.5m-6-9l3-3m-3 3l3 3m-3-3H11a4.5 4.5 0 010 9H9.5"
                />
              </svg>
            </span>
            Share
          </span>
        </button>
      </div>
      <CommentSection
        postId={post.id}
        comments={comments}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
}
