import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { persistor, store } from "@store/index.js";
import { PersistGate } from "redux-persist/integration/react";
import { ConfigProvider } from "antd";
import { Provider } from "react-redux";
import IlacimNeredeQueryClientProvider from "./components/IlacimNeredeQueryClientProvider";
import { AuthProvider } from "react-oidc-context";
import App from "./App";
import moment from "moment";
import "moment/locale/tr";

moment.locale("tr"); // Türkçe ayarını başta yap
console.log("Moment.js dil ayarı (Main.js):", moment.locale()); // Test için konsola yazdır



const theme = {
  token: {
    colorPrimary: "#03EA76",
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <PersistGate persistor={persistor} loading={<h1>loading persist</h1>}>
        <BrowserRouter>
          <Provider store={store}>
            <AuthProvider>
              <IlacimNeredeQueryClientProvider>
                <Suspense fallback={<div>Loading...</div>}>
                  <App />
                </Suspense>
              </IlacimNeredeQueryClientProvider>
            </AuthProvider>
          </Provider>
        </BrowserRouter>
      </PersistGate>
    </ConfigProvider>
  </React.StrictMode>
);
