import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import Flatpickr from "react-flatpickr";
import { Spin, Empty } from "antd";
import { useGetPharmacyDuties, useUpdatePharmacyDuty } from "./queries";
import { selectUserPharmacyId } from "@store/selectors";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import { customTrLocale } from "./locale";

import "./dutyStyle.scss";
import "flatpickr/dist/flatpickr.min.css";

export default function DutySelection() {
  /* ---- Data ---- */
  const pharmacyId = useSelector(selectUserPharmacyId);
  const { data: dutyDates = [], isLoading } = useGetPharmacyDuties(pharmacyId);
  const { mutate: updateDuty, isLoading: isUpdating } =
    useUpdatePharmacyDuty(pharmacyId);

  /* ---- State ---- */
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs().format("YYYY-MM"));
  const [isDutyListExpanded, setIsDutyListExpanded] = useState(true);
  const [isAddingDuties, setIsAddingDuties] = useState(false); // Track adding state
  const flatpickrRef = useRef(null);

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

  const handleDateChange = (dates) => {
    const normalizedDates = dates.map((date) =>
      dayjs(date).format("YYYY-MM-DD")
    );
    setSelectedDates(normalizedDates);
  };

  /* Toplu ekle */
  const addSelectedDuties = useCallback(async () => {
    const toAdd = selectedDates.filter((d) => {
      const key = dayjs(d).format("YYYY-MM-DD");
      return !dutySet.has(key);
    });

    if (toAdd.length === 0) {
      setSelectedDates([]);
      if (flatpickrRef.current?.flatpickr) {
        flatpickrRef.current.flatpickr.clear();
      }
      return;
    }

    setIsAddingDuties(true);
    try {
      const updatePromises = toAdd.map(
        (d) =>
          new Promise((resolve, reject) => {
            updateDuty(
              { duty_date: dayjs(d).format("YYYY-MM-DD"), action: "add" },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
          })
      );

      await Promise.all(updatePromises);

      // Clear selections
      setSelectedDates([]);
      if (flatpickrRef.current?.flatpickr) {
        flatpickrRef.current.flatpickr.clear();
      }
    } catch (error) {
      console.error("Failed to add duties:", error);
    } finally {
      setIsAddingDuties(false);
    }
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

  /* Seçili günleri ay-bazlı grupla */
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

  /* Debug logging */
  useEffect(() => {
    console.log("selectedDates:", selectedDates);
    console.log("groupedSelected:", groupedSelected);
    console.log("isAddingDuties:", isAddingDuties);
  }, [selectedDates, groupedSelected, isAddingDuties]);

  /* Toggle collapsible section */
  const toggleDutyList = () => {
    setIsDutyListExpanded((prev) => !prev);
  };

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
                  ref={flatpickrRef}
                  key={selectedDates.join(",")}
                  value={selectedDates}
                  onChange={handleDateChange}
                  onMonthChange={onMonthChange}
                  options={{
                    mode: "multiple",
                    dateFormat: "Y-m-d",
                    locale: customTrLocale,
                    inline: true,
                    onDayCreate,
                  }}
                />

                {/* Ayın nöbet günleri (Collapsible) */}
                <div className="duty-month-duties">
                  <h3
                    onClick={toggleDutyList}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 0",
                    }}
                  >
                    {dayjs(currentMonth + "-01")
                      .locale("tr")
                      .format("MMMM YYYY")}{" "}
                    Nöbet Günleri
                    <ExpandMoreIcon
                      style={{
                        transform: isDutyListExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s",
                        marginLeft: "8px",
                      }}
                    />
                  </h3>
                  <Collapse in={isDutyListExpanded}>
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
                  </Collapse>
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
                      <strong>{month}: </strong>
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
                    disabled={isUpdating || isAddingDuties || selectableCount === 0}
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
                      : "Eklenebilir Tarih Yok"}
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