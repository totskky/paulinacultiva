// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import PasswordRecovery from "./components/PasswordRecovery.jsx";
import EmailVerification from "./components/EmailVerification.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import InactiveAccountScreen from "./components/InactiveAccountScreen.jsx";
import Home from "./components/Home.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
// Componentes básicos
import AdvancedRecipeForm from "./components/AdvancedRecipeForm.jsx";
import RecipeView from "./components/RecipeView.jsx";
import EditRecipeForm from "./components/EditRecipeForm.jsx";
import Perfil from "./components/Perfil.jsx";
import ModeratorPanel from "./components/ModeratorPanel.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/inactive-account" element={<InactiveAccountScreen />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/inicio"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/nueva-receta"
          element={
            <PrivateRoute>
              <AdvancedRecipeForm />
            </PrivateRoute>
          }
        />


        <Route
          path="/recipes/:id"
          element={
            <PrivateRoute>
              <RecipeView />
            </PrivateRoute>
          }
        />

        <Route
          path="/recipes/:id/edit"
          element={
            <PrivateRoute>
              <EditRecipeForm />
            </PrivateRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          }
        />

        <Route
          path="/configuracion"
          element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          }
        />

        <Route
          path="/moderator"
          element={
            <PrivateRoute>
              <ModeratorPanel />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}