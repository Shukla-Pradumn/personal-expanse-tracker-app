// userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserData {
  firstName: string;
  dob: any;
  mobile: string;
  sex: string;
  id: any;
  idType: any;
}

interface UserExtraInfo {
  address: string;
  state: string;
  city: string;
  country: string;
  pinCode: any;
}

interface UserState {
  userData: UserData;
  userExtraInfo: UserExtraInfo; // Add the userExtraInfo field
}

const initialState: UserState = {
  userData: {
    firstName: '',
    dob: '',
    mobile: '',
    sex: '',
    id: '',
    idType: '',
  },
  userExtraInfo: {
    address: '',
    state: '',
    city: '',
    country: '',
    pinCode: '',
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUserData: (state, action: PayloadAction<UserData>) => {
      state.userData = { ...state.userData, ...action.payload };
    },
    resetUserData: (state) => {
      state.userData = initialState.userData;
    },
    updateUserExtraInfo: (state, action: PayloadAction<UserExtraInfo>) => {
      state.userExtraInfo = { ...state.userExtraInfo, ...action.payload };
    },
    resetUserExtraInfo: (state) => {
      state.userExtraInfo = initialState.userExtraInfo;
    },
  },
});

export const {
  updateUserData,
  resetUserData,
  updateUserExtraInfo, // Add this action
  resetUserExtraInfo,
} = userSlice.actions;
export default userSlice.reducer;
