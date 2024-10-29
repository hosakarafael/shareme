import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useUser } from "../../context/userContext";
import { useBase64File } from "../../hook/useBase64File";
import useComponentVisible from "../../hook/useComponentVisible";
import { useEditableText } from "../../hook/useEditableText";
import CommentEntity from "../../models/comment";
import UserProfileEntity from "../../models/userProfile";
import { updateComment } from "../../services/commentService";
import { likeUnlikeComment } from "../../services/likeService";
import { getUserById, userImageDownload } from "../../services/userService";
import { formatDate, pastTimeFromDate } from "../../utils/formatDate";
import { fullName } from "../../utils/formatedNames";
import DropdownItem from "../DropdownMenu/DropdownItem";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import Modal from "../Modal/Modal";
import Spinner from "../Spinner/Spinner";

import css from "./Comment.module.scss";
import NewComment from "./NewComment";

interface CommentProps {
  comment: CommentEntity;
  onDelete: (comment: CommentEntity, parentId?: string) => void;
  replyComment?: (newComment: CommentEntity, parentCommentId: string) => void;
}

function Comment({ comment, onDelete, replyComment }: CommentProps) {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserProfileEntity>();
  const {
    file: commentUserImage,
    executeRequest: userImageDownloadExecute,
    cancelRequest: userImageDownloadCancel,
  } = useBase64File(userImageDownload);
  const { user: currentUser } = useUser();
  const newCommentRef = useRef<HTMLTextAreaElement>(null);
  const [showNewComment, setShowNewComment] = useState(false);
  const [showSubComments, setShowSubComments] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editting, setEditting] = useState(false);
  const [editableDescription, description, resetDescription] = useEditableText(
    comment.description
  );
  const [likeCount, setLikeCount] = useState(0);

  const isLiked = comment.likes?.some((like) => {
    if (currentUser) return like.userId === currentUser.id;
    return;
  });

  const [liked, setLiked] = useState(isLiked);
  const {
    refs: dropCommentRefs,
    isComponentVisible: isDropCommentVisible,
    setIsComponentVisible: setDropCommentVisible,
  } = useComponentVisible(false);

  useEffect(() => {
    async function getUser() {
      setUser(await getUserById(comment.userId));
    }
    getUser();
    userImageDownloadExecute(comment.userId);

    return () => {
      userImageDownloadCancel();
    };
  }, []);

  useEffect(() => {
    if (showNewComment) focusOnNewComment();
  }, [showNewComment]);

  useEffect(() => {
    if (comment.likes) {
      setLikeCount(comment.likes.length);
    }
  }, [user]);

  const handleLikeComment = async () => {
    if (currentUser) {
      await likeUnlikeComment(currentUser.id, comment.id as string);
      setLiked((prev) => !prev);
      if (liked) {
        setLikeCount((prev) => prev - 1);
      } else {
        setLikeCount((prev) => prev + 1);
      }
    }
  };

  const focusOnNewComment = () => {
    newCommentRef?.current?.focus({ preventScroll: true });
    newCommentRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  };

  const handleNewComment = async (newComment: CommentEntity) => {
    if (replyComment && comment.id) replyComment(newComment, comment.id);
  };

  const handleSaveEditting = () => {
    comment.description = description;
    updateComment(comment);
    setEditting(false);
  };

  const handleCancelEditting = () => {
    setEditting(false);
    resetDescription();
  };

  return (
    <div className={css["comment__container"]}>
      <Modal
        show={showModal}
        title={t("COMMENT.modalDeleteCommentTitle")}
        description={t("COMMENT.modalDeleteCommentDescription")}
        onReject={() => setShowModal(false)}
        onAccept={() => {
          onDelete(comment);
          setShowModal(false);
        }}
      />
      <Link to={`/profile/${user?.id}/posts`}>
        <Spinner show={!commentUserImage} sizeClass="size--40">
          <img
            className={`${css["comment__user"]} size--40`}
            src={commentUserImage}
          />
        </Spinner>
      </Link>
      <div>
        <div className={css["comment"]}>
          <div className={`${css["comment__body"]} p1`}>
            <Link
              className={css["comment__user-name"]}
              to={`/profile/${user?.id}/posts`}
            >
              {user && `${fullName(user)}`}
            </Link>
            <span className={css["comment__description"]}>
              {editableDescription(editting)}
            </span>
          </div>
          {editting ? (
            <div className={css["editting-btn"]}>
              <button onClick={handleSaveEditting} className="btn btn--primary">
                {t("COMMENT.save")}
              </button>
              <button
                onClick={handleCancelEditting}
                className="btn btn--secondary"
              >
                {t("COMMENT.cancel")}
              </button>
            </div>
          ) : (
            <div
              ref={(element) => (dropCommentRefs.current[0] = element)}
              onClick={() => setDropCommentVisible((prev) => !prev)}
              className={css["comment-menu__container"]}
            >
              <i className={`${css["menu-icon"]} fa-solid fa-ellipsis`}></i>
              <div className={css["comment-menu"]}>
                {isDropCommentVisible && (
                  <DropdownMenu>
                    <>
                      {comment.userId === currentUser?.id && (
                        <DropdownItem
                          onClick={() => setEditting(true)}
                          label={t("COMMENT.editComment")}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </DropdownItem>
                      )}
                    </>
                    <DropdownItem
                      onClick={() => setShowModal(true)}
                      label={t("COMMENT.deleteComment")}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </DropdownItem>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={css["comment-action"]}>
          <div
            onClick={handleLikeComment}
            className={`${css["comment-action__like"]} ${
              liked ? css["liked"] : ""
            }`}
          >
            {` ${t("COMMENT.like")}`}
          </div>
          {comment.subComments && (
            <div
              onClick={() => {
                setShowSubComments(true);
                setShowNewComment(true);
                focusOnNewComment();
              }}
              className={css["comment-action__reply"]}
            >
              {t("COMMENT.reply")}
            </div>
          )}
          <div className={`${css["comment-action__total_like"]}`}>
            {likeCount > 1
              ? ` ${t("COMMENT.like_plural", {
                  count: likeCount,
                })}`
              : ` ${t("COMMENT.like_singular", {
                  count: likeCount,
                })}`}
          </div>
          <span className={css["comment__past-time"]}>
            {pastTimeFromDate(comment.dateCreated!, t)}
            <span className={css["comment__date"]}>
              {formatDate(comment.dateCreated!, t("DATE.bcp47"))}
            </span>
          </span>
        </div>
        {showSubComments
          ? comment.subComments?.map((subComment) => (
              <Comment
                key={subComment.id}
                comment={subComment}
                onDelete={() => onDelete(subComment, subComment.parentId)}
              />
            ))
          : comment.subComments &&
            comment.subComments.length !== 0 && (
              <div
                className={css["reply-icon__container"]}
                onClick={() => setShowSubComments(true)}
              >
                <i
                  className={`${css["reply-icon"]} fa-solid fa-arrow-turn-up`}
                ></i>
                {comment.subComments.length === 1
                  ? t("COMMENT.reply_single", {
                      count: comment.subComments.length,
                    })
                  : t("COMMENT.reply_plural", {
                      count: comment.subComments.length,
                    })}
              </div>
            )}
        {comment.subComments && showNewComment && (
          <NewComment
            handleNewComment={handleNewComment}
            elementRef={newCommentRef}
          />
        )}
      </div>
    </div>
  );
}

export default Comment;
