import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/global.css";
import { palette } from "./styles/palette";
Object.entries(palette).forEach(([name, value]) =>
  document.documentElement.style.setProperty(`--${name}`, value),
);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
