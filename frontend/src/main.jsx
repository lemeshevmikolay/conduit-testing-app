import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import AuthProvider from "./context/AuthContext";
import "./styles.css";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
const Article = lazy(() => import("./routes/Article/Article"));
const CommentsSection = lazy(() => import("./routes/Article/CommentsSection"));
const ArticleEditor = lazy(() => import("./routes/ArticleEditor"));
const Home = lazy(() => import("./routes/Home"));
const HomeArticles = lazy(() => import("./routes/HomeArticles"));
const Login = lazy(() => import("./routes/Login"));
const FinishRegistration = lazy(() => import("./routes/FinishRegistration"));
const ForgotPassword = lazy(() => import("./routes/ForgotPassword"));
const NotFound = lazy(() => import("./routes/NotFound"));
const Profile = lazy(() => import("./routes/Profile/Profile"));
const ProfileArticles = lazy(() => import("./routes/Profile/ProfileArticles"));
const ProfileFavArticles = lazy(() => import("./routes/Profile/ProfileFavArticles"));
const Settings = lazy(() => import("./routes/Settings"));
const SignUp = lazy(() => import("./routes/SignUp"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <Suspense fallback={<div className="route-loading">Завантаження…</div>}>
          <Routes>
              <Route element={<App />}>
                <Route path="/" element={<Home />}>
                  <Route index element={<HomeArticles />} />
                </Route>

                <Route path="login" element={<Login />} />
                <Route path="register" element={<SignUp />} />
                <Route path="finish-registration" element={<FinishRegistration />} />
                <Route path="forgot-password" element={<ForgotPassword />} />

                <Route path="settings" element={<Settings />} />

                <Route path="editor" element={<ArticleEditor />}>
                  <Route path=":slug" element={<ArticleEditor />} />
                </Route>

                <Route path="article/:slug" element={<Article />}>
                  <Route index element={<CommentsSection />} />
                </Route>

                <Route path="profile/:username" element={<Profile />}>
                  <Route index element={<ProfileArticles />} />
                  <Route path="favorites" element={<ProfileFavArticles />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
  );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
