import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/Dashboard.css";
import ManageBlogs from "./ManageBlogs";
import ActiveUsers from "./ActiveUsers";
import BlockedUsers from "./BlockedUsers";
import ApprovedItems from "./ApprovedItems";
import RemovedItems from "./RemovedItems";
import DashboardContent from "./DashboardContent";
import { Link } from "react-router-dom";
import ReactTimeAgo from "react-time-ago";

function Dashboard(props) {
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [manageUsersOpen, setManageUsersOpen] = useState(false);
  const [manageNftsOpen, setManageNftsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const { param } = useParams();
  const [ timeCount, setTimeCount] = useState(new Date())

  const lostContent = (
    <div id="lostDiv">
      <span>404</span>
      <p>Oops... it seems you are lost.</p>
    </div>
  );

  const resetTimeCount = () => {
    setTimeCount(new Date())
  }

  useEffect(() => {
    if (!param) {
      setContent(
        <DashboardContent
          createSuccessNotification={props.createSuccessNotification}
          resetTimeCount = {resetTimeCount}
        ></DashboardContent>
      );
    } else if (param == "activeUsers") {
      setContent(
        <ActiveUsers
          createSuccessNotification={props.createSuccessNotification}
          resetTimeCount = {resetTimeCount}
        ></ActiveUsers>
      );
    } else if (param == "blockedUsers") {
      setContent(
        <BlockedUsers
          createSuccessNotification={props.createSuccessNotification}
          resetTimeCount = {resetTimeCount}
        ></BlockedUsers>
      );
    } else if (param == "approvedItems") {
      setContent(
        <ApprovedItems
          createSuccessNotification={props.createSuccessNotification}
          resetTimeCount = {resetTimeCount}
        ></ApprovedItems>
      );
    } else if (param == "removedItems") {
      setContent(
        <RemovedItems
          createSuccessNotification={props.createSuccessNotification}
          resetTimeCount = {resetTimeCount}
        ></RemovedItems>
      );
    } else if (param == "manageBlogs" || param == "manageBlogs-addBlog") {
      setContent(
        <ManageBlogs
          createSuccessNotification={props.createSuccessNotification}
          createErrorNotification={props.createErrorNotification}
          resetTimeCount = {resetTimeCount}
        ></ManageBlogs>
      );
    } else {
      setContent(lostContent);
      resetTimeCount()
    }
  }, [param]);

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

        <div id="menu">
          <p>
            {sessionStorage.getItem("loggedInUser").charAt(0).toUpperCase()}
          </p>
          <div id="menuDetails">
            <p>
              {sessionStorage.getItem("loggedInUser").charAt(0).toUpperCase()}
            </p>
            <span>{sessionStorage.getItem("loggedInUser")}</span>
            <button
              onClick={() => {
                sessionStorage.removeItem("loggedInUser");
                window.location = "/";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div id="content">
        <div id="sideNav">
          <Link to="/">
            <div
              id="sideNavHead"
              className={(!param ? "activeItem" : "notActiveItem") + " pointer"}
            >
              <i
                className="fa-solid fa-boxes-stacked"
                id={
                  sideNavOpen ? "sideMenuItemLogoOpen" : "sideMenuItemLogoClose"
                }
              ></i>
              {sideNavOpen && (
                <div id="sideMenuItemText">
                  <p>Dashboard</p>
                </div>
              )}
            </div>
          </Link>
          <div id="sideMenuItem">
            {sideNavOpen && (
              <i className="fa-regular fa-user " id="sideMenuItemLogoOpen"></i>
            )}
            {!sideNavOpen && (
              <i
                type="button"
                data-target="#collapseManageUsers"
                aria-expanded={manageUsersOpen}
                aria-controls="collapseManageUsers"
                className="fa-regular fa-user"
                id="sideMenuItemLogoClose"
                onClick={() => {
                  setManageUsersOpen(!manageUsersOpen);
                }}
              ></i>
            )}
            {(param == "activeUsers" || param == "blockedUsers") && (
              <p id={sideNavOpen ? "greenDotActive" : "greenDotNotActive"}></p>
            )}
            {sideNavOpen && (
              <div id="sideMenuItemText">
                <p>Manage Users</p>
                <i
                  type="button"
                  data-target="#collapseManageUsers"
                  aria-expanded={manageUsersOpen}
                  aria-controls="collapseManageUsers"
                  class="fa-solid fa-angles-right"
                  style={{
                    transform: manageUsersOpen
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                  }}
                  onClick={() => {
                    setManageUsersOpen(!manageUsersOpen);
                  }}
                ></i>
              </div>
            )}
          </div>
          <ul
            id="collapseManageUsers"
            className={manageUsersOpen ? "collapse show" : "collapse"}
          >
            <li>
              <Link to="/activeUsers">
                <div
                  id="sideMenuItem"
                  className={
                    (param == "activeUsers" ? "activeItem" : "notActiveItem") +
                    " pointer"
                  }
                >
                  <i
                    className="fa-solid fa-user-check"
                    id={
                      sideNavOpen
                        ? "sideMenuItemLogoOpen"
                        : "sideMenuItemLogoClose"
                    }
                  ></i>
                  {sideNavOpen && (
                    <div id="sideMenuItemText">
                      <p>Active</p>
                    </div>
                  )}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/blockedUsers">
                <div
                  id="sideMenuItem"
                  className={
                    (param == "blockedUsers" ? "activeItem" : "notActiveItem") +
                    " pointer"
                  }
                >
                  <i
                    className="fa-solid fa-user-lock"
                    id={
                      sideNavOpen
                        ? "sideMenuItemLogoOpen"
                        : "sideMenuItemLogoClose"
                    }
                  ></i>
                  {sideNavOpen && (
                    <div id="sideMenuItemText">
                      <p>Blocked</p>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          </ul>
          <div id="sideMenuItem">
            {sideNavOpen && (
              <i className="fa-solid fa-list-ul" id="sideMenuItemLogoOpen"></i>
            )}
            {!sideNavOpen && (
              <i
                type="button"
                data-target="#collapseManageNfts"
                aria-expanded={manageNftsOpen}
                aria-controls="collapseManageNfts"
                className="fa-solid fa-list-ul"
                id="sideMenuItemLogoClose"
                onClick={() => {
                  setManageNftsOpen(!manageNftsOpen);
                }}
              ></i>
            )}
            {(param == "approvedItems" || param == "removedItems") && (
              <p id={sideNavOpen ? "greenDotActive" : "greenDotNotActive"}></p>
            )}
            {sideNavOpen && (
              <div id="sideMenuItemText">
                <p>Manage NFTs</p>
                <i
                  type="button"
                  data-target="#collapseManageNfts"
                  aria-expanded={manageNftsOpen}
                  aria-controls="collapseManageNfts"
                  className="fa-solid fa-angles-right"
                  style={{
                    transform: manageNftsOpen
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                  }}
                  onClick={() => {
                    setManageNftsOpen(!manageNftsOpen);
                  }}
                ></i>
              </div>
            )}
          </div>
          <ul
            id="collapseManageNfts"
            className={manageNftsOpen ? "collapse show" : "collapse"}
          >
            <li>
              <Link to="/approvedItems">
                <div
                  id="sideMenuItem"
                  className={
                    (param == "approvedItems"
                      ? "activeItem"
                      : "notActiveItem") + " pointer"
                  }
                >
                  <i
                    className="fa-regular fa-circle-check"
                    id={
                      sideNavOpen
                        ? "sideMenuItemLogoOpen"
                        : "sideMenuItemLogoClose"
                    }
                  ></i>
                  {sideNavOpen && (
                    <div id="sideMenuItemText">
                      <p>Approved</p>
                    </div>
                  )}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/removedItems">
                <div
                  id="sideMenuItem"
                  className={
                    (param == "removedItems" ? "activeItem" : "notActiveItem") +
                    " pointer"
                  }
                >
                  <i
                    className="fa-regular fa-circle-xmark"
                    id={
                      sideNavOpen
                        ? "sideMenuItemLogoOpen"
                        : "sideMenuItemLogoClose"
                    }
                  ></i>
                  {sideNavOpen && (
                    <div id="sideMenuItemText">
                      <p>Removed</p>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          </ul>
          <Link to="/manageBlogs">
            <div
              id="sideMenuItem"
              className={
                (param == "manageBlogs" || param == "manageBlogs-addBlog"
                  ? "activeItem"
                  : "notActiveItem") + "  pointer"
              }
            >
              <i
                className="fa-solid fa-users-viewfinder"
                id={
                  sideNavOpen ? "sideMenuItemLogoOpen" : "sideMenuItemLogoClose"
                }
              ></i>
              {sideNavOpen && (
                <div id="sideMenuItemText">
                  <p>Manage Blogs</p>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div id="navigationContent">
          {content}
          <span id="updatedAgoTimer">
            Updated{" "}
            <ReactTimeAgo
              date={timeCount}
              locale="en-US"
              timeStyle="twitter"
            />{" "}
            ago
          </span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
