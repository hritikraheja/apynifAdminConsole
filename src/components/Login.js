import React, { useState } from "react";
import "../css/Login.css";
import apynifLogo from "../assets/apynifLogo.png";
import loginScreenImage from "../assets/loginScreenImage.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false)

  function onSubmitHandler(e) {
    e.preventDefault()
    const emailValidationRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    if(!emailValidationRegex.test(email)){
      setInvalidEmail(true);
      return;
    }

  }

  function onEmailChangeHandler(e){
    setEmail(e.target.value)
    if(invalidEmail){
      setInvalidEmail(false)
    }
  }

  function onPasswordChangeHandler(e){
    setPassword(e.target.value);
    if(invalidPassword){
      setInvalidPassword(false)
    }
  }

  return (
    <div id="loginPage">
      <div id="loginPageLeft">
        <img src={apynifLogo}></img>
        <img src={loginScreenImage}></img>
      </div>
      <div id="loginPageRight">
        <div id="formDiv">
          <p id="loginPageHead">Sign in to Dashboard</p>
          <p id="loginPageSubHead">
            Please enter your Email address & Password
          </p>
          <form action="" onSubmit={onSubmitHandler}>
            <div id="emailInputDiv">
              <label htmlFor="email">Email Address</label>
              <input className={invalidEmail ? 'errorInInput' : 'noErrorInInput'} type="text" name="email" placeholder="eg. johndoe@gmail.com" autoComplete="off" onChange={onEmailChangeHandler}></input>
              {invalidEmail && <p id="invalidInput">Invalid Email Address</p>}
            </div>
            <div id="passwordInputDiv">
              <label htmlFor="password">Password</label>
              <div id="passwordInputWithEye" className={invalidPassword ? 'errorInInput' : 'noErrorInInput'}>
                <input type={!showPassword ? 'password' : 'text'} name="password" autoComplete="off" onChange={onPasswordChangeHandler}></input>
                <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} id={password ? 'nonEmptyPasswordEye' : 'emptyPasswordEye'} onClick={() => {
                  setShowPassword(!showPassword)
                }}></i>
              </div>
              {invalidPassword && <p id="invalidInput">Your password was incorrect</p>}
            </div>
            <button type="button" id="forgotPasswordButton">Forgot Password?</button>
            <button type="submit" id="signInButton">Sign In</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
