// 3rd Party
import { createClient } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "./useCreateClient";
import { useDispatch } from "react-redux";

// const dispatch = useDispatch();

// const login = () =>
//   supabase?.auth.onAuthStateChange(async (event, session) => {
//     if (event === "SIGNED_IN") {
//       console.log("/success in queries");
//       dispatch(setUser(session.user));
//     } else {
//       // dispatch(setUser(null));
//       localStorage.clear();
//       setTimeout(() => {
//         dispatch({ type: "CLEAR_STORE" });
//       }, 2);
//       console.log("/");
//     }
//   });

const useLogin = (onSuccess) =>
  useMutation(login, {
    onSuccess,
  });

export default useLogin;
