import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const UpdateProduct = () => {
 const [name, setName] = React.useState('');
 const [price, setPrice] = React.useState('');
 const [category, setCategory] = React.useState('');
 const [company, setComapny] = React.useState('');
 const [error, setError] = React.useState(false);
 const params = useParams();
 const navigate = useNavigate();

 useEffect(() => {
  getProductDetails(params);
 }, []);

 const getProductDetails = async (params) => {
  let result = await fetch(`http://localhost:5000/product/${params.id}`);
  result = await result.json();
  setName(result.name);
  setPrice(result.price);
  setComapny(result.company);
  setCategory(result.category);
 };
 const updateProduct = async () => {
  console.log(name, price, category, company);
  let result = await fetch(`http://localhost:5000/product/${params.id}`, {
   method: 'Put',
   body: JSON.stringify({ name, price, category, company }),
   headers: {
    'Content-Type': 'application/json',
   },
  });
  result = await result.json();
  navigate('/');
 };
 return (
  <div className="product">
   <h1>Update Product</h1>
   <input
    type="text"
    placeholder="Enter product name"
    className="inputBox"
    onChange={(e) => {
     setName(e.target.value);
    }}
    value={name}
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
   <input
    type="text"
    placeholder="Enter product category"
    className="inputBox"
    onChange={(e) => {
     setCategory(e.target.value);
    }}
    value={category}
   />
   <input
    type="text"
    placeholder="Enter product company"
    className="inputBox"
    onChange={(e) => {
     setComapny(e.target.value);
    }}
    value={company}
   />
   <button className="button" onClick={updateProduct}>
    Update Product
   </button>
  </div>
 );
};
export default UpdateProduct;
