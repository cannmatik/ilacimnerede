import { supabase } from "@routes/Login/useCreateClient";
import {
  selectUserCityId,
  selectUserDistrictId,
  selectUserNeighbourhoodId,
  selectUserPharmacyId,
} from "@store/selectors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";

const REQUEST_KEYS = {
  ALL: ["Request", "requests"],
  DETAIL: (id) => ["Request", "requestDetails", id],
};

const getUser = () => {
  debugger;
  const pharmacist = useSelector(
    (state) => state.user.data.role.userRoleDetails
  );
  return pharmacist;
};

const fetchRequests = async ({
  city_id,
  neighbourhood_id,
  district_id,
  pharmacy_id,
}) => {
  let { data, error } = await supabase
    .from("user_request")
    .select("id, create_date, tc_no, prescript_no")
    .not("status", "eq", 2)
    .eq("city_id", city_id)
    .or(`neighbourhood_id.is.null,neighbourhood_id.eq.${neighbourhood_id}`)
    .or(`district_id.is.null,district_id.eq.${district_id}`);

  if (error) {
    console.log("error");
    return [];
  }

  if (data) {
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
  }

  return data;
};

async function getRequestDetails({ queryKey }) {
  const id = queryKey[2];
  const { data, error } = await supabase
    .from("request_item")
    .select(
      "request_id,id,position_no,medicine_id, medicine_qty, medicine (name)"
    )
    .eq("request_id", id);
  if (error) {
    console.log("error");
  }
  if (data) {
    return data;
  }
}

async function responseRequest(finalData, response) {
  debugger;
  const { data: responseData } = await supabase
    .from("response")
    .insert(response)
    .select();

  const { data: r } = await supabase.from("response").select();

  if (responseData) {
    console.log("error");
  }
  const finalResponseItems = finalData.map((item) => {
    return { ...item, response_id: responseData[0]?.id };
  });
  const { data, error } = await supabase
    .from("response_item")
    .insert(finalResponseItems);
  if (error) {
    console.log("error");
  }
  if (data) {
    return data;
  }
}

const useGetRequest = () => {
  // Call `useSelector` at the top level
  const city_id = useSelector(selectUserCityId);
  const neighbourhood_id = useSelector(selectUserNeighbourhoodId);
  const district_id = useSelector(selectUserDistrictId);
  const pharmacy_id = useSelector(selectUserPharmacyId);

  // Pass the Redux values to the asynchronous function
  return useQuery(REQUEST_KEYS.ALL, () =>
    fetchRequests({ city_id, neighbourhood_id, district_id, pharmacy_id })
  );
};

const useGetRequestDetails = (id) => {
  return useQuery(REQUEST_KEYS.DETAIL(id), getRequestDetails, {
    enabled: !!id,
  });
};

const useResponseRequest = () => {
  debugger;
  const queryClient = useQueryClient();
  return useMutation(
    ({ finalData, response }) => responseRequest(finalData, response),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(REQUEST_KEYS.ALL); // Adjust the query key as needed
      },
    }
  );
};

export { useGetRequest, useGetRequestDetails, useResponseRequest };
