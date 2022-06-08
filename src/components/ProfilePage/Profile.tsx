import React, { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  getUserById,
  userImageDownload,
  userImageUpload,
} from "../../services/userService";
import { useBase64Image } from "../../hook/useBase64Image";
import Spinner from "../Spinner/Spinner";
import { useUser } from "../../context/userContext";
import { isPending, isRequested } from "../../services/friendService";
import UserProfileEntity from "../../models/userProfile";
import css from "./Profile.module.scss";
import _ from "lodash";

function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState<UserProfileEntity>();
  const { user: currentUser, setUser: setCurrentUser } = useUser();

  const [requested, setRequested] = useState(false);
  const [pending, setPending] = useState(false);

  const { image: userImage, setService } = useBase64Image(null);

  const menu = [
    { key: "posts", value: "Posts" },
    { key: "friends", value: "Friends" },
    { key: "photos", value: "Photos" },
    { key: "videos", value: "Videos" },
  ];

  const navigate = useNavigate();

  useEffect(() => {
    async function getUser(id: string) {
      try {
        if (currentUser) {
          const data = await getUserById(id);
          setUser(data);
          setService(userImageDownload(data.id));
          setRequested(await isRequested(currentUser.id, id));
          setPending(await isPending(id, currentUser.id));
        }
      } catch (ex: any) {
        if (ex.response && ex.response.status === 404) {
          navigate("/notfound");
        }
      }
    }
    if (id) {
      getUser(id);
    }
  }, [id]);

  const handleUploadImage = async (e: React.FormEvent) => {
    if (user) {
      const formData = new FormData();
      if (e.target instanceof HTMLInputElement)
        if (e?.target?.files && setCurrentUser) {
          formData.append("file", e.target.files[0]);
          formData.append("userId", user.id);
          const data = await userImageUpload(formData);
          setUser(data);
          setService(userImageDownload(data.id));
          setCurrentUser(data);
        }
    }
  };

  const renderButton = () => {
    if (currentUser?.id === id) return;
    if (requested) {
      return <button className="btn btn--green">Cancel request</button>;
    }
    if (pending) {
      return <button className="btn btn--green">Confirm request</button>;
    }

    return <button className="btn btn--green">Add Friend</button>;
  };

  const renderMenu = () => {
    return menu.map((option) => {
      return (
        <NavLink
          key={option.key}
          to={option.key}
          className={({ isActive }) =>
            isActive
              ? `${css["profile-option"]} ${css["active"]}`
              : css["profile-option"]
          }
        >
          {option.value}
        </NavLink>
      );
    });
  };

  return (
    <>
      <div className={css["profile__background"]}></div>
      <main className="container center">
        <div className={css["background-image__container"]}>
          <img
            className={css["background-image"]}
            src={process.env.PUBLIC_URL + "/images/bg.jpeg"}
          />
        </div>
        <div className={css["profile__header"]}>
          <div className={css["profile-user"]}>
            <Spinner
              show={!userImage}
              sizeClass="size--168"
              fragment={
                <>
                  <img
                    className={css["profile-user__image"]}
                    src={user && userImage}
                  />
                  {currentUser?.id === user?.id && (
                    <div className={css["change-icon__container"]}>
                      <label htmlFor="upload-image">
                        <div className={css["change-icon"]}>
                          <i className="fa-solid fa-camera fa-xl"></i>
                        </div>
                        <input
                          id="upload-image"
                          type="file"
                          accept=".png,.jpeg,.jpg"
                          onChange={(e) => {
                            setService(null);
                            handleUploadImage(e);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </>
              }
            />

            <div className={css["profile-user__details"]}>
              <div className={css["profile-user__info"]}>
                <span className={css["profile-user__name"]}>
                  {user?.fullName}
                </span>
                <Link to="friends" className={css["profile-user__friends-qty"]}>
                  {user && user.friendCount <= 1
                    ? `${user?.friendCount} friend`
                    : `${user?.friendCount} friends`}
                </Link>
              </div>
              <div className={css["profile-user__buttons-area"]}>
                {renderButton()}
              </div>
            </div>
          </div>
        </div>
        <div className={css["profile-options__container"]}>{renderMenu()}</div>
        <div>
          <Outlet />
        </div>
      </main>
    </>
  );
}

export default Profile;
