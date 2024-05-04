import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import "./POIDetails.css";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Skeleton,
} from "@mui/material";
import { ArrowBack, ArrowForward, Edit } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

var options = { weekday: "short", month: "short", day: "numeric" };

const DateSetter = ({
  date,
  day,
  googleAccount,
  onUpdateDate,
  calculateDay,
}) => {
  const [settingDate, setSettingDate] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);

  const [dateControl, setDateControl] = useState({ start: null, end: null });

  console.log("date", date);

  useEffect(() => {
    if (date && date.end) {
      setHasEndDate(true);
    }

    if (date) {
      setDateControl(date);
    }
  }, [date]);

  useEffect(() => {
    if (dateControl.start || dateControl.end) {
      onUpdateDate(dateControl);
    }
  }, [dateControl]);

  return (
    <>
      {(day || date) && !settingDate && (
        <div
          style={{
            display: "flex",
            flexFlow: "row",
            placeContent: "center",
            alignItems: "center",
            // width: "100%",
          }}
        >
          {date && (
            <span className="poi-date row">
              {`${new Date(dayjs(date.start)).toLocaleDateString(
                "en-US",
                options
              )}${
                date.end
                  ? " - " +
                    new Date(dayjs(date.end)).toLocaleDateString(
                      "en-US",
                      options
                    )
                  : ""
              }`}{" "}
              -{" "}
            </span>
          )}
          {day && (
            <span className="poi-day row">
              {Array.isArray(day)
                ? "Days " + day[0] + "-" + day[day.length - 1]
                : "Day " + day}
            </span>
          )}
          {googleAccount && (
            <IconButton
              onClick={() => {
                setSettingDate(true);
              }}
            >
              <Edit />
            </IconButton>
          )}
        </div>
      )}
      {!date && googleAccount && !settingDate && (
        <Button variant="contained" onClick={() => setSettingDate(true)}>
          Add Date
        </Button>
      )}
      {settingDate && (
        <div style={{ display: "flex", flexFlow: "column" }}>
          <div
            style={{
              display: "flex",
              placeContent: "space-evenly",
              marginBottom: 10,
            }}
          >
            <DatePicker
              label={!hasEndDate ? "Date" : "Start Date"}
              sx={{ maxWidth: "50%" }}
              value={dayjs(dateControl.start)}
              onChange={(date) => {
                setDateControl({ ...dateControl, start: date });
              }}
            />
            {hasEndDate && (
              <DatePicker
                label={"End Date"}
                sx={{ maxWidth: "50%" }}
                value={dayjs(dateControl.end)}
                onChange={(date) => {
                  setDateControl({ ...dateControl, end: date });
                }}
              />
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasEndDate}
                  onChange={(e, checked) => {
                    setHasEndDate(checked);
                  }}
                />
              }
              sx={{ mr: -1 }}
              label={<small style={{ textWrap: "nowrap" }}>End Date</small>}
            />
          </div>
          <Button variant="contained" onClick={() => setSettingDate(false)}>
            Done
          </Button>
        </div>
      )}
    </>
  );
};

