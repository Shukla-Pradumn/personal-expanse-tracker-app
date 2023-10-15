import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Nav() {
 const navigate = useNavigate();
 const auth = localStorage.getItem('user');
 const logout = () => {
  localStorage.clear();
  navigate('/signup');
 };
 return (
  <div className="App">
   <img
    className="logo"
    width="45px"
    height="45px"
    src="https://img.favpng.com/9/8/23/shopify-e-commerce-website-magento-logo-png-favpng-cs50DCviGvrPig1KR2SLZ395w.jpg"
   />
   {auth ? (
    <ul className="nav-ul">
     <li>
      <Link to="/">Products</Link>
     </li>
     <li>
      <Link to="/add">Add Product</Link>
     </li>
     <li>
      <Link to="/profile">Profile</Link>
     </li>
     <li>
      <Link onClick={logout} to="/signup">
       Logout({JSON.parse(auth).name})
      </Link>
     </li>
    </ul>
   ) : (
    <ul className="nav-ul nav-right">
     <li>
      <Link to="/signup">Sign Up</Link>
      <li>
       <Link to="/login">Login</Link>
      </li>
     </li>
    </ul>
   )}
  </div>
 );
}

export default Nav;
