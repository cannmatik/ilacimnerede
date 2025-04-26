import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Flatpickr from "react-flatpickr";
import { Spin, Empty } from "antd";
import { useGetPharmacyDuties, useUpdatePharmacyDuty } from "./queries";
import { selectUserPharmacyId } from "@store/selectors";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";

import "./dutyStyle.scss";
import "flatpickr/dist/flatpickr.min.css";

dayjs.locale("tr");

/* Flatpickr Türkçe locale */
const customTrLocale = {
  weekdays: {
    shorthand: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
    longhand: [
      "Pazar",
      "Pazartesi",
      "Salı",
      "Çarşamba",
      "Perşembe",
      "Cuma",
      "Cumartesi",
    ],
  },
  months: {
    shorthand: [
      "Oca",
      "Şub",
      "Mar",
      "Nis",
      "May",
      "Haz",
      "Tem",
      "Ağu",
      "Eyl",
      "Eki",
      "Kas",
      "Ara",
    ],
    longhand: [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ],
  },
  firstDayOfWeek: 1,
};

export default function DutySelection() {
  /* ---- Data ---- */
  const pharmacyId = useSelector(selectUserPharmacyId);
  const { data: dutyDates = [], isLoading } = useGetPharmacyDuties(pharmacyId);
  const { mutate: updateDuty, isLoading: isUpdating } =
    useUpdatePharmacyDuty(pharmacyId);

  /* ---- State ---- */
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs().format("YYYY-MM"));

  /* ---- Helpers ---- */
  const dutySet = useMemo(
    () => new Set(dutyDates.map((d) => d.duty_date)),
    [dutyDates]
  );

  const currentMonthDuties = useMemo(() => {
    return dutyDates
      .filter(({ duty_date }) => duty_date?.startsWith(currentMonth))
      .sort((a, b) => a.duty_date.localeCompare(b.duty_date))
      .map(({ duty_date }) => ({
        date: duty_date,
        pretty: dayjs(duty_date).locale("tr").format("DD MMMM YYYY"),
      }));
  }, [dutyDates, currentMonth]);

  const onDayCreate = (_sel, _dateStr, _fp, dayElem) => {
    const isOther =
      dayElem.classList.contains("prevMonthDay") ||
      dayElem.classList.contains("nextMonthDay");
    const date = dayjs(dayElem.dateObj).format("YYYY-MM-DD");

    dayElem.classList.toggle("duty-marker", !isOther && dutySet.has(date));
  };

  const onMonthChange = (_sel, _dateStr, inst) => {
    const newMonth = dayjs(
      new Date(inst.currentYear, inst.currentMonth, 1)
    ).format("YYYY-MM");
    setCurrentMonth(newMonth);
  };

  /* Toplu ekle */
  const addSelectedDuties = useCallback(() => {
    const toAdd = selectedDates.filter((d) => {
      const key = dayjs(d).format("YYYY-MM-DD");
      return !dutySet.has(key);
    });

    toAdd.forEach((d) =>
      updateDuty({
        duty_date: dayjs(d).format("YYYY-MM-DD"),
        action: "add",
      })
    );
  }, [selectedDates, dutySet, updateDuty]);

  /* Eklenebilir gün sayısı */
  const selectableCount = useMemo(
    () =>
      selectedDates.reduce((acc, d) => {
        const key = dayjs(d).format("YYYY-MM-DD");
        return dutySet.has(key) ? acc : acc + 1;
      }, 0),
    [selectedDates, dutySet]
  );

  /* Seçili günleri ay-bazlı grupla (ör. “Nisan 12, 13, 24”) */
  const groupedSelected = useMemo(() => {
    const obj = {};
    selectedDates.forEach((d) => {
      const monthKey = dayjs(d).locale("tr").format("MMMM YYYY");
      const dayNo = dayjs(d).format("D");
      const isDuty = dutySet.has(dayjs(d).format("YYYY-MM-DD"));
      if (!obj[monthKey]) obj[monthKey] = [];
      obj[monthKey].push({ dayNo, isDuty });
    });
    return obj;
  }, [selectedDates, dutySet]);

  /* ---------- UI ---------- */
  return (
    <div className="main-content">
      <div className="duty-request-container">
        <div className="duty-wrapper">
          {/* ----------- Takvim ----------- */}
          <div className="duty-table-container">
            {isLoading ? (
              <div className="duty-spinner-container">
                <Spin size="large" />
              </div>
            ) : (
              <div className="duty-calendar duty-fade-in">
                <Flatpickr
                  value={selectedDates}
                  onChange={setSelectedDates}
                  onMonthChange={onMonthChange}
                  options={{
                    mode: "multiple",
                    dateFormat: "Y-m-d",
                    locale: customTrLocale,
                    inline: true,
                    onDayCreate,
                  }}
                />

                {/* Ayın nöbet günleri */}
                <div className="duty-month-duties">
                  <h3>
                    {dayjs(currentMonth + "-01")
                      .locale("tr")
                      .format("MMMM YYYY")}{" "}
                    Nöbet Günleri
                  </h3>
                  {currentMonthDuties.length === 0 ? (
                    <p>Bu ay nöbet günü yok.</p>
                  ) : (
                    <ul>
                      {currentMonthDuties.map((d) => (
                        <li key={d.date}>
                          {d.pretty}
                          <IconButton
                            onClick={() =>
                              updateDuty({ duty_date: d.date, action: "remove" })
                            }
                            disabled={isUpdating}
                            size="small"
                            className="duty-remove-icon"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ----------- Seçili Günler + Buton ----------- */}
          <div className="duty-request-table">
            <div className="duty-list duty-fade-in">
              {selectedDates.length === 0 ? (
                <div className="duty-empty">
                  <Empty description="Lütfen bir veya daha fazla tarih seçin." />
                </div>
              ) : (
                <>
                  {/* Kompakt ay satırları */}
                  {Object.entries(groupedSelected).map(([month, days]) => (
                    <div className="compact-month-row" key={month}>
                      <strong>{month}:&nbsp;</strong>
                      {days
                        .sort((a, b) => a.dayNo - b.dayNo)
                        .map((d, i) => (
                          <span
                            key={i}
                            className={d.isDuty ? "already-duty" : undefined}
                          >
                            {d.dayNo}
                            {i < days.length - 1 ? ", " : ""}
                          </span>
                        ))}
                    </div>
                  ))}

                  <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={addSelectedDuties}
                    disabled={isUpdating || selectableCount === 0}
                    sx={{
                      mt: 2,
                      alignSelf: "flex-end",
                      backgroundColor: "#1abc9c",
                      "&:hover": { backgroundColor: "#169a85" },
                      "&.Mui-disabled": { backgroundColor: "#ccc" },
                      textTransform: "none",
                      fontSize: "15px",
                      px: 3,
                      py: 1.2,
                      borderRadius: "6px",
                    }}
                  >
                    {selectableCount
                      ? `Nöbet Ekle (${selectableCount})`
                      : "Eklenebilecek Tarih Yok"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
