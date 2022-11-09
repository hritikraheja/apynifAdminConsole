import React, { useEffect, useRef, useState } from "react";
import "../css/ManageBlogs.css";
import { ref, update, onValue } from "firebase/database";
import {ref as storageBucketReference, getDownloadURL, uploadBytesResumable} from 'firebase/storage'
import { db, bucket } from "./InitializeFirebaseAuth.js";
import ReactLoading from "react-loading";
import { Link, useParams, useLocation } from "react-router-dom";
import EditBlog from "./EditBlog";

function ManageBlogs(props) {
  const [blogs, setBlogs] = useState([]);
  const [fetchingBlogs, setFetchingBlogs] = useState(false);
  const [title, setTitle] = useState(null);
  const [category, setCategory] = useState(-1);
  const [content, setContent] = useState(null);
  const [images, setImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [searchBoxQuery, setSearchBoxQuery] = useState('')
  const { param } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const uploadFileRef = useRef();

  useEffect(() => {
    const dbref = ref(db, "blogs");
    onValue(dbref, (snapshot) => {
      if (snapshot.exists()) {
              let blogIds = Object.keys(snapshot.val());
              let temp = [];
              for (let i = 0; i < blogIds.length; i++) {
                temp.push(snapshot.val()[blogIds[i]]);
              }
              setFetchingBlogs(true);
              setBlogs(temp);
            } else {
              console.log("Data Not Found");
            }
    })
    setSearchBoxQuery('')
  }, []);

  const uploadImageOnChange = async (e) => {
    let image = e.target.files && e.target.files[0];
    document.getElementById('imageFileInput').value = null;
    if (!image) {
      return;
    }

    setImageUploading(true)
    let temp = images;
    const storageRef = storageBucketReference(bucket, `/uploads/blogImages/${image.name}${image.size}`);
    const uploadTask = uploadBytesResumable(storageRef, image);
    uploadTask.on(
      "state_changed",
      (s) => {},
      (err) => {
        setImageUploading(false)
        console.log(err);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then((url) => {
            setImageUploading(false);
            temp = [...temp, url];
            setImages(temp);
          })
      }
    );
  };

  const removeItemFromImages = (item)=>{
    setImages(images.filter((image) => image !== item))
  }

  const blogCategories = [
    'Announcments',
    'Guides',
    'Spotlights',
    'Safety and Security',
    'Guest Posts',
    'Others'
  ]

  function publishBlog(){
    let blogIds = []
    blogs.forEach((blog) => {
      blogIds = [...blogIds, parseInt(blog.blogId.substring(1))]
    })
    blogIds = blogIds.sort((a, b) => {
      return a-b
    })
    let newBlogId = blogIds[blogIds.length-1] + 1;
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June','July', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
    const dateObj = new Date();
    let month = months[dateObj.getMonth()];
    let year = dateObj.getFullYear();
    let date = dateObj.getDate();
    update(ref(db, "blogs/" + 'b'+newBlogId),
    {
      blogTitle : title,
      blogCategory : blogCategories[category],
      blogContent : content,
      blogImages : images,
      blogId : 'b' + newBlogId,
      blogCreationDate : month + '' + date + ', ' + year

    }).then(() => {
      window.location = '/manageBlogs'
      props.createSuccessNotification('Blog published successfully!')
    }).catch(err => {
      props.createErrorNotification('There was an error while publishing the blog')
      console.log(err)
    })
  }

  function blogsSearchQuery(){
    let result = []
    blogs.map((val, key) => {
      if(!searchBoxQuery || searchBoxQuery == '' || (searchBoxQuery != '' && (val.blogTitle.toLowerCase().includes(searchBoxQuery.toLowerCase()) || val.blogContent.toLowerCase().includes(searchBoxQuery.toLowerCase()) || val.blogCategory.toLowerCase().includes(searchBoxQuery.toLowerCase())))){
        result = [...result, val]
      }
    })
    return result
  }

  return (
    <>
      {param == "manageBlogs" && !query.get("blogId") && (
        <div id="manageBlogs">
          <p id="head">Manage Blogs</p>
          <p id="subHead">
            <Link to="/">
              <span>{"Dashboard"}</span>
            </Link>
            {" > "}Manage Blogs
          </p>
          <div id="header">
            <div id="searchBox">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" defaultValue={searchBoxQuery} placeholder="Search" onChange={(e)=>setSearchBoxQuery(e.target.value)}></input>
            </div>
            <p id="filters">
              <i class="fa-solid fa-sliders"></i>
            </p>
            <Link to="/manageBlogs-addBlog">
              <button>
                <i class="fa-solid fa-circle-plus"></i>
                Add New Blog
              </button>
            </Link>
          </div>
          <div id="blogsContent">
            {!fetchingBlogs && (
              <ReactLoading
                className="loadingAnimation"
                type="spinningBubbles"
                color="red"
                width="75px"
                height="75px"
              ></ReactLoading>
            )}
            {fetchingBlogs && blogsSearchQuery().length == 0 && (
              <p id="noBlogsPrompt">
                Oops.... there are no blogs till now.<br></br>Add a blog first.
              </p>
            )}
            {fetchingBlogs && blogsSearchQuery().length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Blog Title</th>
                    <th>Category</th>
                    <th>Created On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blogsSearchQuery().map((val, key) => {
                      return (
                      <tr id="blog" key={key}>
                        <td>{val.blogTitle}</td>
                        <td>{val.blogCategory}</td>
                        <td>{val.blogCreationDate}</td>
                        <td>
                          <Link to={'/manageBlogs?' + new URLSearchParams(
                            {blogId : val.blogId}
                          )}><button id="editButton">
                            <i className="fa-solid fa-pen"></i>
                          </button></Link>
                        </td>
                      </tr>
                    );
                    }
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {param == "manageBlogs-addBlog" && (
        <div id="addBlogDiv">
          <p id="head">Add New Blog</p>
          <p id="subHead">
            <Link to="/">
              <span>Dashboard</span>
            </Link>
            {" > "}
            <Link to="/manageBlogs">
              <span>Manage Blogs</span>
            </Link>
            {" > "}Add New Blog
          </p>
          <p id="blogDetailsHead">BLOG DETAILS</p>
          <div id="blogDetailsForm">
            <div id="titleAndCategoryInput">
              <div id="titleInput">
                <p>Blog Title</p>
                <input
                  onChange={(e) => {
                    setTitle(e.target.value);
                  }}
                ></input>
              </div>
              <div id="categoryInput">
                <p id="label">Blog Category</p>
                <select
                  placeholder="Choose category"
                  onChange={(e) => {
                    setCategory(e.target.value);
                  }}
                >
                  <option selected disabled>
                    Select category
                  </option>
                  <option value={0}>Announcements</option>
                  <option value={1}>Guides</option>
                  <option value={2}>Spotlights</option>
                  <option value={3}>Safety and Security</option>
                  <option value={4}>Guest Posts</option>
                  <option value={5}>Others</option>
                </select>
              </div>
            </div>
            <div id="blogContentInput">
              <p>Blog Content</p>
              <textarea
                onChange={(e) => {
                  setContent(e.target.value);
                }}
              ></textarea>
            </div>
            <div id="blogImageInput">
              <p>Blog Image</p>
              {images.map((imageUrl) => {
                  return(
                    <div id='uploadedImageDiv'>
                      <img src={imageUrl}></img>
                      <button onClick={() => {
                        removeItemFromImages(imageUrl)
                      }}>X</button>
                    </div>
                  )
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
                  <button id="addNewBlogButton" onClick={() => uploadFileRef.current.click()}>
                    <i className="fa-solid fa-circle-plus"></i>Add Image
                  </button>
                )}
              </div>
            </div>
            <div id="buttonsDiv">
              <button disabled = {!title || title == "" || !content || content == '' || category == -1} onClick={publishBlog}>Publish</button>
              <Link to="/manageBlogs">
                <button>Go Back</button>
              </Link>
            </div>
          </div>
        </div>
      )}
      {param == "manageBlogs" && query.get("blogId") && <EditBlog createSuccessNotification={props.createSuccessNotification} createErrorNotification={props.createErrorNotification}></EditBlog>}
      <input
        id="imageFileInput"
        type="file"
        ref={uploadFileRef}
        accept ='image/*'
        style={{ display: "none" }}
        onChange={uploadImageOnChange}
      ></input>
    </>
  );
}

export default ManageBlogs;
