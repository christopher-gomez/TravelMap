import React, { useState } from "react";
import "./POIDetails.css";

const POIDetails = ({ active, title, tags, description, onClose }) => {
  return (
    <div className={`slide-in-div ${active ? "active" : ""}`}>
      {onClose !== undefined && <button onClick={() => onClose()}>X</button>}
      <div className="content">
        {/* <span className="poi-date">Date</span> */}
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
        {description && <p className="poi-description">{description}</p>}
        {/* <div className="poi-extra-info">
        </div> */}
      </div>
    </div>
  );
};

export default POIDetails;
