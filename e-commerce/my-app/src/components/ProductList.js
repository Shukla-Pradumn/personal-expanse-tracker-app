import React, { useState, useEffect } from 'react';
import { get } from 'lodash';
import { Link } from 'react-router-dom';

function ProductList() {
 const [products, setProducts] = useState([]);

 useEffect(() => {
  getProducts();
 }, []);

 const getProducts = async () => {
  console.log('localStorage.getItem', localStorage.getItem('token'));
  let result = await fetch('http://localhost:5000/products', {
   headers: {
    authorization: JSON.parse(localStorage.getItem('token')),
   },
  });
  result = await result.json();
  setProducts(result);
 };

 const deleteProduct = async (id) => {
  let result = await fetch(`http://localhost:5000/product/${id}`, {
   method: 'Delete',
  });
  result = await result.json();
  if (result) {
   console.log('Result is deleted');
   getProducts();
  }
 };

 const handleSearch = async (e) => {
  let key = e.target.value;
  if (key !== '') {
   let result = await fetch(`http://localhost:5000/search/${key}`);
   result = await result.json();
   if (result) {
    setProducts(result);
   } else {
   }
  } else {
   getProducts();
  }
 };
 return (
  <div className="container">
   <div className="row">
    <div className="col-12">
     <div className="product-list">
      <h3 className="mb-5">Product List</h3>
      <input
       type="text"
       placeholder="Search Product"
       className="search-product-box"
       onChange={handleSearch}
      />
      <div className="row">
       {products.length > 0 ? (
        products.map((item, index) => (
         <div className="col-lg-3 col col-sm-6 col-md-4">
          <div className="card mb-3">
           <img
            className="card-img-top cardImage"
            src={get(item, 'image', `../defaultPlaceHolder.png`)}
            alt="Card image cap"
           />
           <div className="card-body">
            <h5 className="card-title">{item.name}</h5>
            <p className="card-text">Price: ₹ {item.price}</p>
            <div className="row">
             <div className="col-6 p-0 text-start">
              <b>Category:</b> {item.category}
             </div>
             <div className="col-6 p-0 text-end">
              <b>Brand:</b> {item.company}
             </div>
            </div>
            <div className="row">
             <button
              className="col-6 p-0 border-0 bg-white text-start"
              onClick={() => deleteProduct(item._id)}
             >
              <img className="img-fluid deleteIcon" src="../deleteIcon.jpeg" />
             </button>
             <Link className="col-6 p-0 text-end" to={`/update/${item._id}`}>
              <img className="img-fluid deleteIcon" src="../update.jpg" />
             </Link>
            </div>
           </div>
          </div>
         </div>
         //  </div>
        ))
       ) : (
        <h2>No Product Found</h2>
       )}
       {/* </div> */}
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}

export default ProductList;
