import Spinner from "../../components/Spinner/Spinner";
import UserProfileEntity from "../../models/userProfile";

import css from "./Profile.module.scss";
import { useEffect, useState } from "react";
import { useBase64File } from "../../hook/useBase64File";
import { userImageDownload, userImageUpload } from "../../services/userService";
import { useUser } from "../../context/userContext";
import { Link, useParams } from "react-router-dom";
import useComponentVisible from "../../hook/useComponentVisible";
import {
  acceptFriendRequest,
  createFriendRequest,
  deleteFriendRequest,
  getFriendRequestFromIds,
  isPending,
  isRequested,
  unfriend,
} from "../../services/friendService";
import DropdownMenu from "../../components/DropdownMenu/DropdownMenu";
import DropdownItem from "../../components/DropdownMenu/DropdownItem";
import { useTranslation } from "react-i18next";
import Modal from "../../components/Modal/Modal";
import { useStompContext } from "../../context/stompContext";
import LoadingContainer from "../../components/LoadingContainer/LoadingContainer";
import { fullName } from "../../utils/formatedNames";

interface ProfileUserSectionProps {
  user: UserProfileEntity;
  setUser: (user: UserProfileEntity) => void;
}

const ProfileUserSection = ({ user, setUser }: ProfileUserSectionProps) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const { user: currentUser, setUser: setCurrentUser } = useUser();
  const {
    file: userImage,
    executeRequest: userImageDownloadExecute,
    cancelRequest: userImageDownloadCancel,
    clearImage: userImageDownloadClear,
  } = useBase64File(userImageDownload);
  const [requested, setRequested] = useState(false);
  const [pending, setPending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const {
    sendNotification,
    sendNewRequest,
    sendRemovedRequest,
    sendNewFriend,
    sendRemovedFriend,
    receivedNewRequest,
    receivedRemovedRequest,
    receivedRemovedFriend,
  } = useStompContext();

  const {
    refs: dropFriendRefs,
    isComponentVisible: isDropFriendVisible,
    setIsComponentVisible: setDropFriendVisible,
  } = useComponentVisible(false);

  useEffect(() => {
    return () => {
      userImageDownloadCancel();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    userImageDownloadClear();
  }, [id]);

  useEffect(() => {
    async function initialize() {
      if (currentUser) {
        userImageDownloadExecute(user.id);
        setLoading(false);
        setRequested(await isRequested(currentUser.id, user.id));
        setPending(await isPending(user.id, currentUser.id));
      }
    }
    initialize();
  }, [user]);

  useEffect(() => {
    if (receivedRemovedFriend?.friend.id === user.id) {
      setRequested(false);
      setPending(false);
    }
  }, [receivedRemovedFriend]);

  useEffect(() => {
    if (receivedNewRequest?.requestingUserId === user.id) {
      setPending(true);
    }
  }, [receivedNewRequest]);

  useEffect(() => {
    if (receivedRemovedRequest?.requestingUserId === user.id) {
      setPending(false);
    }
  }, [receivedRemovedRequest]);

  const handleCancelRequest = async () => {
    if (currentUser && user && sendRemovedRequest) {
      const { data } = await getFriendRequestFromIds(user.id, currentUser.id);
      deleteFriendRequest(data);
      setRequested(false);
      sendRemovedRequest(data);
    }
  };

  const handleAddFriend = async () => {
    if (currentUser && user && sendNotification && sendNewRequest) {
      const { data } = await createFriendRequest({
        requestingUserId: currentUser.id,
        targetUserId: user.id,
      });
      sendNotification(data[1]);
      sendNewRequest(data[0]);
      setRequested(true);
    }
  };

  const handleConfirm = async () => {
    if (
      currentUser &&
      setCurrentUser &&
      user &&
      sendNotification &&
      sendNewFriend
    ) {
      const { data } = await getFriendRequestFromIds(currentUser.id, user.id);
      const returnData = await acceptFriendRequest(data);
      setPending(false);
      setCurrentUser(new UserProfileEntity(returnData[1]));
      setUser(new UserProfileEntity(returnData[0]));
      sendNotification(returnData[2]);
      sendNewFriend({ targetUserId: user.id, friend: currentUser });
    }
  };

  const handleUnfriend = async () => {
    if (currentUser && user && setCurrentUser && sendRemovedFriend) {
      const modifieUsers = await unfriend(currentUser, user);
      setCurrentUser(new UserProfileEntity(modifieUsers[0]));
      setUser(new UserProfileEntity(modifieUsers[1]));
      sendRemovedFriend({ targetUserId: user.id, friend: currentUser });
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    if (user) {
      const formData = new FormData();
      if (e.target instanceof HTMLInputElement)
        if (e?.target?.files && setCurrentUser) {
          formData.append("file", e.target.files[0]);
          formData.append("userId", user.id);
          const data = await userImageUpload(formData);
          setUser(data);
          userImageDownloadExecute(data.id);
          setCurrentUser(data);
        }
    }
  };

  const renderButton = () => {
    if (currentUser?.id === user.id) return;

    if (user && currentUser?.friends.includes(user.id)) {
      return (
        <div
          ref={(element) => (dropFriendRefs.current[0] = element)}
          className={css["dropdown-friend-menu"]}
        >
          <button
            onClick={() => setDropFriendVisible((prev) => !prev)}
            className="btn btn--primary"
          >
            <i className="fa-solid fa-user-check"></i>
            {t("PROFILE.friend")}
          </button>
          {isDropFriendVisible && (
            <DropdownMenu>
              <DropdownItem
                onClick={() => setShowModal(true)}
                label={t("PROFILE.unfriend")}
              >
                <i className="fa-solid fa-user-xmark"></i>
              </DropdownItem>
            </DropdownMenu>
          )}
        </div>
      );
    }
    if (requested) {
      return (
        <button
          onClick={() => handleCancelRequest()}
          className="btn btn--secondary"
        >
          {t("PROFILE.cancelRequest")}
        </button>
      );
    }
    if (pending) {
      return (
        <button onClick={() => handleConfirm()} className="btn btn--primary">
          {t("PROFILE.confirmRequest")}
        </button>
      );
    }

    return (
      <button onClick={() => handleAddFriend()} className="btn btn--primary">
        {t("PROFILE.addFriend")}
      </button>
    );
  };

  const renderUserImageSection = () => {
    return (
      <Spinner show={!userImage} sizeClass="size--168">
        <>
          <Modal
            show={showModal}
            title={`${t("PROFILE.modalUnfriendTitle")}`}
            description={t("PROFILE.modalUnfriendDescription", {
              fullName: fullName(user),
            })}
            onReject={() => setShowModal(false)}
            onAccept={() => {
              handleUnfriend();
              setShowModal(false);
            }}
          />
          <img className={css["profile-user__image"]} src={user && userImage} />
          {currentUser?.id === user?.id && (
            <div className={css["change-icon__container"]}>
              <label className={css["change-icon"]} htmlFor="upload-image">
                <div>
                  <i className="fa-solid fa-camera fa-xl"></i>
                </div>
                <input
                  id="upload-image"
                  type="file"
                  accept=".png,.jpeg,.jpg"
                  onChange={(e) => {
                    userImageDownloadClear();
                    handleUploadImage(e);
                  }}
                />
              </label>
            </div>
          )}
        </>
      </Spinner>
    );
  };

  return (
    <>
      {renderUserImageSection()}
      {loading ? (
        <LoadingContainer showBackground={false} labelSize="medium" />
      ) : (
        <div className={css["profile-user__details"]}>
          <div className={css["profile-user__info"]}>
            <span className={css["profile-user__name"]}>{fullName(user)}</span>
            <Link
              to={`/profile/${user.id}/friends`}
              className={css["profile-user__friends-qty"]}
            >
              {user && user.friendCount <= 1
                ? t("PROFILE.friend_singular", { count: user.friendCount })
                : t("PROFILE.friend_plural", { count: user.friendCount })}
            </Link>
          </div>
          <div className={css["profile-user__buttons-area"]}>
            {renderButton()}
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileUserSection;
