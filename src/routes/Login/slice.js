import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  session: null,
  isLoggedIn: false,
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    setUser: (state, { payload }) => {
      debugger;
      state.data = payload.id;
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
