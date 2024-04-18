import { supabase } from "@routes/Login/useCreateClient";
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { INButton } from "@components";
import { Row } from "react-grid-system";
import "./style.scss";

const Home = () => {
  const [user, setUser] = useState({});
  const [countries, setCountries] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    getCountries();
  }, []);

  // useEffect(() => {
  //   async function getUserData() {
  //     await supabase.auth?.getUser().then((value) => {
  //       if (value.data?.user) {
  //         console.log(value.data.user, user);
  //         setUser(value.data.user);
  //       }
  //     });
  //   }
  //   getUserData();
  // }, []);

  // TODO: Header içinde olacak

  async function getCountries() {
    const { data, error } = await supabase.from("city").select();
    if (error) {
      console.log("error");
    }
    if (data) {
      setCountries(data);
    }
    debugger;
  }
  return (
    <>
      <h1>Home Page</h1>
      <div className="home-container">
        {/* <ul>
        {countries.map((country) => (
          <li key={country.name}>{country.name}</li>
        ))}
      </ul> */}

        {/* {SupabaseAuthClient.auth?.signOut()} */}
        {/* <button onClick={signOutUser}>Sign out</button> */}
      </div>
    </>
  );
};

export default Home;
