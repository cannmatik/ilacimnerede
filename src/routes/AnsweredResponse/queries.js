import { supabase } from "@routes/Login/useCreateClient";
import {
  selectUserCityId,
  selectUserDistrictId,
  selectUserNeighbourhoodId,
  selectUserPharmacyId,
} from "@store/selectors";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

const ANSWERED_REQUEST_KEYS = {
  ALL: ["Answered-Request", "AnswredRequests"],
  DETAIL: (request_id, id, pharmacy_id) => [
    "Answered-Request",
    "answeredRequestDetails",
    request_id,
    id,
  ],
};

const fetchAnsweredRequests = async ({ pharmacy_id }) => {
  const { data: responses, error } = await supabase
    .from("response")
    .select("id,request_id, pharmacy_id, create_date")
    .eq("status", 1)
    .eq("pharmacy_id", pharmacy_id);

  if (error) return [];

  const requestIds = responses.map(({ request_id }) => request_id);

  const { data: userInfo, error: userInfoError } = await supabase
    .from("user_request")
    .select("id, tc_no, prescript_no")
    .in("id", requestIds);

  if (userInfoError) return [];

  const userInfoMap = new Map(
    userInfo.map(({ id, tc_no, prescript_no }) => [id, { tc_no, prescript_no }])
  );

  return responses.map((response) => {
    const { tc_no, prescript_no } = userInfoMap.get(response.request_id) || {};
    return { ...response, tc_no, prescript_no };
  });
};

async function getRequestDetails({ queryKey }) {
  debugger;
  const request_id = queryKey[2];
  const response_id = queryKey[3];
  const { data, error } = await supabase
    .from("request_item")
    .select(
      "id,request_id,position_no,medicine_id, medicine_qty, medicine (name)"
    )
    .eq("request_id", request_id);
  if (error) {
    // console.log("error");
  }
  if (data) {
    debugger;
    const { data: itemsStatus, error: itemsError } = await supabase
      .from("response_item")
      .select("request_item_id,response_id,status")
      .eq("response_id", response_id);
    const finalData = data.map((item) => {
      debugger;
      const { status } = itemsStatus.find(
        (itemStatus) => itemStatus.request_item_id === item.id
      );
      return { ...item, status };
    });
    return finalData;
  }
}

const useGetFetchedRequests = () => {
  // Call `useSelector` at the top level
  const pharmacy_id = useSelector(selectUserPharmacyId);

  // Pass the Redux values to the asynchronous function
  return useQuery(ANSWERED_REQUEST_KEYS.ALL, () =>
    fetchAnsweredRequests({ pharmacy_id })
  );
};

const useGetRequestDetails = (request_id, id) => {
  return useQuery(
    ANSWERED_REQUEST_KEYS.DETAIL(request_id, id),
    getRequestDetails,
    {
      enabled: !!id,
    }
  );
};

export { useGetFetchedRequests, useGetRequestDetails };
