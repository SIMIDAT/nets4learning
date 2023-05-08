import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
//import reportWebVitals from "./reportWebVitals";

import App from "./App";

const app = (<BrowserRouter><App /></BrowserRouter>);


ReactDOM.render(app, document.getElementById("root"));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
if (process.env.REACT_APP_ENVIRONMENT === "production") {
  // reportWebVitals()
}