import "../css/App.css";
import { Link, BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Login.js";
import ResetPassword from "./ResetPassword";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import Dashboard from "./Dashboard";
import { useState } from "react";
import ForgotPassword from "./ForgotPassword";

function App() {
  const [toggler, setToggler] = useState(false);

  function createSuccessNotification(text) {
    return NotificationManager.success(text, "", 1500);
  }

  function createErrorNotification(text) {
    return NotificationManager.error(text, "", 1500);
  }

  function reRender() {
    setToggler(!toggler);
  }

  return (
    <div className="App">
      <Router>
        <Routes>
          {!sessionStorage.getItem("loggedInUser") && (
            <>
              <Route
                path="/"
                element={
                  <Login
                    createSuccessNotification={createSuccessNotification}
                    createErrorNotification={createErrorNotification}
                    reRender={reRender}
                  ></Login>
                }
              ></Route>
              <Route
                path="forgot-password"
                element={<ForgotPassword></ForgotPassword>}
              ></Route>
              <Route
                path="reset-password"
                element={<ResetPassword></ResetPassword>}
              ></Route>
              <Route
                path="*"
                element={
                  <Login
                    createSuccessNotification={createSuccessNotification}
                    createErrorNotification={createErrorNotification}
                    reRender={reRender}
                  ></Login>
                }
              ></Route>
            </>
          )}
          {sessionStorage.getItem("loggedInUser") && (
            <>
              <Route
                path="/"
                element={
                  <Dashboard
                    reRender={reRender}
                    createSuccessNotification={createSuccessNotification}
                    createErrorNotification={createErrorNotification}
                  ></Dashboard>
                }
              ></Route>
              <Route
                path="/:param"
                element={
                  <Dashboard
                    reRender={reRender}
                    createSuccessNotification={createSuccessNotification}
                    createErrorNotification={createErrorNotification}
                  ></Dashboard>
                }
              ></Route>
              <Route
                path="/manageBlogs/:blogParam"
                element={
                  <Dashboard
                    reRender={reRender}
                    createSuccessNotification={createSuccessNotification}
                    createErrorNotification={createErrorNotification}
                  ></Dashboard>
                }
              ></Route>
            </>
          )}
        </Routes>
      </Router>
      <NotificationContainer />
    </div>
  );
}

export default App;
