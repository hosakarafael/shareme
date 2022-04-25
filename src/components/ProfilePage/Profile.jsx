import React, { useContext } from "react";
import UserContext from "../../context/userContext";
import { userImageDownload } from "../../services/userService";
import { useBase64Image } from "../../hook/useBase64Image";
import "./Profile.css";
import { NavLink, Outlet, Link } from "react-router-dom";

function Profile(props) {
  const currentUser = useContext(UserContext);
  const userProfileImage = useBase64Image(userImageDownload(currentUser.id));
  return (
    <>
      <div className="profile__background"></div>
      <main className="container">
        <div className="background-image__container">
          <img
            className="background-image"
            src={process.env.PUBLIC_URL + "/images/bg.jpeg"}
          />
        </div>
        <div className="profile__header">
          <div className="profile-user">
            <img className="profile-user__image" src={userProfileImage} />
            <div className="profile-user__details">
              <span className="profile-user__name">
                {currentUser &&
                  `${currentUser.firstName} ${currentUser.lastName}`}
              </span>
              <Link to="/friends/all" className="profile-user__friends-qty">
                30 friends
              </Link>
            </div>
          </div>
        </div>
        <div className="profile-options__container">
          <NavLink to="posts" className="profile-option">
            Posts
          </NavLink>
          <NavLink to="images" className="profile-option">
            Images
          </NavLink>
          <NavLink to="videos" className="profile-option">
            Videos
          </NavLink>
        </div>
        <div>
          <Outlet />
        </div>
      </main>
    </>
  );
}

export default Profile;
