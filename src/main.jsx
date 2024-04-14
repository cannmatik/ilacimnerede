import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import Login from "./routes/Login/login.jsx";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  BrowserRouter as Router,
  BrowserRouter,
} from "react-router-dom";
import Success from "./Pages/Success.jsx";
import Layout from "./layout";
import { persistor, store } from "@store/index.js";
import { PersistGate } from "redux-persist/integration/react";
import { ConfigProvider } from "antd";
import { Provider } from "react-redux";
import IlacimNeredeQueryClientProvider from "./components/IlacimNeredeQueryClientProvider";
import { AuthProvider } from "react-oidc-context";
import App from "./App";

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
                <App />
              </IlacimNeredeQueryClientProvider>
            </AuthProvider>
          </Provider>
        </BrowserRouter>
      </PersistGate>
    </ConfigProvider>
  </React.StrictMode>
);
