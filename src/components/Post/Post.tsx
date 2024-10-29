import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useUser } from "../../context/userContext";
import { useBase64File } from "../../hook/useBase64File";
import useComponentVisible from "../../hook/useComponentVisible";
import { useEditableTextArea } from "../../hook/useEditableTextArea";
import CommentEntity from "../../models/comment";
import { GroupEntity } from "../../models/group";
import PostEntity, { SharedPostEntity } from "../../models/post";
import {
  deleteComment,
  newComment,
  replyComment,
} from "../../services/commentService";
import { getGroupById } from "../../services/groupService";
import { likeUnlikePost } from "../../services/likeService";
import {
  postImageDownload,
  sharePost,
  updatePost,
} from "../../services/postService";
import { userImageDownload } from "../../services/userService";
import { formatDate, pastTimeFromDate } from "../../utils/formatDate";
import { fullName } from "../../utils/formatedNames";
import { calculateMaxPage, paginate } from "../../utils/paginate";
import Comment from "../Comment/Comment";
import NewComment from "../Comment/NewComment";
import DropdownItem from "../DropdownMenu/DropdownItem";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import Modal from "../Modal/Modal";
import Spinner from "../Spinner/Spinner";
import css from "./Post.module.scss";
import { initPost } from "../../utils/postUtils";

interface PostProps {
  data: PostEntity | SharedPostEntity;
  onDelete: (postId: string) => void;
  onShare: (sharedPost: SharedPostEntity) => void;
  showGroupLabel?: boolean;
}

