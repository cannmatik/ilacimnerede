import { supabase } from "@routes/Login/useCreateClient";
import { useQuery } from "@tanstack/react-query";

const REQUEST_KEYS = {
  ALL: ["Request", "requests"],
  DETAIL: (id) => ["Request", "requestDetails", id],
};

async function getRequest() {
  const { data, error } = await supabase.from("user_request").select();
  if (error) {
    console.log("error");
  }
  if (data) {
    debugger;
    return data;
  }
}

async function getRequestDetails({ queryKey }) {
  const id = queryKey[2];
  const { data, error } = await supabase
    .from("request_item")
    .select()
    .eq("request_id", id);
  if (error) {
    console.log("error");
  }
  if (data) {
    debugger;
    return data;
  }
}
const useGetRequest = (onSuccess) => {
  return useQuery(REQUEST_KEYS.ALL, getRequest, {
    onSuccess,
  });
};

const useGetRequestDetails = (id) => {
  return useQuery(REQUEST_KEYS.DETAIL(id), getRequestDetails, {
    enabled: !!id,
  });
};

export { useGetRequest, useGetRequestDetails };
