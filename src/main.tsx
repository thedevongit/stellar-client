import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { Provider } from "react-redux";
import stores from "./stores/index";

/**
 * Application Entry Point
 * Renders the root component with necessary providers
 * - React.StrictMode: Enables additional development checks
 * - AppKitProvider: Provides Web3 functionality throughout the app
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={stores}>
        <App />
    </Provider>
  </React.StrictMode>
);
