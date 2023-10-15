import React from 'react';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
 const [name, setName] = React.useState('');
 const [price, setPrice] = React.useState('');
 const [category, setCategory] = React.useState('');
 const [company, setComapny] = React.useState('');
 const [image, setImage] = React.useState('');
 const [error, setError] = React.useState(false);

 const navigate = useNavigate();
 const addProduct = async () => {
  if (!name || !price || !company || !category) {
   setError(true);
   return false;
  }
  const userId = JSON.parse(localStorage.getItem('user'))._id;
  let result = await fetch('http://localhost:5000/add-product', {
   method: 'post',
   body: JSON.stringify({ name, image, price, category, company, userId }),
   headers: {
    'Content-Type': 'application/json',
   },
  });
  result = await result.json();
  navigate('/');
 };
 return (
  <div className="product">
   <h1>Add Product</h1>
   {/* {error} */}
   <input
    type="text"
    placeholder="Enter product name"
    className="inputBox"
    onChange={(e) => {
     setName(e.target.value);
    }}
    value={name}
   />
   {error && !name && <span className="error">Enter valid name</span>}
   {/* {error} */}
   <input
    type="text"
    placeholder="Enter Image URL"
    className="inputBox"
    onChange={(e) => {
     setImage(e.target.value);
    }}
    value={image}
   />
   <input
    type="text"
    placeholder="Enter product price"
    className="inputBox"
    onChange={(e) => {
     setPrice(e.target.value);
    }}
    value={price}
   />
   {error && !price && <span className="error">Enter valid price</span>}
   <input
    type="text"
    placeholder="Enter product category"
    className="inputBox"
    onChange={(e) => {
     setCategory(e.target.value);
    }}
    value={category}
   />
   {error && !category && <span className="error">Enter valid category</span>}
   <input
    type="text"
    placeholder="Enter product company"
    className="inputBox"
    onChange={(e) => {
     setComapny(e.target.value);
    }}
    value={company}
   />
   {error && !company && <span className="error">Enter valid company</span>}
   <button className="button" onClick={addProduct}>
    Add Product
   </button>
  </div>
 );
};
export default AddProduct;
