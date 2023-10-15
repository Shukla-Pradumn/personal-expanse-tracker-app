import React from 'react';
import Nav from './components/Nav';
import Footer from './components/Footer';
import SignUp from './components/SignUp';
import Login from './components/Login';
import PrivateComponent from './components/PrivateComponent';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AddProduct from './components/AddProducts';
import ProductList from './components/ProductList';
import UpdateProduct from './components/UpdateProduct';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
 return (
  <div className="App">
   <BrowserRouter>
    <Nav />
    <Routes>
     <Route element={<PrivateComponent />}>
      <Route path="/" element={<ProductList />} />
      <Route path="/add" element={<AddProduct />} />
      <Route path="/update/:id" element={<UpdateProduct />} />
      <Route path="/profile" element={<h1>Profile</h1>} />
      <Route path="/logout" element={<h1>Logout</h1>} />
     </Route>
     <Route path="/signup" element={<SignUp />} />
     <Route path="/login" element={<Login />} />
    </Routes>
   </BrowserRouter>
   <Footer />
  </div>
 );
}

export default App;
