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
  ALL: ["Finished-Request", "FinishedRequests"],
  DETAIL: (finished_request_id, id, pharmacy_id) => [
    "Finished-Request",
    "finishedRequestDetails",
    finished_request_id,
    id,
    pharmacy_id,
  ],
};

const fetchFinishedRequests = async ({ pharmacy_id }) => {
  const { data: responses, error } = await supabase
    .from("response")
    .select("id,request_id, pharmacy_id, create_date")
    .eq("status", 2)
    .eq("pharmacy_id", pharmacy_id);

  if (error) return [];

  const requestIds = responses.map(({ request_id }) => request_id);

  const { data: userInfo, error: userInfoError } = await supabase
    .from("request")
    .select("id, message_text")
    .in("id", requestIds)
    .eq("status", 2);

  if (userInfoError) return [];

  debugger;

  const userInfoMap = new Map(
    userInfo.map(({ id, message_text }) => [id, { message_text }])
  );

  return responses.map((response) => {
    const {  message_text } = userInfoMap.get(response.request_id) || {};
    return { ...response, message_text };
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

const useGetFinishedRequests = () => {
  // Call `useSelector` at the top level
  const pharmacy_id = useSelector(selectUserPharmacyId);

  // Pass the Redux values to the asynchronous function
  return useQuery(ANSWERED_REQUEST_KEYS.ALL, () =>
    fetchFinishedRequests({ pharmacy_id })
  );
};

const useGetRequestDetails = (request_id, id, pharmacy_id) => {
  return useQuery(
    ANSWERED_REQUEST_KEYS.DETAIL(request_id, id, pharmacy_id),
    getRequestDetails,
    {
      enabled: !!id,
    }
  );
};

export { useGetFinishedRequests, useGetRequestDetails };
