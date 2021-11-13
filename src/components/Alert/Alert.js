import React from "react";

import "./Alert.css";

function Alert(props) {
  const { text, isVisible } = props;

  if (!isVisible) {
    return null;
  }

  return (
    <div className="alert">
      { (text ? text : ("Проблемы с сервером - попробуйте повторить запрос позже.")) }
    </div>
  );
}

export default Alert;
