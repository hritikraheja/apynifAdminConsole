import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/ForgotPassword.css";
import apynifLogo from "../assets/apynifLogo.png";
import forgotPasswordImage from "../assets/forgotPasswordImage.jpg";
import checkYourEmailImage from "../assets/checkYourEmailImage.jpg";
import mailIcon from "../assets/mailIcon.svg";

function ForgotPassword() {
  const [mailSent, setMailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [invalidEmail, setInvalidEmail] = useState(false);

  function onEmailChangeHandler(e) {
    setEmail(e.target.value);
    if (invalidEmail) {
      setInvalidEmail(false);
    }
  }

  function onSubmitHandler() {
    const emailValidationRegex =
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailValidationRegex.test(email)) {
      setInvalidEmail(true);
      return;
    }
    window.alert("Sending Mail!");
    setMailSent(true);
  }

  return (
    <>
      {!mailSent && (
        <div id="forgotPasswordPage">
          <div id="forgotPasswordPageLeft">
            <img src={apynifLogo}></img>
            <img src={forgotPasswordImage}></img>
          </div>
          <div id="forgotPasswordPageRight">
            <div id="formDiv">
              <p id="forgotPasswordPageHead">Forgot Password</p>
              <p id="forgotPasswordPageSubHead">
                Enter the email address associated with the account.
              </p>
              <p id="emailInputLabel">Email Address</p>
              <input
                id="emailInput"
                autoComplete="off"
                placeholder="eg. max@gmail.com"
                className={invalidEmail ? "errorInEmail" : "noErrorInEmail"}
                onChange={onEmailChangeHandler}
              ></input>
              {invalidEmail && <p id="invalidEmail">Invalid Email Address</p>}
              <div id="buttonsDiv">
                <button onClick={onSubmitHandler}>Submit</button>
                <Link to={"/"}>
                  <button>Cancel</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      {mailSent && (
        <div id="emailSentPage">
          <div id="emailSentPageLeft">
            <img src={apynifLogo}></img>
            <img src={checkYourEmailImage}></img>
          </div>
          <div id="emailSentPageRight">
            <div id="content">
              <img src={mailIcon}></img>
              <p id="emailSentHead">Check Your Email</p>
              <p id="emailSentSubHead">
                An Email with a reset password link was just sent to
                max******@gmail.com
              </p>
              <Link to={'/'}><button>Back to login</button></Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ForgotPassword;
