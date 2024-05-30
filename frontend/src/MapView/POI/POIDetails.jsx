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
  Rating,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  ArrowForward,
  Cancel,
  Close,
  Delete,
  Done,
  Edit,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ChipSelectMenu } from "../../Util/MultipleSelect";
import { createNewActivity } from "../UpdateLocationProperties";
import EmojiPicker from "emoji-picker-react";
import Popup from "../../Util/Popup";

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
  currentDayFilter,
  allMarkers,
  shouldShow = true,
}) => {
  const [settingDate, setSettingDate] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);

  const [dateControl, setDateControl] = useState({ start: null, end: null });

  useEffect(() => {
    // console.log("date effect: ", date);
    if (date && date.end) {
      setHasEndDate(true);
    }

    if (date) {
      setDateControl(date);
    } else {
      setDateControl({ start: null, end: null });
    }
  }, [date]);

  useEffect(() => {
    if (settingDate && shouldShow) onUpdateDate(dateControl);
  }, [dateControl]);

  useEffect(() => {
    if (
      settingDate &&
      !dateControl.start &&
      !dateControl.end &&
      currentDayFilter &&
      !isNaN(currentDayFilter) &&
      allMarkers !== undefined
    ) {
      const similarMarker = allMarkers.find(
        (m) =>
          m.date &&
          m.day !== null &&
          ((Array.isArray(m.day) && m.day.includes(currentDayFilter)) ||
            m.day === currentDayFilter)
      );
      if (similarMarker) {
        const targetDate = similarMarker.date;
        setDateControl({ start: targetDate.start, end: null });
      }
    }
  }, [settingDate]);

  if (!shouldShow) return null;

  return (
    <>
      {
      // (day || date) && 
      !settingDate && (
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
          {!date && <span className="poi-date row">No date set yet</span>}
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
          <Box
            sx={{
              display: "flex",
              flexFlow: "row",
              gap: 1,
              width: "100%",
              placeContent: "center",
            }}
          >
            {(dateControl.start || dateControl.end) && (
              <Button
                onClick={() => {
                  setDateControl({ start: null, end: null });
                }}
              >
                Clear
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => setSettingDate(false)}
              sx={{ mb: 1 }}
            >
              Done
            </Button>
          </Box>
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
          <Box
            sx={{
              display: "inline-flex",
              placeItems: "baseline",
            }}
          >
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
  shouldShow = true,
}) => {
  let content;

  const [hovered, setHovered] = useState(null);

  const [controlledTags, setControlledTags] = useState(tags);

  useEffect(() => {
    setControlledTags(tags);
  }, [tags]);

  useEffect(() => {
    if (onTagsUpdated && shouldShow) {
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

  if (!shouldShow) return null;

  return content;
};

const Time = ({
  time,
  allTimes,
  canEdit,
  googleAccount,
  setLoginPopupOpen,
  onUpdateTime,
  shouldShow = true,
}) => {
  const [controlledTime, setControlledTime] = useState(time);

  useEffect(() => {
    setControlledTime(time);
  }, [time]);

  useEffect(() => {
    if (onUpdateTime && shouldShow) {
      onUpdateTime(controlledTime);
    }
  }, [controlledTime]);

  // if (!time) return null;

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
          icon={time ? <Edit /> : undefined}
          deleteIcon={time ? <Delete /> : <Add />}
          onDelete={time ? () => setControlledTime(null) : undefined}
          openOnDelete={time ? false : true}
          options={allTimes.filter((opt) => {
            if (opt === "Not Set") return false;

            if (!time) return true;

            return time !== opt;
          })}
          label={
            <p className="poi-time">{time ? controlledTime : "Add Time"}</p>
          }
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

const IconComponent = ({
  icon,
  shouldShow = true,
  onEmojiSelect,
  googleAccount,
  setLoginPopupOpen,
  canEdit,
}) => {
  const [addingIcon, setAddingIcon] = useState(false);

  useEffect(() => {
    setAddingIcon(false);
  }, [icon]);

  return (
    <>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          placeContent: "center",
          placeItems: "center",
        }}
      >
        {icon && (
          <img
            src={icon.url}
            style={{
              height: "50px",
              width: "50px",
              marginTop: "1em",
              cursor: canEdit ? "pointer" : "default",
            }}
            onClick={() => {
              if (canEdit) {
                if (!googleAccount) {
                  setLoginPopupOpen(true);
                  return;
                }

                setAddingIcon(true);
              }
            }}
          />
        )}
        {!icon && shouldShow && (
          <IconButton
            sx={{ marginTop: ".5em" }}
            onClick={() => {
              if (!googleAccount) {
                setLoginPopupOpen(true);
                return;
              }

              setAddingIcon(true);
            }}
          >
            <Add />
          </IconButton>
        )}
        {addingIcon && (
          <IconButton
            sx={{ placeSelf: "end", justifySelf: "end", alignSelf: "end" }}
            onClick={() => {
              setAddingIcon(false);
            }}
          >
            <Close />
          </IconButton>
        )}
      </Box>

      {addingIcon && (
        <EmojiPicker
          onEmojiClick={(emoji) => {
            setAddingIcon(false);
            onEmojiSelect(emoji.emoji, emoji.imageUrl);
          }}
        />
      )}
    </>
  );
};

export const POIDetails = ({
  title,
  image,
  getPlacePhotos,
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
  currentDayFilter,
  allMarkers,
  address,
  onNewActivity,
  onNewEmojiIconSet,
  onConfirmDelete,
  onActivityMouseOver,
  onActivityMouseOut,
  canEdit,
}) => {
  const [curImageIndex, setCurImageIndex] = useState(0);

  useEffect(() => {
    return () => {
      setCurImageIndex(0);
    };
  }, []);

  const [_date, setDate] = useState(date);
  const [_day, setDay] = useState(day);
  const [_title, setTitle] = useState(title);
  const [_tags, setTags] = useState(tags);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [_time, setTime] = useState(time);
  const [isPlacesPOI, setIsPlacesPOI] = useState(false);
  const [_icon, setIcon] = useState(icon);
  const [_image, setImage] = useState(image);

  const [imageLoading, setImageLoading] = useState(
    _image !== null && _image !== undefined && _image.length > 0 ? false : true
  );

  useEffect(() => {
    if (imageLoading) {
      if (getPlacePhotos && marker)
        getPlacePhotos(marker, (photos) => {
          if (!photos || photos.length === 0) return;

          setImage(photos);
          setImageLoading(false);
        });
    }
  }, [imageLoading]);

  useEffect(() => {
    if (marker && canEdit) {
      setDate(marker.date);
      setDay(marker.day);
      setTitle(marker.info);
      setTags(marker.tags);
      setTime(marker.time);
      setIsPlacesPOI(marker.isPlacesPOI !== undefined ? true : false);
      setIcon(marker.icon);
    }
  }, [marker]);

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <>
      <div
        className="content"
        style={{ cursor: onClick ? "pointer" : "default" }}
        onClick={onClick}
        onPointerOver={() => {
          if (onActivityMouseOver) onActivityMouseOver();
        }}
        onPointerOut={() => {
          if (onActivityMouseOut) onActivityMouseOut();
        }}
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

        {!imageLoading || !marker ? (
          <div
            style={{
              position: "relative",
              width: "calc(100% + 64px)",
              backgroundImage:
                _image && Array.isArray(_image)
                  ? `url(${_image[curImageIndex]})`
                  : _image
                  ? `url(${_image})`
                  : "none",
              height: _image ? "400px" : "100px",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: !_image ? "none" : "",
            }}
            className="poi-image-container"
          >
            {/* <img
            src={Array.isArray(image) ? image[curImageIndex] : image}
            style={{ width: "100%", height: "400px", marginBottom: ".5em" }}
          /> */}
            {_image && Array.isArray(_image) && (
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
                        (curImageIndex - 1 + _image.length) % _image.length
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
                      setCurImageIndex((curImageIndex + 1) % _image.length);
                    }}
                  >
                    <ArrowForward sx={{ color: "white" }} />
                  </IconButton>
                </div>
                <div style={{ position: "absolute", right: 10, top: "90%" }}>
                  <small style={{ color: "white" }}>
                    {curImageIndex + 1}/{_image.length}
                  </small>
                </div>
              </>
            )}
          </div>
        ) : marker ? (
          <Skeleton
            sx={{
              position: "relative",
              width: "calc(100% + 64px)",
              height: "400px",
            }}
          />
        ) : null}
        <Box
          sx={{
            position: "flex",
            width: "100%",
            placeContent: "center",
            placeItems: "center",
            position: "relative",
          }}
        >
          {canEdit && marker && !marker.isPlacesPOI && (
            <IconButton
              sx={{ position: "absolute", left: 0, ml: "-32px" }}
              onClick={() => setConfirmingDelete(true)}
            >
              <Delete />
            </IconButton>
          )}
          <IconComponent
            icon={_icon}
            shouldShow={_icon || (marker && !marker.isPlacesPOI)}
            onEmojiSelect={(emoji, img) => {
              setIcon({
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(
                    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text y="50%" x="50%" dominant-baseline="middle" text-anchor="middle" font-size="40">${emoji}</text></svg>`
                  ),
              });
              onNewEmojiIconSet(marker, emoji);
            }}
            googleAccount={googleAccount}
            setLoginPopupOpen={setLoginPopupOpen}
            canEdit={
              (canEdit &&
                marker &&
                marker.iconType &&
                marker.iconType === "emoji") ||
              (marker && !marker.icon)
            }
          />
        </Box>
        {marker && marker.isPlacesPOI ? (
          <Typography
            variant="subtitle2"
            sx={{
              mt: 2,
              mb: 0,
              fontStyle: "italic",
              fontSize: ".8em !important",
            }}
          >
            Suggested Place of Interest
          </Typography>
        ) : null}
        <Title
          setMarginTop={!icon}
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
          canEdit={
            canEdit &&
            marker !== undefined &&
            marker !== null &&
            !marker.isPlacesPOI
          }
        />
        {address && (
          <Typography variant="subtitle2" className="poi-address">
            {address}
          </Typography>
        )}
        {/* {link && ( */}
        {/* )} */}
        <DateComponent
          date={_date}
          googleAccount={googleAccount}
          setLoginPopupOpen={setLoginPopupOpen}
          day={_day}
          onUpdateDate={(date) => {
            if (!calculateDay) return;

            // console.log("on update date: ", date);

            if (!date.start && !date.end) {
              // console.log("date has no start or end");
              if (_date && (_date.start !== null || _date.end !== null)) {
                if (canEdit && marker) {
                  marker["date"] = date;
                  marker["day"] = null;
                }

                setDate({ start: null, end: null });
                setDay(null);

                if (onUpdateDate) onUpdateDate(date);
              }
              return;
            }

            if (
              date !== null &&
              _date !== null &&
              date !== undefined &&
              _date !== undefined &&
              date.start === _date.start &&
              date.end === _date.end
            )
              return;

            const day = calculateDay(date);

            if (canEdit && marker) {
              marker["date"] = date;
              marker["day"] = day;
            }

            setDate(date);
            setDay(day);

            if (onUpdateDate) onUpdateDate(date);
          }}
          isEditingTitle={isEditingTitle}
          canEdit={
            canEdit &&
            marker !== undefined &&
            marker !== null &&
            !marker.isPlacesPOI
          }
          currentDayFilter={currentDayFilter}
          allMarkers={allMarkers}
          shouldShow={
            (_date !== null && _date !== undefined) ||
            (
              // canEdit &&
              marker !== undefined &&
              marker !== null &&
              !marker.isPlacesPOI)
          }
        />
        <Time
          time={_time}
          canEdit={
            canEdit &&
            marker !== undefined &&
            marker !== null &&
            !marker.isPlacesPOI
          }
          googleAccount={googleAccount}
          setLoginPopupOpen={setLoginPopupOpen}
          allTimes={allTimes}
          onUpdateTime={(time) => {
            if (time === _time) return;

            if (canEdit && marker) marker["time"] = time;
            setTime(time);
            if (onTimeUpdated) onTimeUpdated(time);
          }}
          shouldShow={
            (_time !== null && _time !== undefined) ||
            (canEdit &&
              marker !== undefined &&
              marker !== null &&
              !marker.isPlacesPOI)
          }
        />
        {canEdit && marker && (
          <a
            href={
              "https://www.google.com/search?q=" +
              encodeURIComponent(marker.placesSearchName ?? marker.info)
            }
            target="_blank"
            rel="noreferrer"
            style={{ marginBottom: ".5em" }}
          >
            Google
          </a>
        )}
        <Tags
          tags={tags}
          allTags={allTags}
          onTagsUpdated={(tags) => {
            if (tags === _tags) return;

            if (canEdit && marker) marker["tags"] = tags;
            setTags(tags);

            if (onTagsUpdated) onTagsUpdated(tags);
          }}
          googleAccount={googleAccount}
          setLoginPopupOpen={setLoginPopupOpen}
          canEdit={
            canEdit &&
            marker !== undefined &&
            marker !== null &&
            !marker.isPlacesPOI
          }
          shouldShow={
            (tags !== null && tags !== undefined) ||
            (canEdit &&
              marker !== undefined &&
              marker !== null &&
              !marker.isPlacesPOI)
          }
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
            <h4 style={{ marginBottom: "8px", paddingLeft: "16px" }}>
              Related
            </h4>
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

        {marker && marker.isPlacesPOI && marker.rating && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexFlow: "column",
              placeContent: "center",
              placeItems: "center",
              mb: marker.types ? 0 : 1,
            }}
          >
            <Rating readOnly value={marker.rating} precision={0.5} />
            {marker.userRatingsTotal && (
              <Typography variant="caption">
                {marker.userRatingsTotal}{" "}
                {marker.userRatingsTotal === 1 ? "review" : "reviews"}
              </Typography>
            )}
          </Box>
        )}

        {marker && marker.isPlacesPOI && marker.types && (
          <Box sx={{ width: "100%", mb: 2 }}>
            <Tags
              tags={marker.types.map((t) => {
                return (t[0].toUpperCase() + t.slice(1)).replaceAll("_", " ");
              })}
              canEdit={false}
            />
          </Box>
        )}

        {marker && marker.isPlacesPOI && (
          <Button
            variant="contained"
            onClick={async () => {
              if (!googleAccount) {
                setLoginPopupOpen(true);
                return;
              }

              await createNewActivity(marker, googleAccount);
              marker.isPlacesPOI = undefined;
              setIsPlacesPOI(false);
              onNewActivity(marker);
            }}
          >
            Add to Trip Itinerary Places of Interest
          </Button>
        )}

        {/* <div className="poi-extra-info">
        </div> */}
      </div>
      {/* {confirmingDelete && ( */}
      <Popup
        title={"Confirm Activity Delete"}
        // setOpen={confirmingDelete}
        open={confirmingDelete}
        dividers
        actions={[
          <Button
            variant="outlined"
            onClick={() => {
              setConfirmingDelete(false);
            }}
          >
            Cancel
          </Button>,
          <Button
            onClick={() => {
              setConfirmingDelete(false);

              if (!googleAccount) {
                setLoginPopupOpen(true);
                return;
              }

              onConfirmDelete(marker);
            }}
            variant="contained"
            sx={{ backgroundColor: "#C70000", color: "white" }}
          >
            Confirm
          </Button>,
        ]}
      >
        <Typography>Are you sure you want to delete this activity?</Typography>
      </Popup>
      {/* )} */}
    </>
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
