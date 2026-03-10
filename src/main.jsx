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
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const antdTheme = {
  token: {
    colorPrimary: "#03EA76",
  },
};

const muiTheme = createTheme({
  palette: {
    primary: { main: "#0097b2" },
    secondary: { main: "#25b597" },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ConfigProvider theme={antdTheme}>
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
    </ThemeProvider>
  </React.StrictMode>
);
