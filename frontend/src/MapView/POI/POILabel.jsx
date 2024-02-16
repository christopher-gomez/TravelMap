import React from "react";

export default function POILabel({ title, interactable }) {
  let className = "poi-label";
  if (interactable) className += " interactable";
  return <div className={className}>{title}</div>;
}
