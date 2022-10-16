import '../css/App.css';
import {Link, BrowserRouter as Router, Route, Routes, BrowserRouter} from 'react-router-dom'
import Login from './Login.js'
import ResetPassword from './ResetPassword';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<Login></Login>}></Route>
          <Route path='reset-password' element={<ResetPassword></ResetPassword>}></Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
