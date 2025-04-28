import { supabase } from "@routes/Login/useCreateClient";
import {
  selectUserCityId,
  selectUserDistrictId,
  selectUserNeighbourhoodId,
  selectUserPharmacyId,
} from "@store/selectors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { message, App } from "antd";
import React, { useState, useMemo, useEffect } from "react";
import moment from "moment";
import "moment/locale/tr";

// Bildirimler için logo yolu
const LOGO_PATH = "/src/assets/ilacimNeredeLogo.svg";

// React Query için sorgu anahtarları
const REQUEST_KEYS = {
  ALL: ["Request", "requests"],
  DETAIL: (id) => ["Request", "requestDetails", id],
  BUFFER: (pharmacy_id) => ["Request", "responseBuffer", pharmacy_id],
};

/**
 * Supabase'ten talepleri şehir, mahalle, ilçe ve eczane filtrelerine göre getir
 */
async function fetchRequests({ city_id, neighbourhood_id, district_id, pharmacy_id }) {
  console.log("fetchRequests - parametreler:", { city_id, neighbourhood_id, district_id, pharmacy_id });
  const { data, error } = await supabase
    .from("request")
    .select("id, create_date, message_text, district_id, city_id, response_count, status")
    .not("status", "eq", 2)
    .eq("city_id", city_id)
    .or(`neighbourhood_id.is.null,neighbourhood_id.eq.${neighbourhood_id}`)
    .or(`district_id.is.null,district_id.eq.${district_id}`);

  if (error) {
    console.error("Talep getirme hatası:", error);
    return [];
  }
  if (!data || data.length === 0) {
    console.log("Talep verisi yok:", data);
    return [];
  }

  console.log("fetchRequests ham verisi:", data);

  let formattedData = data.map((item) => ({
    ...item,
    create_date: item.create_date ? moment(item.create_date).toISOString() : null,
    response_count: item.response_count ?? 0,
    status: item.status,
  }));

  console.log("fetchRequests formatlanmış verisi:", formattedData);

  const { data: unFinishedRequests, error: unfinishedError } = await supabase
    .from("response")
    .select("request_id")
    .eq("pharmacy_id", pharmacy_id);

  if (unfinishedError) {
    console.log("Talepleri filtreleme hatası:", unfinishedError);
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
}

/**
 * Supabase'ten talep detaylarını (request_item) getir
 */
async function getRequestDetails({ queryKey }) {
  const id = queryKey[2];
  console.log("getRequestDetails - request_id:", id);
  const { data, error } = await supabase
    .from("request_item")
    .select("request_id, id, position_no, medicine_id, medicine_qty, medicine (name)")
    .eq("request_id", id);

  if (error) {
    console.error("Talep detayları getirme hatası:", error);
    return [];
  }

  console.log("getRequestDetails ham verisi:", data);

  const formattedData = data.map((item) => ({
    ...item,
    medicine: {
      name: item.medicine?.name || "Bilinmeyen İlaç",
    },
  }));

  console.log("getRequestDetails formatlanmış verisi:", formattedData);

  return formattedData || [];
}

/**
 * Eczanenin response_buffer'daki ilaçlarını getir
 */
async function getResponseBuffer({ queryKey }) {
  const pharmacy_id = queryKey[2];
  console.log("getResponseBuffer - pharmacy_id:", pharmacy_id);
  const { data, error } = await supabase
    .from("response_buffer")
    .select("medicine_id, medicine (name)")
    .eq("pharmacy_id", pharmacy_id);

  if (error) {
    console.error("response_buffer getirme hatası:", error);
    return [];
  }

  console.log("getResponseBuffer verisi:", data);

  return data.map((item) => ({
    medicine_id: item.medicine_id,
    medicine_name: item.medicine?.name || "Bilinmeyen İlaç",
  })) || [];
}

/**
 * response_buffer'dan belirli bir ilacı sil
 */
async function deleteFromResponseBuffer({ pharmacy_id, medicine_id }) {
  console.log("deleteFromResponseBuffer çağrıldı:", { pharmacy_id, medicine_id });
  const { error } = await supabase
    .from("response_buffer")
    .delete()
    .eq("pharmacy_id", pharmacy_id)
    .eq("medicine_id", medicine_id);

  if (error) {
    console.error("deleteFromResponseBuffer hatası:", error);
    throw new Error(`response_buffer silme hatası: ${error.message}`);
  }
  console.log("response_buffer'dan başarıyla silindi:", { pharmacy_id, medicine_id });
}

/**
 * Yeni talepler için tarayıcı bildirimi göster
 */
function showNewRequestNotification(newRow) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("Yeni Talep Geldi!", {
      body: `Talep No: ${newRow.id} - ${newRow.message_text || ""}`,
      icon: LOGO_PATH,
    });
  }
}

/**
 * Talep yanıtını işle, response, response_item ve response_buffer tablolarını güncelle
 */
