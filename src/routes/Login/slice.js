import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  session: null,
  userId: null,
  pharmacyId: null,
  pharmacyCityId: null,
  pharmacyDistrictId: null,
  pharmacyNeighbourhoodId: null,
  isLoggedIn: false,
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    setUser: (state, { payload }) => {
      debugger;
      state.data = payload;
      state.userId = payload.id;
      state.pharmacyId = payload.pharmacyId;
      state.pharmacyCityId = payload.pharmacyCityId;
      state.pharmacyDistrictId = payload.pharmacyDistrictId;
      state.pharmacyNeighbourhoodId = payload.pharmacyNeighbourhoodId;
      state.isLoggedIn = true;
    },
    setSession: (state, { payload }) => {
      if (payload) {
        state.session = payload;
        state.isLoggedIn = true;
      }
    },
  },
});

export const { setUser, setSession } = loginSlice.actions;

export default loginSlice.reducer;
