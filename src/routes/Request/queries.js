import { supabase } from "@routes/Login/useCreateClient";
import { useMutation, useQuery } from "@tanstack/react-query";

const REQUEST_KEYS = {
  ALL: ["Request", "requests"],
  DETAIL: (id) => ["Request", "requestDetails", id],
};

async function getRequest() {
  const city_id = 34;
  const neighbourhood_id = 1;
  const district_id = 1;
  const pharmacy_id = "34000418";
  let { data, error } = await supabase
    .from("user_request")
    .select("id, create_date, tc_no, prescript_no")
    .eq("city_id", city_id)
    .or(`neighbourhood_id.eq.${neighbourhood_id}, neighbourhood_id.is.null`) // Neighbourhood condition
    .or(`district_id.eq.${district_id}, district_id.is.null`); // District condition
  if (error) {
    console.log("error");
  }
  if (data) {
    debugger;
    const { data: unFinishedRequests } = await supabase
      .from("response")
      .select()
      .eq("pharmacy_id", pharmacy_id);
    if (unFinishedRequests) {
      data = data.filter(
        (item) =>
          !unFinishedRequests.some(
            (unFinishedRequest) => unFinishedRequest.request_id === item.id
          )
      );
    }
    return data;
  }
}

async function getRequestDetails({ queryKey }) {
  const id = queryKey[2];
  const { data, error } = await supabase
    .from("request_item")
    .select("request_id,position_no,medicine_id, medicine_qty, medicine (name)")
    .eq("request_id", id);
  if (error) {
    console.log("error");
  }
  if (data) {
    return data;
  }
}

async function responseRequest(response) {
  debugger;
  const { data, error } = await supabase.from("response_item").insert(response);
  if (error) {
    console.log("error");
  }
  if (data) {
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

const useResponseRequest = () => {
  return useMutation(responseRequest);
};

export { useGetRequest, useGetRequestDetails, useResponseRequest };