async function responseRequest(finalData, response) {
  try {
    // response tablosuna ekle
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
      throw new Error(`Response kaydı hatası: ${responseError.message}`);
    }
    const responseId = responseData?.[0]?.id;
    if (!responseId) {
      throw new Error("Response kaydı oluşturulamadı veya ID bulunamadı.");
    }

    // response_item tablosuna ekle
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
      throw new Error(`Response_item kaydı hatası: ${responseItemsError.message}`);
    }

    // request_item durumlarını güncelle
    const updatePromises = finalData.map((item) =>
      supabase
        .from("request_item")
        .update({ status: item.status })
        .eq("id", item.request_item_id)
    );
    const updateResults = await Promise.all(updatePromises);
    for (const result of updateResults) {
      if (result.error) {
        throw new Error(`request_item güncelleme hatası: ${result.error.message}`);
      }
    }

    // Seçilen ilaçları response_buffer'a ekle, kopyaları önle
    const selectedItems = finalData
      .filter((item) => item.status)
      .map((item) => ({
        pharmacy_id: response.pharmacy_id,
        medicine_id: item.medicine_id,
      }));

    if (selectedItems.length > 0) {
      const { data: existingBuffer, error: bufferCheckError } = await supabase
        .from("response_buffer")
        .select("medicine_id")
        .eq("pharmacy_id", response.pharmacy_id)
        .in("medicine_id", selectedItems.map((item) => item.medicine_id));

      if (bufferCheckError) {
        throw new Error(`response_buffer kontrol hatası: ${bufferCheckError.message}`);
      }

      const existingMedicineIds = existingBuffer.map((item) => item.medicine_id);
      const newItems = selectedItems.filter(
        (item) => !existingMedicineIds.includes(item.medicine_id)
      );

      if (newItems.length > 0) {
        const { error: bufferError } = await supabase
          .from("response_buffer")
          .insert(newItems);

        if (bufferError) {
          throw new Error(`response_buffer kaydı hatası: ${bufferError.message}`);
        }
      }
    }

    console.log("Yanıt başarıyla eklendi. Response ID:", responseId);
    return { response: responseData, responseItems: responseItemsData };
  } catch (error) {
    console.error("Hata:", error.message);
    throw error;
  }
}

/**
 * Hook: Tüm talepleri getir ve gerçek zamanlı güncellemeler için abone ol
 */
export const useGetRequest = () => {
  const city_id = useSelector(selectUserCityId);
  const neighbourhood_id = useSelector(selectUserNeighbourhoodId);
  const district_id = useSelector(selectUserDistrictId);
  const pharmacy_id = useSelector(selectUserPharmacyId);
  const queryClient = useQueryClient();

  const { data: allRequests, ...rest } = useQuery(REQUEST_KEYS.ALL, () =>
    fetchRequests({ city_id, neighbourhood_id, district_id, pharmacy_id })
  );

  const [highlightedRequestIds, setHighlightedRequestIds] = useState([]);

  useEffect(() => {
    const subscription = supabase
      .channel("public:request")
      .on("postgres_changes", { event: "*", schema: "public", table: "request" }, (payload) => {
        queryClient.invalidateQueries(REQUEST_KEYS.ALL);

        if (payload.eventType === "INSERT") {
          showNewRequestNotification(payload.new);
          setHighlightedRequestIds((prev) => [...prev, payload.new.id]);
          setTimeout(() => {
            setHighlightedRequestIds((prev) =>
              prev.filter((id) => id !== payload.new.id)
            );
          }, 2000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

  const [hiddenDistrictIds, setHiddenDistrictIds] = useState([]);
  const { districts, cities } = useMemo(() => {
    const uniqueDistricts = new Set();
    const uniqueCities = new Set();

    if (allRequests) {
      allRequests.forEach((request) => {
        uniqueDistricts.add(
          JSON.stringify({ id: request.district_id, name: request.district_id })
        );
        uniqueCities.add(
          JSON.stringify({ id: request.city_id, name: request.city_id })
        );
      });
    }

    return {
      districts: Array.from(uniqueDistricts).map(JSON.parse),
      cities: Array.from(uniqueCities).map(JSON.parse),
    };
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    if (!allRequests) return [];
    return allRequests.filter(
      (request) => !hiddenDistrictIds.includes(request.district_id)
    );
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
    cities,
    highlightedRequestIds,
  };
};

/**
 * Hook: Tek bir talebin detaylarını getir
 */
export const useGetRequestDetails = (id) => {
  const pharmacy_id = useSelector(selectUserPharmacyId);
  return useQuery(
    REQUEST_KEYS.DETAIL(id),
    () => getRequestDetails({ queryKey: REQUEST_KEYS.DETAIL(id), pharmacy_id }),
    {
      enabled: !!id,
    }
  );
};

/**
 * Hook: Eczanenin response_buffer'daki ilaçlarını getir
 */
export const useGetResponseBuffer = () => {
  const pharmacy_id = useSelector(selectUserPharmacyId);
  return useQuery(
    REQUEST_KEYS.BUFFER(pharmacy_id),
    () => getResponseBuffer({ queryKey: REQUEST_KEYS.BUFFER(pharmacy_id) }),
    {
      enabled: !!pharmacy_id,
    }
  );
};

/**
 * Hook: Talep yanıtlama mutasyonu
 */
export const useResponseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ finalData, response }) => responseRequest(finalData, response),
    {
      onSuccess: () => {
        message.success({ content: "Talep başarıyla yanıtlandı!", key: "responseRequest" });
        queryClient.invalidateQueries(REQUEST_KEYS.ALL);
        queryClient.invalidateQueries(REQUEST_KEYS.BUFFER);
      },
      onError: (error) => {
        message.error({ content: "Talep yanıtlanırken hata oluştu: " + error.message, key: "responseRequest" });
      },
    }
  );
};

/**
 * Hook: response_buffer'dan ilaç silme mutasyonu
 */
export const useDeleteFromResponseBuffer = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ pharmacy_id, medicine_id }) => deleteFromResponseBuffer({ pharmacy_id, medicine_id }),
    {
      onSuccess: () => {
        message.success({ content: "İlaç geçici stok listesinden kaldırıldı!", key: "deleteFromResponseBuffer" });
        queryClient.invalidateQueries(REQUEST_KEYS.BUFFER);
      },
      onError: (error) => {
        message.error({ content: "İlaç kaldırılırken hata oluştu: " + error.message, key: "deleteFromResponseBuffer" });
      },
    }
  );
};