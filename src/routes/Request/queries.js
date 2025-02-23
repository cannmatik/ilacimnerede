import { supabase } from "@routes/Login/useCreateClient";
import {
  selectUserCityId,
  selectUserDistrictId,
  selectUserNeighbourhoodId,
  selectUserPharmacyId,
} from "@store/selectors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { message } from "antd";
import { useState, useMemo, useEffect } from "react";
import moment from "moment";
import "moment/locale/tr";

const REQUEST_KEYS = {
  ALL: ["Request", "requests"],
  DETAIL: (id) => ["Request", "requestDetails", id],
};

const fetchRequests = async ({ city_id, neighbourhood_id, district_id, pharmacy_id }) => {
  let { data, error } = await supabase
    .from("request")
    .select("id, create_date, message_text, district_id, city_id, response_count, status")
    .not("status", "eq", 2) // Kapalı talepleri dahil etme
    .eq("city_id", city_id)
    .or(`neighbourhood_id.is.null,neighbourhood_id.eq.${neighbourhood_id}`)
    .or(`district_id.is.null,district_id.eq.${district_id}`);

  if (error) {
    console.log("error", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  let formattedData = data.map(item => ({
    ...item,
    create_date: moment(item.create_date).locale('tr').format("DD MM YYYY HH:mm"),
    response_count: item.response_count ?? 0,
    status: item.status
  }));

  const { data: unFinishedRequests, error: unfinishedError } = await supabase
    .from("response")
    .select("request_id")
    .eq("pharmacy_id", pharmacy_id);

  if (unfinishedError) {
    console.log("error filtering requests:", unfinishedError);
    return formattedData;
  }

  if (unFinishedRequests && unFinishedRequests.length > 0) {
    formattedData = formattedData.filter(
      (item) =>
        !unFinishedRequests.some(
          (unFinishedRequest) => unFinishedRequest.request_id === item.id
        )
    );
  }

  return formattedData;
};

async function getRequestDetails({ queryKey }) {
  const id = queryKey[2];
  const { data, error } = await supabase
    .from("request_item")
    .select("request_id,id,position_no,medicine_id, medicine_qty, medicine (name)")
    .eq("request_id", id);
  if (error) {
    console.log("error");
  }
  if (data) {
    return data;
  }
}

async function responseRequest(finalData, response) {
  try {
    const { data: responseData, error: responseError } = await supabase
      .from("response")
      .insert({
        request_id: response.request_id,
        create_date: response.create_date,
        pharmacy_id: response.pharmacy_id,
        status: response.status,
        message_text: response.message_text,
      })
      .select();

    if (responseError) {
      throw new Error(`Response tablosuna kayıt yapılırken hata oluştu: ${responseError.message}`);
    }

    const responseId = responseData[0]?.id;
    if (!responseId) {
      throw new Error("Response kaydı oluşturulamadı veya ID alınamadı.");
    }

    const responseItems = finalData.map((item) => ({
      response_id: responseId,
      request_item_id: item.request_item_id,
      status: item.status ?? true,
    }));

    const { data: responseItemsData, error: responseItemsError } = await supabase
      .from("response_item")
      .insert(responseItems)
      .select();

    if (responseItemsError) {
      throw new Error(`Response_item tablosuna kayıt yapılırken hata oluştu: ${responseItemsError.message}`);
    }

    const updatePromises = finalData.map((item) =>
      supabase
        .from("request_item")
        .update({ status: item.status })
        .eq("id", item.request_item_id)
    );

    const updateResults = await Promise.all(updatePromises);
    for (const result of updateResults) {
      if (result.error) {
        throw new Error(`Request_item tablosu güncellenirken hata oluştu: ${result.error.message}`);
      }
    }

    console.log("Yanıt başarıyla eklendi. Response ID:", responseId);
    return { response: responseData, responseItems: responseItemsData };
  } catch (error) {
    console.error("Hata:", error.message);
    throw error;
  }
}

const useGetRequest = () => {
  const city_id = useSelector(selectUserCityId);
  const neighbourhood_id = useSelector(selectUserNeighbourhoodId);
  const district_id = useSelector(selectUserDistrictId);
  const pharmacy_id = useSelector(selectUserPharmacyId);
  const [hiddenDistrictIds, setHiddenDistrictIds] = useState([]);
  const queryClient = useQueryClient();

  const { data: allRequests, ...rest } = useQuery(REQUEST_KEYS.ALL, () =>
    fetchRequests({ city_id, neighbourhood_id, district_id, pharmacy_id })
  );

  // Realtime subscription for request table
  useEffect(() => {
    const subscription = supabase
      .channel('public:request')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request' }, (payload) => {
        queryClient.invalidateQueries(REQUEST_KEYS.ALL);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

  const { districts, cities } = useMemo(() => {
    const uniqueDistricts = new Set();
    const uniqueCities = new Set();

    if (allRequests) {
      allRequests.forEach((request) => {
        uniqueDistricts.add(JSON.stringify({ id: request.district_id, name: request.district_id }));
        uniqueCities.add(JSON.stringify({ id: request.city_id, name: request.city_id }));
      });
    }

    return {
      districts: Array.from(uniqueDistricts).map(JSON.parse),
      cities: Array.from(uniqueCities).map(JSON.parse),
    };
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    if (!allRequests) return [];
    return allRequests.filter((request) => !hiddenDistrictIds.includes(request.district_id));
  }, [allRequests, hiddenDistrictIds]);

  const toggleDistrictVisibility = (districtId) => {
    setHiddenDistrictIds((prevHiddenDistrictIds) =>
      prevHiddenDistrictIds.includes(districtId)
        ? prevHiddenDistrictIds.filter((id) => id !== districtId)
        : [...prevHiddenDistrictIds, districtId]
    );
  };

  return {
    data: filteredRequests,
    isLoading: rest.isLoading,
    isError: rest.isError,
    hiddenDistrictIds,
    toggleDistrictVisibility,
    districts,
    cities
  };
};

const useGetRequestDetails = (id) => {
  const pharmacy_id = useSelector(selectUserPharmacyId);
  return useQuery(REQUEST_KEYS.DETAIL(id), () =>
    getRequestDetails({ queryKey: REQUEST_KEYS.DETAIL(id), pharmacy_id }), {
      enabled: !!id,
    }
  );
};

const useResponseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ finalData, response }) => responseRequest(finalData, response),
    {
      onSuccess: () => {
        message.success("Talep başarıyla yanıtlandı!");
        queryClient.invalidateQueries(REQUEST_KEYS.ALL);
      },
      onError: (error) => {
        message.error("Talep yanıtlanırken bir hata oluştu: " + error.message);
      },
    }
  );
};

export { useGetRequest, useGetRequestDetails, useResponseRequest };