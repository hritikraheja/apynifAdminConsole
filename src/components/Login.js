import React, { useState } from "react";
import "../css/Login.css";
import apynifLogo from "../assets/apynifLogo.png";
import loginScreenImage from "../assets/loginScreenImage.png";
import {auth} from './InitializeFirebaseAuth.js'
import ReactLoading from 'react-loading'
import { signInWithEmailAndPassword } from 'firebase/auth'
import {Link} from 'react-router-dom'

function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

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

  function onSubmitHandler(e) {
    e.preventDefault()
    const emailValidationRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    if(!emailValidationRegex.test(email)){
      setInvalidEmail(true);
      return;
    }
    setSigningIn(true)
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredentials) => {
      sessionStorage.setItem('loggedInUser', email);
      props.createSuccessNotification('Logged in successfully!')
      window.location = './'
      setSigningIn(false)
    })
    .catch((err) => {
      if(err.code == 'auth/user-not-found'){
        props.createErrorNotification('User not found!')
      } else if (err.code == 'auth/wrong-password'){
        setInvalidPassword(true)
      } else {
        props.createErrorNotification('Firebase error!')
      }
      setSigningIn(false)
    })
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
            <Link to={'/forgot-password'}><button type="button" id="forgotPasswordButton">Forgot Password?</button></Link>
            <button type="submit" id="signInButton" disabled = {signingIn}>{signingIn && <ReactLoading className="loadingAnimation" type='spinningBubbles' color="white" width='25px' height='25px'></ReactLoading>}<p>{signingIn ? 'Signing In' : 'Sign In'}</p></button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
