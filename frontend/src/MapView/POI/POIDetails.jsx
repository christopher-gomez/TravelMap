import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import "./POIDetails.css";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Skeleton,
  TextField,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  ArrowForward,
  Cancel,
  Delete,
  Done,
  Edit,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ChipSelectMenu } from "../../Util/MultipleSelect";

var options = { weekday: "short", month: "short", day: "numeric" };

const DateComponent = ({
  date,
  day,
  googleAccount,
  setLoginPopupOpen,
  onUpdateDate,
  calculateDay,
  isEditingTitle,
  canEdit,
}) => {
  const [settingDate, setSettingDate] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);

  const [dateControl, setDateControl] = useState({ start: null, end: null });

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
        <Box
          style={{
            display: "inline-flex",
            flexFlow: "row",
            placeItems: "center",
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
              {canEdit && (
                <IconButton
                  sx={{
                    p: 0,
                    position: "absolute",
                    pl: 1,
                    position: "absolute",
                    height: "fit-content",
                    placeContent: "center",
                    placeItems: "center",
                    verticalAlign: "middle", // Align the icon vertically with the text
                  }}
                  onClick={() => {
                    if (!googleAccount) {
                      setLoginPopupOpen(true);
                      return;
                    }

                    setSettingDate(true);
                  }}
                >
                  <Edit />
                </IconButton>
              )}
            </span>
          )}
        </Box>
      )}
      {canEdit && !date && !settingDate && (
        <Button
          variant="contained"
          onClick={() => {
            if (!googleAccount) {
              setLoginPopupOpen(true);
              return;
            }

            setSettingDate(true);
          }}
          sx={{ mt: isEditingTitle ? 2 : 1, mb: 1 }}
        >
          Add Date
        </Button>
      )}
      {settingDate && (
        <div style={{ display: "flex", flexFlow: "column", marginTop: "8px" }}>
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
          <Button
            variant="contained"
            onClick={() => setSettingDate(false)}
            sx={{ mb: 1 }}
          >
            Done
          </Button>
        </div>
      )}
    </>
  );
};

const Title = ({
  title,
  googleAccount,
  setLoginPopupOpen,
  onUpdateTitle,
  onEditingTitle,
  canEdit,
}) => {
  const [settingTitle, setSettingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  useEffect(() => {
    setNewTitle(title);
    setSettingTitle(false);
  }, [title]);

  useEffect(() => {
    onEditingTitle(settingTitle);
  }, [settingTitle]);

  let content;
  if (Array.isArray(title)) {
    content = title.map((t, i) => (
      <h1 className="poi-title" key={title + "-title"}>
        {t}
        {i !== title.length - 1 && ","}
      </h1>
    ));
  } else if (!title) {
    content = null;
  } else {
    content = (
      <>
        {!settingTitle ? (
          <Box sx={{ display: "inline-flex", placeItems: "baseline" }}>
            <h1 className="poi-title">
              {title}
              {canEdit && (
                <IconButton
                  onClick={() => {
                    if (!googleAccount) {
                      setLoginPopupOpen(true);
                      return;
                    }

                    setSettingTitle(true);
                  }}
                  size="small"
                  sx={{
                    // pl: 1,
                    // pt: 0,
                    // pb: 0,
                    // mr: -4,
                    p: 0,
                    mt: 1,
                    pl: 1,
                    position: "absolute",
                    height: "fit-content",
                    placeContent: "center",
                    placeItems: "center",
                    verticalAlign: "middle", // Align the icon vertically with the text
                  }}
                >
                  <Edit />
                </IconButton>
              )}
            </h1>
          </Box>
        ) : (
          <Box
            component="form"
            sx={{
              width: "100%",
              placeItems: "end",
              display: "flex",
            }}
            noValidate
            autoComplete="off"
          >
            <TextField
              id="activity-title-edit"
              label="Title"
              variant="standard"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              sx={{ width: "100%" }}
            />
            <IconButton
              sx={{ pt: 0, pb: 0, alignItems: "end" }}
              size="small"
              onClick={() => {
                setSettingTitle(false);
                onUpdateTitle(newTitle);
              }}
              disabled={newTitle.trim() === ""}
            >
              <Done />
            </IconButton>
          </Box>
        )}
      </>
    );
  }

  return content;
};

const Tags = ({
  tags,
  allTags,
  onTagsUpdated,
  googleAccount,
  setLoginPopupOpen,
  canEdit,
}) => {
  let content;

  const [hovered, setHovered] = useState(null);

  const [controlledTags, setControlledTags] = useState(tags);

  useEffect(() => {
    setControlledTags(tags);
  }, [tags]);

  useEffect(() => {
    if (onTagsUpdated) {
      onTagsUpdated(controlledTags);
    }
  }, [controlledTags]);

  content = (
    <div className="poi-tags">
      {controlledTags &&
        controlledTags.map((tag, i) => (
          <span
            className="poi-tag"
            key={tag + "-tag-" + i}
            onMouseEnter={() => {
              setHovered(i);
            }}
            onMouseLeave={() => {
              setHovered(null);
            }}
          >
            {tag}

            {canEdit &&
              allTags !== undefined &&
              hovered !== null &&
              hovered === i && (
                <IconButton
                  size="small"
                  sx={{ p: 0, display: "inline", position: "absolute" }}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!googleAccount) {
                      setLoginPopupOpen(true);
                      return;
                    }

                    controlledTags.splice(i, 1);
                    setControlledTags([...controlledTags]);
                  }}
                >
                  <Delete />
                </IconButton>
              )}
          </span>
        ))}

      {canEdit && allTags !== undefined && (
        <ChipSelectMenu
          icon={<Add />}
          options={allTags.filter((tag) => {
            if (!controlledTags || controlledTags.length === 0) return true;
            else {
              return controlledTags.indexOf(tag) === -1;
            }
          })}
          onChange={(tag) => {
            if (!googleAccount) {
              setLoginPopupOpen(true);
              return;
            }

            if (Array.isArray(tag) && tag.length > 0) tag = tag[0];
            if (Array.isArray(tag) && tag.length === 0) return;
            if (controlledTags.indexOf(tag) === -1) {
              controlledTags.push(tag);
            }
            setControlledTags([...controlledTags]);
          }}
          multiple={false}
        />
      )}
    </div>
  );

  return content;
};

