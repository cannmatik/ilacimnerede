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

  // todo: get pharmacy id

  const getPharmacyId = async (id) => {
    debugger;
    const { data, error } = await supabase
      .from("pharmacy_user")
      .select("uuid,id, pharmacy (name,city_id,district_id,neighbourhood_id)")
      .eq("uuid", id);
    if (error) {
      // console.log("error");
    }
    if (data) {
      return data;
    }
  };

  const {
    data: { subscription },
  } = supabase?.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      // console.log("/success in login");
      dispatch(setSession(session));
      const pharmacyInfo = await getPharmacyId(session.user.id);
      const $session_pharmacy_user = {
        ...session.user,
        pharmacyId: pharmacyInfo[0].id,
        pharmacyCityId: pharmacyInfo[0].pharmacy.city_id,
        pharmacyDistrictId: pharmacyInfo[0].pharmacy.district_id,
        pharmacyNeighbourhoodId: pharmacyInfo[0].pharmacy.neighbourhood_id,
      };
      debugger;
      dispatch(setUser($session_pharmacy_user));
      // TODO: daha iyi yöntem
      location.replace("/home");
    } else {
      // dispatch(setUser(null));
      localStorage.clear();
      setTimeout(() => {
        dispatch({ type: "CLEAR_STORE" });
      }, 2);
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
