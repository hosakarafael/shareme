import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useInput } from "../../hook/useInput";
import AlertEntity, { LocationProps } from "../../models/alert";
import authService from "../../services/authService";
import { useAlert } from "../../components/Alert/Alert";

import css from "./LoginForm.module.scss";
import { useUser } from "../../context/userContext";
import { getUserByEmail } from "../../services/userService";
import { useNavigate } from "react-router";

function LoginForm() {
  const { setUser } = useUser();
  const { value: email, bind: bindEmail } = useInput("");
  const { value: password, bind: bindPassword } = useInput("");
  const [alert, dispatchAlert] = useAlert();
  const location = useLocation() as LocationProps;
  const navigate = useNavigate();

  useEffect(() => {
    if (location?.state?.alert as AlertEntity) {
      const alert = location.state.alert;
      dispatchAlert(alert.message, alert.type);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (setUser) {
        await authService.login(email, password);
        const currentUser = authService.getCurrentUser();
        const data = await getUserByEmail(currentUser.sub);
        data.roles = currentUser.roles;
        setUser(data);
        navigate("/home");
      }
    } catch (ex: any) {
      if (ex.response && ex.response.status === 400) {
        dispatchAlert("Username/Password incorrect", "danger");
      }
    }
  };

  return (
    <>
      <main className="container full center">
        <>{alert}</>
        <img
          className={css["login-logo"]}
          src={"./images/logo-full.png"}
          alt="Logo of the Shareme"
        />
        <div className={css["form-login-container"]}>
          <h1 className={css["heading"]}>Log Into ShareMe</h1>
          <form className={css["form"]} onSubmit={(e) => handleSubmit(e)}>
            <div className="form-group">
              <input
                placeholder="Email"
                type="email"
                className="form-input"
                {...bindEmail}
                required
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Password"
                type="password"
                className="form-input"
                {...bindPassword}
                required
              />
            </div>

            <button className="btn btn--small my-2 btn--primary btn--stretched">
              Log In
            </button>
          </form>
          <Link
            className="btn btn--small my-2 btn--secondary btn--stretched"
            to="/register"
          >
            Create Account
          </Link>
        </div>
      </main>
      <div className="footer">
        Rafael Hideki Hosaka © 2022 ShareMe {process.env.REACT_APP_VERSION}
      </div>
    </>
  );
}

export default LoginForm;
