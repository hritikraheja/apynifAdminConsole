import React, { useState } from "react";
import "../css/Dashboard.css";

function Dashboard(props) {
  const [sideNavOpen, setSideNavOpen] = useState(false);

  return (
    <div id="dashboard">
      <nav>
        <i
          className={
            sideNavOpen
              ? "fa-solid fa-bars-staggered sideNavOpen"
              : "fa-solid fa-bars"
          }
          onClick={() => {
            setSideNavOpen(!sideNavOpen);
          }}
        ></i>
      </nav>
      <div id="content">
        <div id="sideNav">
          <div id="sideNavHead">
            <i></i>
            <p>Dashboard</p>
          </div>
          <ul></ul>
        </div>
        <div id="navigationContent">
          <h1>Hello {sessionStorage.getItem("loggedInUser")}</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem("loggedInUser");
              props.reRender();
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
