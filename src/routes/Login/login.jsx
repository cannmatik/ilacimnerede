import { Auth } from "@supabase/auth-ui-react";
import { useNavigate } from "react-router-dom";
import {
  // Import predefined theme

  ThemeSupa,
} from "@supabase/auth-ui-shared";
import { useDispatch } from "react-redux";
import useLogin from "./queries";
import { setSession, setUser } from "./slice";
import { supabase } from "./useCreateClient";
import "./style.scss";

function Login() {
  const dispatch = useDispatch();

  // const { handleSubmit } = useForm({});

  // const onSuccess = ({ user }) => {
  //   debugger;
  //   dispatch(setUser(user));
  // };
  // const { mutate } = useLogin(onSuccess);
  // const onSubmit = (form) => {
  //   mutate(form);
  // };

  const {
    data: { subscription },
  } = supabase?.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      console.log("/success in login");
      dispatch(setSession(session));
      dispatch(setUser(session.user));
      // TODO: daha iyi yöntem
      location.replace("/success");
    } else {
      // dispatch(setUser(null));
      localStorage.clear();
      setTimeout(() => {
        dispatch({ type: "CLEAR_STORE" });
      }, 2);
      console.log("/");
    }
  });

  return (
    <div>
      <div className="App-header">
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
      </div>
      {/* <form onSubmit={handleSubmit(onSubmit)}>
        <button type="submit" className="login-button">
          <span>Login</span>
        </button>
      </form> */}
    </div>
  );
}

export default Login;