export const POIDetails = ({
  title,
  image,
  icon,
  tags,
  description,
  day,
  date,
  hideDescription = true,
  onClick,
  related,
  setFocusedMarker,
  offsetCenter,
  googleAccount,
  onUpdateDate,
  marker,
  calculateDay,
  link,
}) => {
  const [curImageIndex, setCurImageIndex] = useState(0);

  const [_date, setDate] = useState(date);
  const [_day, setDay] = useState(day);

  useEffect(() => {
    if (marker) {
      setDate(marker.date);
      setDay(marker.day);
    }
  }, [marker]);

  return (
    <div
      className="content"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      {/* {date && (
        <span className="poi-date">{`${new Date(date.start).toLocaleDateString(
          "en-US",
          options
        )}${
          date.end
            ? " - " + new Date(date.end).toLocaleDateString("en-US", options)
            : ""
        }`}</span>
      )}
      {day && (
        <span className="poi-day">
          {Array.isArray(day)
            ? "Days: " + day[0] + "-" + day[day.length - 1]
            : "Day: " + day}
        </span>
      )} */}

      {title && (
        <>
          {image && (
            <div style={{ position: "relative" }}>
              <img
                src={Array.isArray(image) ? image[curImageIndex] : image}
                style={{ width: "100%", height: "400px", marginBottom: ".5em" }}
              />
              {Array.isArray(image) && (
                <>
                  <div
                    style={{
                      position:
                        "absolute" /* Positioned absolutely inside the relative parent */,
                      top: "40%" /* Center vertically */,
                      left: 0 /* Stretch from left to right */,
                      right: 0,
                      display: "flex",
                      justifyContent:
                        "space-between" /* Space out the arrow buttons */,
                      alignItems: "center" /* Center the buttons vertically */,
                    }}
                  >
                    <IconButton
                      sx={{
                        background: "rgba(0, 0, 0, 0.5)",
                        ml: 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurImageIndex(
                          (curImageIndex - 1 + image.length) % image.length
                        );
                      }}
                    >
                      <ArrowBack sx={{ color: "white" }} />
                    </IconButton>
                    <IconButton
                      sx={{
                        background: "rgba(0, 0, 0, 0.5)",
                        mr: 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurImageIndex((curImageIndex + 1) % image.length);
                      }}
                    >
                      <ArrowForward sx={{ color: "white" }} />
                    </IconButton>
                  </div>
                  <div style={{ position: "absolute", right: 10, top: "90%" }}>
                    <small style={{ color: "white" }}>
                      {curImageIndex + 1}/{image.length}
                    </small>
                  </div>
                </>
              )}
            </div>
          )}
          {icon && (
            <img src={icon.url} style={{ height: "50px", width: "50px" }} />
          )}
          {Array.isArray(title) ? (
            title.map((t, i) => (
              <h1 className="poi-title" key={title + "-title"}>
                {t}
                {i !== title.length - 1 && ","}
              </h1>
            ))
          ) : (
            <h1 className="poi-title">{title}</h1>
          )}
        </>
      )}
      <DateSetter
        date={_date}
        googleAccount={googleAccount}
        day={_day}
        onUpdateDate={(date) => {
          if (!calculateDay) return;

          console.log("updating date", date);
          if (!date.start && !date.end) {
            return;
          }
          const day = calculateDay(date);
          console.log("updating day", day);

          if (marker) {
            marker["date"] = date;
            marker["day"] = day;
          }

          setDate(date);
          setDay(day);
          onUpdateDate(date);
        }}
      />
      {link && (
        <a href={link} target="_blank" rel="noreferrer">
          Website
        </a>
      )}
      {tags && (
        <div className="poi-tags" style={{ marginTop: "1em" }}>
          {tags.map((tag, i) => (
            <span className="poi-tag" key={title + "-tag-" + i}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {description && !hideDescription && (
        <p
          className="poi-description"
          style={{ marginTop: "1em", marginBottom: 0 }}
        >
          {description}
        </p>
      )}
      {!description && !hideDescription && (
        <div
          className="poi-description"
          style={{
            marginTop: "1em",
            marginBottom: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Skeleton
            height={"100%"}
            width={"100%"}
            sx={{ transform: "none !important" }}
          />
        </div>
      )}
      {related && related.length > 0 && (
        <div style={{ display: "flex", flexFlow: "column", width: "100%" }}>
          <h4 style={{ marginBottom: "8px", paddingLeft: "16px" }}>Related</h4>
          <div className="poi-tags" style={{ alignSelf: "center" }}>
            {related.map((related, i) => (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedMarker(related);
                  // offsetCenter(related.position, 0, 70);
                }}
                className="poi-related"
                key={"related" + related.info + "-" + i}
              >
                {related.info}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* <div className="poi-extra-info">
        </div> */}
    </div>
  );
};

export const POIDetailsTitle = ({ title, tags, day, date }) => {
  return (
    <div className="content mobile">
      {title &&
        (Array.isArray(title) ? (
          title.map((t, i) => (
            <h1 className="poi-title" key={title + "-title"}>
              {t}
              {i !== title.length - 1 && ","}
            </h1>
          ))
        ) : (
          <h1 className="poi-title">{title}</h1>
        ))}
      {(day || date) && (
        <div
          style={{
            display: "flex",
            flexFlow: "row",
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: ".5em",
          }}
        >
          {date && (
            <span className="poi-date row">
              {`${new Date(date.start).toLocaleDateString("en-US", options)}${
                date.end
                  ? " - " +
                    new Date(date.end).toLocaleDateString("en-US", options)
                  : ""
              }`}{" "}
              -{" "}
            </span>
          )}
          {day && (
            <span className="poi-day row">
              {Array.isArray(day)
                ? "Days " + day[0] + "-" + day[day.length - 1]
                : "Day " + day}
            </span>
          )}
        </div>
      )}
      {tags && (
        <div className="poi-tags row">
          {tags.map((tag, i) => (
            <span className="poi-tag" key={title + "-tag-" + i}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const POIDetailsDescription = ({ description }) => {
  const [atBottom, setAtBottom] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const scrollableRef = useRef(null);

  useEffect(() => {
    const scrollable = scrollableRef.current;
    // Attach the scroll event listener
    scrollable.addEventListener("scroll", checkScroll);

    // Remove the event listener on cleanup
    return () => {
      scrollable.removeEventListener("scroll", checkScroll);
    };
  }, [scrollableRef]);

  const checkScroll = () => {
    if (scrollableRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
      // Set state based on scroll position
      setAtBottom(scrollTop + clientHeight >= scrollHeight);
      setAtTop(scrollTop === 0);
    }
  };

  return (
    <div className="content mobile">
      {description && (
        <>
          {/* <div className={`scroll-fade-top ${atTop ? "hidden" : ""}`}></div> */}
          <p className="poi-description" ref={scrollableRef}>
            {description}
          </p>
          {/* <div
            className={`scroll-fade-bottom ${atBottom ? "hidden" : ""}`}
          ></div> */}
        </>
      )}
    </div>
  );
};

const POIDetailsCard = ({
  active,
  title,
  tags,
  description,
  onClose,
  day,
  date,
}) => {
  return (
    <div className={`slide-in-div ${active ? "active" : ""}`}>
      {onClose !== undefined && <button onClick={() => onClose()}>X</button>}
      <div className="content">
        {date && (
          <span className="poi-date">{`${new Date(
            date.start
          ).toLocaleDateString("en-US", options)}${
            date.end
              ? " - " + new Date(date.end).toLocaleDateString("en-US", options)
              : ""
          }`}</span>
        )}
        {day && (
          <span className="poi-day">
            {Array.isArray(day)
              ? "Days: " + day[0] + "-" + day[day.length - 1]
              : "Day: " + day}
          </span>
        )}
        {title &&
          (Array.isArray(title) ? (
            title.map((t, i) => (
              <h1 className="poi-title" key={title + "-title"}>
                {t}
                {i !== title.length - 1 && ","}
              </h1>
            ))
          ) : (
            <h1 className="poi-title">{title}</h1>
          ))}
        {tags && (
          <div className="poi-tags">
            {tags.map((tag, i) => (
              <span className="poi-tag" key={title + "-tag-" + i}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {description && (
          <p className="poi-description" style={{ marginTop: "1em" }}>
            {description}
          </p>
        )}
        {/* <div className="poi-extra-info">
        </div> */}
      </div>
    </div>
  );
};

export default POIDetailsCard;
