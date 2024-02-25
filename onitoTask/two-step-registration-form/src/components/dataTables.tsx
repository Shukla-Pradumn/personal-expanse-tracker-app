import React, { useEffect } from 'react';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs4/css/dataTables.bootstrap4.min.css';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
const MyDataTableComponent: React.FC = () => {
  useEffect(() => {
    $('#myDataTable').DataTable();
  }, []);

  const userData = useSelector((state: RootState) => state.user.userData);
  const userExtraInfo = useSelector(
    (state: RootState) => state.user.userExtraInfo
  );
  console.log(userData);
  console.log(userExtraInfo);

  return (
    <table id="myDataTable" className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>DOB or Age</th>
          <th>Sex</th>
          <th>Mobile</th>
          <th>ID Type</th>
          <th>ID number</th>
          <th>Address</th>
          <th>State</th>
          <th>Country</th>
          <th>City</th>
          <th>Pin Code</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="info">{userData.firstName}</td>
          <td className="info">{userData.dob}</td>
          <td className="info">{userData.sex}</td>
          <td className="info">{userData.mobile}</td>
          <td className="info">{userData.idType}</td>
          <td className="info">{userData.id}</td>
          <td className="info">{userExtraInfo.address}</td>
          <td className="info">{userExtraInfo.state}</td>
          <td className="info">{userExtraInfo.country}</td>
          <td className="info">{userExtraInfo.city}</td>
          <td className="info">{userExtraInfo.pinCode}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default MyDataTableComponent;
