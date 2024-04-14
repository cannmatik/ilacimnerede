import { combineReducers } from "@reduxjs/toolkit";

import loginReducer from "@routes/Login/slice";

const allReducers = combineReducers({
  user: loginReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "CLEAR_STORE") {
    return allReducers(undefined, action);
  }
  return allReducers(state, action);
};

export default rootReducer;
