// 3rd Party
import { createClient } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "./useCreateClient";
import { useDispatch } from "react-redux";

const LOGIN_INFO = {
  PHARMACY_ID: (id) => ["Request", "requests", id],
};

const login = async ({ queryKey }) => {
  const userId = queryKey[2];
  const { data, error } = await supabase
    .from("pharmacy_user")
    .select("uuid,id, pharmacy (name,city_id,district_id,neighbourhood_id)")
    .eq("id", id);
  if (error) {
    // console.log("error");
  }
  if (data) {
    return data;
  }
};

const useLogin = (id) => {
  return useQuery(LOGIN_INFO.PHARMACY_ID(id), login);
};

export default useLogin;
