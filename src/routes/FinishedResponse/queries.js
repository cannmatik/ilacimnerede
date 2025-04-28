import { supabase } from "@routes/Login/useCreateClient";
import {
  selectUserCityId,
  selectUserDistrictId,
  selectUserNeighbourhoodId,
  selectUserPharmacyId,
} from "@store/selectors";
import { useQuery } from "@tanstack/react-query";
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
  console.log("fetchFinishedRequests - pharmacy_id:", pharmacy_id);
  const { data: responses, error } = await supabase
    .from("response")
    .select("id, request_id, pharmacy_id, create_date")
    .eq("status", 2)
    .eq("pharmacy_id", pharmacy_id);

  if (error) {
    console.error("Tamamlanmış talepler getirme hatası:", error);
    return [];
  }
  console.log("fetchFinishedRequests - responses:", responses);

  const requestIds = responses.map(({ request_id }) => request_id);

  const { data: userInfo, error: userInfoError } = await supabase
    .from("request")
    .select("id, message_text")
    .in("id", requestIds)
    .eq("status", 2);

  if (userInfoError) {
    console.error("Kullanıcı bilgisi getirme hatası:", userInfoError);
    return [];
  }
  console.log("fetchFinishedRequests - userInfo:", userInfo);

  const userInfoMap = new Map(
    userInfo.map(({ id, message_text }) => [id, { message_text }])
  );

  return responses.map((response) => {
    const { message_text } = userInfoMap.get(response.request_id) || {};
    console.log("fetchFinishedRequests - response.create_date (ham):", response.create_date);
    return { 
      ...response, 
      message_text,
      // create_date ham haliyle bırakılacak, formatlama responseColumns.jsx içinde yapılacak
    };
  });
};

async function getRequestDetails({ queryKey }) {
  const request_id = queryKey[2];
  const response_id = queryKey[3];
  console.log("getRequestDetails - request_id:", request_id, "response_id:", response_id);
  const { data, error } = await supabase
    .from("request_item")
    .select(
      "id, request_id, position_no, medicine_id, medicine_qty, medicine (name)"
    )
    .eq("request_id", request_id);
  if (error) {
    console.error("Talep detayları getirme hatası:", error);
    return [];
  }
  console.log("getRequestDetails ham verisi:", data);

  if (data) {
    const { data: itemsStatus, error: itemsError } = await supabase
      .from("response_item")
      .select("request_item_id, response_id, status")
      .eq("response_id", response_id);
    if (itemsError) {
      console.error("Response item getirme hatası:", itemsError);
      return data;
    }
    console.log("itemsStatus:", itemsStatus);

    const finalData = data.map((item) => {
      const statusItem = itemsStatus.find(
        (itemStatus) => itemStatus.request_item_id === item.id
      );
      const status = statusItem ? statusItem.status : false; // Varsayılan değer
      console.log("Item eşleşmesi - item.id:", item.id, "status:", status);
      return {
        ...item,
        status,
        medicine: {
          name: item.medicine?.name || "Bilinmeyen İlaç", // Varsayılan değer
        },
      };
    });

    console.log("getRequestDetails formatlanmış verisi:", finalData);
    return finalData;
  }
  return [];
}

const useGetFinishedRequests = () => {
  const pharmacy_id = useSelector(selectUserPharmacyId);
  console.log("useGetFinishedRequests - pharmacy_id:", pharmacy_id);
  return useQuery(ANSWERED_REQUEST_KEYS.ALL, () =>
    fetchFinishedRequests({ pharmacy_id }),
    {
      enabled: !!pharmacy_id,
    }
  );
};

const useGetRequestDetails = (request_id, id, pharmacy_id) => {
  console.log("useGetRequestDetails - request_id:", request_id, "id:", id);
  return useQuery(
    ANSWERED_REQUEST_KEYS.DETAIL(request_id, id, pharmacy_id),
    getRequestDetails,
    {
      enabled: !!id && !!request_id, // id ve request_id mevcutsa çalışır
      retry: 1, // Hata durumunda 1 kez yeniden dene
      staleTime: 5 * 60 * 1000, // 5 dakika boyunca veriyi taze tut
    }
  );
};

export { useGetFinishedRequests, useGetRequestDetails };