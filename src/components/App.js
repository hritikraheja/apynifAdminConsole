import '../css/App.css';
import {Link, BrowserRouter as Router, Route, Routes, BrowserRouter} from 'react-router-dom'
import Login from './Login.js'
import ResetPassword from './ResetPassword';
import {NotificationContainer, NotificationManager} from 'react-notifications'
import Dashboard from './Dashboard';
import { useState } from 'react';
import ForgotPassword from './ForgotPassword';

function App() {

  const [toggler, setToggler] = useState(false);

  function createSuccessNotification(text){
    return NotificationManager.success(text, "", 1500)
  }

  function createErrorNotification(text){
    return NotificationManager.error(text, "", 1500)
  }

  function reRender() {
    setToggler(!toggler)
  }
  
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element ={!sessionStorage.getItem('loggedInUser') ? <Login createSuccessNotification={createSuccessNotification} createErrorNotification ={createErrorNotification} reRender ={reRender}></Login> : <Dashboard reRender = {reRender}></Dashboard>}></Route>
          <Route path='forgot-password' element={<ForgotPassword></ForgotPassword>}></Route>
          <Route path='reset-password' element={<ResetPassword></ResetPassword>}></Route>
        </Routes>
      </Router>
      <NotificationContainer/>
    </div>
  );
}

export default App;