const Post = ({
  data,
  onDelete,
  onShare,
  showGroupLabel = false,
}: PostProps) => {
  const { t } = useTranslation();
  const [post, setPost] = useState(data);
  const {
    file: postFile,
    type,
    executeRequest: postImageDownloadExecute,
    cancelRequest: postImageDownloadCancel,
  } = useBase64File(postImageDownload);
  const {
    file: postUserImage,
    executeRequest: userImageDownloadExecute,
    cancelRequest: userImageDownloadCancel,
  } = useBase64File(userImageDownload);
  const { user: currentUser } = useUser();
  const inputNewCommentRef = useRef<HTMLTextAreaElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editting, setEditting] = useState(false);
  const [editableDescription, description, resetDescription] =
    useEditableTextArea(post.description);
  const {
    refs: dropPostRefs,
    isComponentVisible: isDropPostVisible,
    setIsComponentVisible: setDropPostVisible,
  } = useComponentVisible(false);
  const [group, setGroup] = useState<GroupEntity>();

  const [pagedComments, setPagedComments] = useState<CommentEntity[]>([]);
  const [commentCount, setCommentCount] = useState(
    post.comments.reduce(
      (result, comment) => result + (comment.subComments?.length ?? 0) + 1,
      0
    )
  );
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 5;
  const MAX_PAGE = calculateMaxPage(post.comments.length, PAGE_SIZE);

  useEffect(() => {
    async function getGroup() {
      const { data } = await getGroupById(post.visibility.allowedIds[0]);
      setGroup(data);
    }

    if (post.visibility.type === "group") getGroup();
    userImageDownloadExecute(post.user.id);
    postImageDownloadExecute(
      post instanceof PostEntity ? post?.id : post.sharedPost?.id
    );

    return () => {
      userImageDownloadCancel();
      postImageDownloadCancel();
    };
  }, []);

  useEffect(() => {
    if (showComments) focusOnNewComment();
  }, [showComments]);

  useEffect(() => {
    const paged = paginate(post.comments, currentPage, PAGE_SIZE);

    const concatPages = [...pagedComments, ...paged];
    setPagedComments(concatPages);
  }, [currentPage]);

  const loadMoreComments = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handleLikePost = async () => {
    if (currentUser) {
      let { data } = await likeUnlikePost(currentUser.id, post.id);
      data = initPost(data);
      if (data instanceof PostEntity) {
        setPost(new PostEntity(data));
      } else {
        setPost(new SharedPostEntity(data));
      }
      setLiked((prev) => !prev);
    }
  };

  const handleNewComment = async (comment: CommentEntity) => {
    const { data } = await newComment(JSON.stringify(comment), post.id);
    setPagedComments([data, ...pagedComments]);
    setCommentCount((prev) => prev + 1);
  };

  const handleReplyComment = async (
    newComment: CommentEntity,
    parentCommentId: string
  ) => {
    const { data } = await replyComment(
      JSON.stringify(newComment),
      parentCommentId
    );

    const index = pagedComments.findIndex((c) => data.id === c.id);
    const copy = [...pagedComments];
    copy[index] = data;

    setPagedComments(copy);
    setCommentCount((prev) => prev + 1);
  };

  const handleDeleteComment = (comment: CommentEntity) => {
    if (comment.id) {
      if (comment.parentId) {
        pagedComments.forEach((parent) => {
          parent.subComments = parent.subComments?.filter(
            (child) => child.id != comment.id
          );
        });
        setPagedComments(pagedComments);
      } else {
        setPagedComments((prev) => prev.filter((c) => c.id !== comment.id));
      }
      setCommentCount((prev) => prev - 1);
      deleteComment(comment.id, post.id);
    }
  };

  const handleSharePost = async () => {
    if (currentUser) {
      const { data } = await sharePost(currentUser.id, post.id);
      setPost(new PostEntity(data[1]));
      onShare(new SharedPostEntity(data[0]));
    }
  };

  const isLiked = post.likes.some((like) => {
    if (currentUser) return like.userId === currentUser.id;
    return;
  });

  const [liked, setLiked] = useState(isLiked);

  const focusOnNewComment = () => {
    inputNewCommentRef?.current?.focus({ preventScroll: true });
    inputNewCommentRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  };

  const handleSaveEditting = () => {
    if (post instanceof PostEntity) {
      post.description = description;
      updatePost(post);
      setEditting(false);
    }
  };

  const handleCancelEditting = () => {
    setEditting(false);
    resetDescription();
  };

  const isPostEditable = () => {
    if (!(post instanceof PostEntity)) {
      return false;
    }
    if (post.user.id !== currentUser?.id) {
      return false;
    }
    return true;
  };

  const renderComments = () => {
    return (
      <div className={css["comments"]}>
        <NewComment
          elementRef={inputNewCommentRef}
          handleNewComment={handleNewComment}
        />
        {pagedComments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            onDelete={handleDeleteComment}
            replyComment={handleReplyComment}
          />
        ))}
        {post.comments.length > PAGE_SIZE && (
          <>
            {currentPage < MAX_PAGE && (
              <div onClick={loadMoreComments} className={css["more-comment"]}>
                {t("POST.viewMoreComments")}
              </div>
            )}
            <div onClick={focusOnNewComment} className={css["write-comment"]}>
              {t("POST.writeComment")}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderPostImage = () => {
    const jsx = (
      <div className={css["post__image"]}>
        <Spinner show={!postFile}>
          {type?.startsWith("image") ? (
            <img className={css["post__image"]} src={postFile} />
          ) : (
            <video
              controls
              controlsList="nodownload"
              className={css["post__image"]}
            >
              <source src={postFile} />
            </video>
          )}
        </Spinner>
      </div>
    );
    if (post instanceof PostEntity) {
      return post.fileName ? jsx : <></>;
    } else {
      return post.sharedPost?.fileName ? jsx : <></>;
    }
  };

  const renderPostUserImage = () => {
    return (
      <Spinner show={!postUserImage} sizeClass="size--60">
        <img className={`${css["user-image"]} size--60`} src={postUserImage} />
      </Spinner>
    );
  };

  return (
    <>
      <div className={css.post}>
        <Modal
          show={showModal}
          title={`${t("POST.modalDeletePostTitle")}`}
          description={t("POST.modalDeletePostDescription")}
          onReject={() => setShowModal(false)}
          onAccept={() => {
            onDelete(post.id);
            setShowModal(false);
          }}
        />
        <header className={css["header"]}>
          <div className={css["user"]}>
            <Link to={`/profile/${post.user.id}/posts`}>
              {renderPostUserImage()}
            </Link>
            <div>
              <Link
                to={`/profile/${post.user.id}/posts`}
                className={css["user-name"]}
              >
                {fullName(post.user)}
              </Link>
              {post instanceof SharedPostEntity && (
                <>
                  <span className="label">{t("POST.sharedPostFirstPart")}</span>
                  <Link
                    to={`/profile/${post.sharedPost.user.id}/posts`}
                    className={css["user-name"]}
                  >
                    {fullName(post.sharedPost.user)}
                  </Link>
                  <span className="label">
                    {t("POST.sharedPostSecondPart")}
                  </span>
                </>
              )}
              {showGroupLabel && group && (
                <>
                  <span className="label">{t("POST.groupPostFirstPart")}</span>
                  <Link to={`/group/${group.id}`} className={css["user-name"]}>
                    {group.name}
                  </Link>
                  <span className="label">{t("POST.groupPostSecondPart")}</span>
                </>
              )}
              <p className={css["post__past-time"]}>
                {pastTimeFromDate(post.dateCreated, t).endsWith("y")
                  ? formatDate(post.dateCreated, t("DATE.bcp47"), {
                      month: "long",
                      day: "numeric",
                    })
                  : pastTimeFromDate(post.dateCreated, t)}
                <span className={css["post-date"]}>
                  {formatDate(post.dateCreated, t("DATE.bcp47"))}
                </span>
              </p>
            </div>
          </div>
          {currentUser?.id === post.user.id && (
            <div
              ref={(element) => (dropPostRefs.current[0] = element)}
              onClick={() => setDropPostVisible((prev) => !prev)}
              className={css["post-menu__container"]}
            >
              <i className={`${css["menu-icon"]} fa-solid fa-ellipsis`}></i>
              <div className={css["post-menu"]}>
                {isDropPostVisible && (
                  <DropdownMenu>
                    <>
                      {isPostEditable() && (
                        <DropdownItem
                          onClick={() => setEditting(true)}
                          label={t("POST.editPost")}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </DropdownItem>
                      )}
                    </>
                    <DropdownItem
                      onClick={() => setShowModal(true)}
                      label={t("POST.deletePost")}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </DropdownItem>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}
        </header>
        {post instanceof SharedPostEntity ? (
          <p className={css["description"]}>{post.sharedPost.description}</p>
        ) : (
          <>
            <div className={css["description"]}>
              {editableDescription(editting)}
            </div>
            {editting && (
              <div className={css["btn-area"]}>
                <button
                  onClick={handleSaveEditting}
                  className="btn btn--primary mx-1"
                >
                  {t("POST.save")}
                </button>
                <button
                  onClick={handleCancelEditting}
                  className="btn btn--secondary"
                >
                  {t("POST.cancel")}
                </button>
              </div>
            )}
          </>
        )}
        {renderPostImage()}
        <footer className={css["footer"]}>
          <div className={css["details"]}>
            <span className={`${css["details-like"]} mx-2`}>
              {post.likes.length}
              {post.likes.length > 1
                ? ` ${t("POST.like_plural")}`
                : ` ${t("POST.like_singular")}`}
            </span>

            <div>
              <span
                onClick={() => setShowComments(true)}
                className={`${css["details-comment"]} mx-2`}
              >
                {commentCount > 1
                  ? ` ${t("POST.comment_plural", { count: commentCount })}`
                  : ` ${t("POST.comment_singular", { count: commentCount })}`}
              </span>
              {post instanceof PostEntity && (
                <span className={css["details-share"]}>
                  {`${
                    post.sharedUsersId.length < 2
                      ? t("POST.share_singular", {
                          count: post.sharedUsersId.length,
                        })
                      : t("POST.share_plural", {
                          count: post.sharedUsersId.length,
                        })
                  }`}
                </span>
              )}
            </div>
          </div>
          <div className={css["action"]}>
            <div
              onClick={handleLikePost}
              className={
                liked ? `${css["liked"]} ${css["icon"]}` : `${css["icon"]}`
              }
            >
              <i
                className={liked ? "fa-solid fa-heart" : "fa-regular fa-heart"}
              ></i>
              <span>{t("POST.like")}</span>
            </div>
            <div
              onClick={() => {
                setShowComments(true);
                showComments && focusOnNewComment();
              }}
              className={css["icon"]}
            >
              <i className="fa-regular fa-comment"></i>
              <span>{t("POST.comment")}</span>
            </div>
            <div onClick={handleSharePost} className={css["icon"]}>
              <i className="fa-solid fa-share-from-square"></i>
              <span>{t("POST.share")}</span>
            </div>
          </div>
          {showComments && renderComments()}
        </footer>
      </div>
    </>
  );
};

export default Post;
