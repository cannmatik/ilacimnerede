// queries.jsx
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
import React, { useState, useMemo, useEffect } from "react";
import moment from "moment";
import "moment/locale/tr";

// LOGO YOLUNUZ
const LOGO_PATH = "/src/assets/ilacimNeredeLogo.svg";

// React Query Keys
const REQUEST_KEYS = {
  ALL: ["Request", "requests"],
  DETAIL: (id) => ["Request", "requestDetails", id],
};

/**
 * Talep tablosundaki veriyi supabase üzerinden çekme fonksiyonu
 * Şehir / ilçe vb. filtrelere göre request kayıtlarını getirir.
 */
async function fetchRequests({ city_id, neighbourhood_id, district_id, pharmacy_id }) {
  // 1) request tablosunu çek
  const { data, error } = await supabase
    .from("request")
    .select("id, create_date, message_text, district_id, city_id, response_count, status")
    .not("status", "eq", 2) // 2: Kapalı talep
    .eq("city_id", city_id)
    .or(`neighbourhood_id.is.null,neighbourhood_id.eq.${neighbourhood_id}`)
    .or(`district_id.is.null,district_id.eq.${district_id}`);

  if (error) {
    console.error("Request fetch error:", error);
    return [];
  }
  if (!data || data.length === 0) {
    return [];
  }

  // 2) Gelen kayıtları formatla
  let formattedData = data.map((item) => ({
    ...item,
    create_date: moment(item.create_date).locale("tr").format("DD MM YYYY HH:mm"),
    response_count: item.response_count ?? 0,
    status: item.status,
  }));

  // 3) Bu eczanenin yanıtladığı talepleri eleyebilmek için response tablosunu çek
  const { data: unFinishedRequests, error: unfinishedError } = await supabase
    .from("response")
    .select("request_id")
    .eq("pharmacy_id", pharmacy_id);

  if (unfinishedError) {
    console.log("error filtering requests:", unfinishedError);
    return formattedData;
  }

  // 4) Daha önce yanıtlanan talepleri listeden çıkar
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
 * Bir talep detayı (request_item) kaydını çekme fonksiyonu
 */
async function getRequestDetails({ queryKey }) {
  const id = queryKey[2];
  const { data, error } = await supabase
    .from("request_item")
    .select("request_id,id,position_no,medicine_id, medicine_qty, medicine (name)")
    .eq("request_id", id);

  if (error) {
    console.error("getRequestDetails error:", error);
    return [];
  }
  return data || [];
}

/**
 * Yeni talep geldiğinde tarayıcı bildirimi gösterir
 * YALNIZCA Notification.permission === "granted" ise
 */
function showNewRequestNotification(newRow) {
  if (!("Notification" in window)) {
    return; // Tarayıcı bildirim API'si yok
  }

  if (Notification.permission === "granted") {
    new Notification("Yeni Talep Geldi!", {
      body: `Talep No: ${newRow.id} - ${newRow.message_text || ""}`,
      icon: LOGO_PATH,
    });
  }
  // permission === "default" veya "denied" durumunda bir şey yapmıyoruz
}

/**
 * Bir talebe yanıt verildiğinde 'response' ve 'response_item' tablolarına kaydeden fonksiyon
 */
async function responseRequest(finalData, response) {
  try {
    // 1) response tablosuna ekle
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

    // 2) response_item tablosuna ekle
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

    // 3) request_item durumlarını güncelle
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

    console.log("Yanıt başarıyla eklendi. Response ID:", responseId);
    return { response: responseData, responseItems: responseItemsData };
  } catch (error) {
    console.error("Hata:", error.message);
    throw error;
  }
}

/**
 * Hook: Tüm request'leri getirir ve Realtime abonesi ekler
 */
export const useGetRequest = () => {
  const city_id = useSelector(selectUserCityId);
  const neighbourhood_id = useSelector(selectUserNeighbourhoodId);
  const district_id = useSelector(selectUserDistrictId);
  const pharmacy_id = useSelector(selectUserPharmacyId);
  const queryClient = useQueryClient();

  // Ana veriyi çek
  const { data: allRequests, ...rest } = useQuery(REQUEST_KEYS.ALL, () =>
    fetchRequests({ city_id, neighbourhood_id, district_id, pharmacy_id })
  );

  // Realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel("public:request")
      .on("postgres_changes", { event: "*", schema: "public", table: "request" }, (payload) => {
        // Veriyi tazele
        queryClient.invalidateQueries(REQUEST_KEYS.ALL);

        // YENİ talep geldi mi?
        if (payload.eventType === "INSERT") {
          showNewRequestNotification(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

  // Örnek: Şehir/ilçe listesi oluşturma vs
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

  // Filtrelenmiş talepler
  const filteredRequests = useMemo(() => {
    if (!allRequests) return [];
    return allRequests.filter(
      (request) => !hiddenDistrictIds.includes(request.district_id)
    );
  }, [allRequests, hiddenDistrictIds]);

  // Örnek: Belirli ilçe taleplerini gizle/göster
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
  };
};

/**
 * Hook: Tek bir request'in detaylarını çeker
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
 * Hook: Bir talebe yanıt verme (mutation)
 */
export const useResponseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ finalData, response }) => responseRequest(finalData, response),
    {
      onSuccess: () => {
        message.success("Talep başarıyla yanıtlandı!");
        // Tekrar request listesini tazele
        queryClient.invalidateQueries(REQUEST_KEYS.ALL);
      },
      onError: (error) => {
        message.error("Talep yanıtlanırken bir hata oluştu: " + error.message);
      },
    }
  );
};
