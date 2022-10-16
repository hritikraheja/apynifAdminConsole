import React, { useState } from "react";
import "../css/ResetPassword.css";
import apynifLogo from "../assets/apynifLogo.png";
import resetPasswordImage from "../assets/resetPasswordImage.svg";

const ResetPassword = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const onNewPasswordChangeHandler = (e) => {
    setNewPassword(e.target.value);
    if (passwordMismatch) {
      setPasswordMismatch(false);
    }
  };

  const onConfirmPasswordChangeHandler = (e) => {
    setConfirmPassword(e.target.value);
    if (passwordMismatch) {
      setPasswordMismatch(false);
    }
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true);
    }
  };

  return (
    <div id="resetPasswordPage">
      <div id="resetPasswordPageLeft">
        <img src={apynifLogo}></img>
        <img src={resetPasswordImage}></img>
      </div>
      <div id="resetPasswordPageRight">
        <div id="formDiv">
          <p id="resetPasswordPageHead">Reset Password</p>
          <p id="resetPasswordPageSubHead">
            Please enter your new password below to update the credentials of
            your account.
          </p>
          <form action="" onSubmit={onSubmitHandler}>
            <div id="newpasswordInputDiv">
              <label htmlFor="newPassword">New Password</label>
              <div id="newPasswordInputWithEye">
                <input
                  type={!showNewPassword ? "password" : "text"}
                  name="password"
                  autoComplete="off"
                  onChange={onNewPasswordChangeHandler}
                ></input>
                <i
                  className={
                    showNewPassword
                      ? "fa-solid fa-eye-slash"
                      : "fa-solid fa-eye"
                  }
                  id={newPassword ? "nonEmptyPasswordEye" : "emptyPasswordEye"}
                  onClick={() => {
                    setShowNewPassword(!showNewPassword);
                  }}
                ></i>
              </div>
            </div>

            <div id="confirmPasswordInputDiv">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div id="confirmPasswordInputWithEye" className={passwordMismatch ? 'mismatch': 'noMismatch'}>
                <input
                  type={!showConfirmPassword ? "password" : "text"}
                  name="password"
                  autoComplete="off"
                  onChange={onConfirmPasswordChangeHandler}
                ></input>
                <i
                  className={
                    showConfirmPassword
                      ? "fa-solid fa-eye-slash"
                      : "fa-solid fa-eye"
                  }
                  id={
                    confirmPassword ? "nonEmptyPasswordEye" : "emptyPasswordEye"
                  }
                  onClick={() => {
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                ></i>
              </div>
              {passwordMismatch && (
                <p id="passwordMismatch">Password didn't match</p>
              )}
            </div>
            <button type="submit" id="updatePasswordButton" disabled={!newPassword || !confirmPassword || passwordMismatch}>Update</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