const Time = ({
  time,
  allTimes,
  canEdit,
  googleAccount,
  setLoginPopupOpen,
  onUpdateTime,
}) => {
  const [controlledTime, setControlledTime] = useState(time);

  useEffect(() => {
    setControlledTime(time);
  }, [time]);

  useEffect(() => {
    if (onUpdateTime) {
      onUpdateTime(controlledTime);
    }
  }, [controlledTime]);

  if (!time) return null;

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "row",
        placeContent: "center",
        alignItems: "center",
      }}
    >
      {allTimes && canEdit && (
        <ChipSelectMenu
          icon={<Edit />}
          iconPlacement="end"
          options={allTimes.filter((opt) => {
            return time !== opt;
          })}
          label={<p className="poi-time">{controlledTime}</p>}
          onChange={(time) => {
            if (!googleAccount) {
              setLoginPopupOpen(true);
              return;
            }

            if (Array.isArray(time) && time.length > 0) time = time[0];
            if (Array.isArray(time) && time.length === 0) return;

            setControlledTime(time);
          }}
          multiple={false}
        />
      )}
      {!allTimes && <span className="poi-time">{time}</span>}
    </div>
  );
};

export const POIDetails = ({
  title,
  image,
  icon,
  tags,
  description,
  day,
  time,
  date,
  hideDescription = true,
  onClick,
  related,
  setFocusedMarker,
  offsetCenter,
  googleAccount,
  setLoginPopupOpen,
  onUpdateDate,
  marker,
  calculateDay,
  link,
  onUpdateTitle,
  allTags,
  onTagsUpdated,
  allTimes,
  onTimeUpdated,
}) => {
  const [curImageIndex, setCurImageIndex] = useState(0);

  const [_date, setDate] = useState(date);
  const [_day, setDay] = useState(day);
  const [_title, setTitle] = useState(title);
  const [_tags, setTags] = useState(tags);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [_time, setTime] = useState(time);

  useEffect(() => {
    if (marker) {
      setDate(marker.date);
      setDay(marker.day);
      setTitle(marker.info);
      setTags(marker.tags);
      setTime(marker.time);
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

      <div
        style={{
          position: "relative",
          width: "calc(100% + 64px)",
          backgroundImage:
            image && Array.isArray(image)
              ? `url(${image[curImageIndex]})`
              : image
              ? `url(${image})`
              : "none",
          height: image ? "400px" : "100px",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          boxShadow: !image ? "none" : "",
        }}
        className="poi-image-container"
      >
        {/* <img
            src={Array.isArray(image) ? image[curImageIndex] : image}
            style={{ width: "100%", height: "400px", marginBottom: ".5em" }}
          /> */}
        {image && Array.isArray(image) && (
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

      {icon && (
        <img
          src={icon.url}
          style={{ height: "50px", width: "50px", marginTop: "1em" }}
        />
      )}

      <Title
        title={_title}
        googleAccount={googleAccount}
        setLoginPopupOpen={setLoginPopupOpen}
        onUpdateTitle={(title) => {
          if (title === _title) return;

          if (marker) marker["info"] = title;
          setTitle(title);
          if (onUpdateTitle) onUpdateTitle(title);
        }}
        onEditingTitle={(editing) => setIsEditingTitle(editing)}
        canEdit={marker !== undefined && marker !== null}
      />
      <DateComponent
        date={_date}
        googleAccount={googleAccount}
        setLoginPopupOpen={setLoginPopupOpen}
        day={_day}
        onUpdateDate={(date) => {
          if (!calculateDay) return;

          if (!date.start && !date.end) {
            return;
          }

          if (date.start === _date.start && date.end === _date.end) return;

          const day = calculateDay(date);

          if (marker) {
            marker["date"] = date;
            marker["day"] = day;
          }

          setDate(date);
          setDay(day);

          if (onUpdateDate) onUpdateDate(date);
        }}
        isEditingTitle={isEditingTitle}
        canEdit={marker !== undefined && marker !== null}
      />
      <Time
        time={_time}
        canEdit={marker !== undefined && marker !== null}
        googleAccount={googleAccount}
        setLoginPopupOpen={setLoginPopupOpen}
        allTimes={allTimes}
        onUpdateTime={(time) => {
          if (time === _time) return;

          if (marker) marker["time"] = time;
          setTime(time);
          if (onTimeUpdated) onTimeUpdated(time);
        }}
      />
      {link && (
        <a href={link} target="_blank" rel="noreferrer">
          Website
        </a>
      )}

      <Tags
        tags={tags}
        allTags={allTags}
        onTagsUpdated={(tags) => {
          if (tags === _tags) return;

          if (marker) marker["tags"] = tags;
          setTags(tags);

          if (onTagsUpdated) onTagsUpdated(tags);
        }}
        googleAccount={googleAccount}
        setLoginPopupOpen={setLoginPopupOpen}
        canEdit={marker !== undefined && marker !== null}
      />

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
