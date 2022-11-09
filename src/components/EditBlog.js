import React, { useEffect, useState, useRef } from "react";
import "../css/EditBlog.css";
import { Link, useLocation } from "react-router-dom";
import { db, bucket } from "./InitializeFirebaseAuth.js";
import { ref, onValue, update, remove } from "firebase/database";
import {
  ref as storageBucketReference,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import ReactLoading from "react-loading";

function EditBlog(props) {
  const query = new URLSearchParams(useLocation().search);
  const [updateMode, setUpdateMode] = useState(false);
  const [blogDetails, setBlogDetails] = useState(null);
  const [title, setTitle] = useState("");
  const [titleChanged, setTitleChanged] = useState(false);
  const [category, setCategory] = useState(-1);
  const [categoryChanged, setCategoryChanged] = useState(false);
  const [content, setContent] = useState("");
  const [contentChanged, setContentChanged] = useState(false);
  const [images, setImages] = useState([]);
  const [imagesChanged, setImagesChanged] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [deleteBlogDialogOpen, setDeleteBlogDialogOpen] = useState(false);
  const [updateBlogDialogOpen, setUpdateBlogDialogOpen] = useState(false);
  const uploadFileRef = useRef();

  useEffect(() => {
    const dbref = ref(db, "blogs/" + query.get("blogId"));
    onValue(dbref, (snapshot) => {
      if (snapshot.exists()) {
        setBlogDetails(snapshot.val());
      } else {
        console.log("Data Not Found");
      }
    });
  }, []);

  useEffect(() => {
    if (!blogDetails) {
      return;
    }
    setTitle(blogDetails.blogTitle);
    setCategory(blogCategories.indexOf(blogDetails.blogCategory));
    setContent(blogDetails.blogContent);
    setImages(blogDetails.blogImages);
  }, [blogDetails]);

  const blogCategories = [
    "Announcments",
    "Guides",
    "Spotlights",
    "Safety and Security",
    "Guest Posts",
    "Others",
  ];

  const removeItemFromImages = (item) => {
    setImages(images.filter((image) => image !== item));
    setImagesChanged(true);
  };

  function updateBlog() {
    update(ref(db, "blogs/" + blogDetails.blogId), {
      blogTitle: title,
      blogCategory: blogCategories[category],
      blogContent: content,
      blogImages: images,
    })
      .then(() => {
        props.createSuccessNotification("Blog Updated successfully!");
        window.location.reload(false)
      })
      .catch((err) => {
        props.createErrorNotification(
          "There was an error while updating the blog"
        );
        console.log(err);
      });
  }

  const uploadImageOnChange = async (e) => {
    let image = e.target.files && e.target.files[0];
    document.getElementById("imageFileInput").value = null;
    if (!image) {
      return;
    }

    setImageUploading(true);
    let temp = images;
    const storageRef = storageBucketReference(
      bucket,
      `/uploads/blogImages/${image.name}${image.size}`
    );
    const uploadTask = uploadBytesResumable(storageRef, image);
    uploadTask.on(
      "state_changed",
      (s) => {},
      (err) => {
        setImageUploading(false);
        console.log(err);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setImageUploading(false);
          temp = [...temp, url];
          setImages(temp);
          setImagesChanged(true);
        });
      }
    );
  };

  const deleteBlog = () => {
    remove(ref(db, "blogs/" + blogDetails.blogId))
        .then(() => {
          window.location = '/manageBlogs'
          props.createSuccessNotification("Blog Deleted successfully!");
        })
        .catch((err) => {
          props.createErrorNotification(
            "There was an error while deleting the blog"
          );
          console.log(err);
        });
  };
  return (
    <>
      {!updateMode && blogDetails && (
        <div id="blogDetailsDiv">
          <p id="head">Blog Details</p>
          <p id="subHead">
            <Link to="/">
              <span>Dashboard</span>
            </Link>
            {" > "}
            <Link to="/manageBlogs">
              <span>Manage Blogs</span>
            </Link>
            {" > "}Blog Details
          </p>
          <p id="blogDetailsHead">BLOG DETAILS</p>
          <div id="titleAndCategory">
            <p id="title">
              Blog Title : <span>{blogDetails.blogTitle}</span>
            </p>
            <p id="category">
              Blog Category : <span>{blogDetails.blogCategory}</span>
            </p>
          </div>
          <p id="blogContentLabel">Blog Content : </p>
          <p id="blogContent">{blogDetails.blogContent}</p>
          <p id="blogImageLabel">Blog Images : </p>
          {blogDetails.blogImages.map((imageUrl) => {
            return <img id="blogImage" src={imageUrl}></img>;
          })}
          <div id="buttonsDiv">
            <button onClick={() => setUpdateMode(true)}>Edit Blog</button>
            <Link to="/manageBlogs">
              <button>Go Back</button>
            </Link>
          </div>
        </div>
      )}
      {!blogDetails && (
        <ReactLoading
          className="loadingAnimation"
          type="spinningBubbles"
          color="red"
          width="75px"
          height="75px"
        ></ReactLoading>
      )}

      {updateMode && blogDetails && (
        <div id="editBlogDiv">
          <p id="head">Edit Blog Details</p>
          <p id="subHead">
            <Link to="/">
              <span>Dashboard</span>
            </Link>
            {" > "}
            <Link to="/manageBlogs">
              <span>Manage Blogs</span>
            </Link>
            {" > "}Edit Blog Details
          </p>
          <p id="blogDetailsHead">BLOG DETAILS</p>
          <div id="blogDetailsForm">
            <div id="titleAndCategoryInput">
              <div id="titleInput">
                <p>Blog Title</p>
                <input
                  style={{
                    border: titleChanged
                      ? "1px solid #1448ff"
                      : "1px solid #d1daeb",
                  }}
                  defaultValue={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleChanged(true);
                  }}
                ></input>
              </div>
              <div id="categoryInput">
                <p id="label">Blog Category</p>
                <select
                  style={{
                    border: categoryChanged
                      ? "1px solid #1448ff"
                      : "1px solid #d1daeb",
                  }}
                  placeholder="Choose category"
                  defaultValue={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCategoryChanged(true);
                  }}
                >
                  <option disabled>
                    Select category
                  </option>
                  <option selected={category == 0 ? true : false} value={0}>Announcements</option>
                  <option selected={category == 1 ? true : false} value={1}>Guides</option>
                  <option selected={category == 2 ? true : false} value={2}>Spotlights</option>
                  <option selected={category == 3 ? true : false} value={3}>Safety and Security</option>
                  <option selected={category == 4 ? true : false} value={4}>Guest Posts</option>
                  <option selected={category == 5 ? true : false} value={5}>Others</option>
                </select>
              </div>
            </div>
            <div id="blogContentInput">
              <p>Blog Content</p>
              <textarea
                style={{
                  border: contentChanged
                    ? "1px solid #1448ff"
                    : "1px solid #d1daeb",
                }}
                defaultValue={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setContentChanged(true);
                }}
              ></textarea>
            </div>
            <div id="blogImageInput">
              <p>Blog Image</p>
              {images.map((imageUrl) => {
                return (
                  <div id="uploadedImageDiv">
                    <img src={imageUrl}></img>
                    <button
                      onClick={() => {
                        removeItemFromImages(imageUrl);
                      }}
                    >
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                );
              })}
              <div id={imageUploading ? "loaderDiv" : "addBlogButtonDiv"}>
                {imageUploading && (
                  <ReactLoading
                    className="loadingAnimation"
                    type="spinningBubbles"
                    color="red"
                    width="75px"
                    height="75px"
                  ></ReactLoading>
                )}
                {!imageUploading && (
                  <button
                    id="addNewBlogButton"
                    onClick={() => uploadFileRef.current.click()}
                  >
                    <i className="fa-solid fa-circle-plus"></i>Add Image
                  </button>
                )}
              </div>
            </div>
            <div id="buttonsDiv">
              <button
                onClick={() => {
                  setUpdateBlogDialogOpen(true);
                }}
                disabled={
                  !(
                    titleChanged ||
                    categoryChanged ||
                    contentChanged ||
                    imagesChanged
                  )
                }
              >
                Update
              </button>
              <a>
                <button onClick={() =>setUpdateMode(false)}>Go Back</button>
            </a>
            </div>
            <button
              id="deleteBlogButton"
              onClick={() => setDeleteBlogDialogOpen(true)}
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
          <input
            id="imageFileInput"
            type="file"
            ref={uploadFileRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={uploadImageOnChange}
          ></input>
          <div
            id="dialogDiv"
            style={{ display: deleteBlogDialogOpen || updateBlogDialogOpen ? "block" : "none" }}
          >
            <dialog open={deleteBlogDialogOpen} id="deleteBlogDialog">
              <p id="head">Delete Blog!</p>
              <p id="subhead">Are you sure, you want to delete this blog?</p>
              <div id="buttonsDiv">
                <button onClick={() => setDeleteBlogDialogOpen(false)}>
                  No
                </button>
                <button onClick={deleteBlog}>Yes</button>
              </div>
            </dialog>

            <dialog open={updateBlogDialogOpen} id="updateBlogDialog">
              <p id="head">Update Blog!</p>
              <p id="subhead">Are you sure, you want to update this blog?</p>
              <div id="buttonsDiv">
                <button onClick={() => setUpdateBlogDialogOpen(false)}>
                  No
                </button>
                <button onClick={updateBlog}>Yes</button>
              </div>
            </dialog>
          </div>
        </div>
      )}
    </>
  );
}

export default EditBlog;
