import { supabase } from "@routes/Login/useCreateClient";
import { selectUserPharmacyId } from "@store/selectors";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";

const DUTY_KEYS = {
  ALL: ["Pharmacy-Duty", "DutyDates"],
};

const fetchPharmacyDuties = async ({ pharmacy_id }) => {
  const { data, error } = await supabase
    .from("pharmacy_duty")
    .select("id, duty_date")
    .eq("id", pharmacy_id);

  if (error) return [];

  return data.map((duty) => ({
    ...duty,
    duty_date: duty.duty_date,
  }));
};

const updatePharmacyDuty = async ({ pharmacy_id, duty_date, action }) => {
  if (action === "add") {
    const { error } = await supabase
      .from("pharmacy_duty")
      .insert([{ id: pharmacy_id, duty_date }]);
    if (error) throw error;
  } else if (action === "remove") {
    const { error } = await supabase
      .from("pharmacy_duty")
      .delete()
      .eq("id", pharmacy_id)
      .eq("duty_date", duty_date);
    if (error) throw error;
  }
};

const useGetPharmacyDuties = () => {
  const pharmacy_id = useSelector(selectUserPharmacyId);
  return useQuery(DUTY_KEYS.ALL, () => fetchPharmacyDuties({ pharmacy_id }));
};

const useUpdatePharmacyDuty = (pharmacy_id) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ duty_date, action }) =>
      updatePharmacyDuty({ pharmacy_id, duty_date, action }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(DUTY_KEYS.ALL);
      },
    }
  );
};

export { useGetPharmacyDuties, useUpdatePharmacyDuty };