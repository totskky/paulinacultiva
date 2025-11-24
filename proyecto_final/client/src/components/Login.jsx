// src/components/Login.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography, Stack, Link, CircularProgress } from "@mui/material";
import { ToastContainer, useToast } from "../components/Toast";
import { COLORS } from "../utils/colors";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // toasts con animación (ya configurados en Toast.jsx)
  const { toasts, showToast, removeToast, closeToast } = useToast();

  // Mostrar mensaje de estado si viene de otra página
  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, "success", 3000);
      // Limpiar el estado para que no se muestre nuevamente
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.message]);

  const fetchLogin = async () => {
    // Prevenir múltiples envíos
    if (loading) return;

    // validación simple en cliente
    if (!email || !password) {
      showToast("Completá email y contraseña", "error", 3000);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:3000/login", {
        email,
        password,
      });

          // Login exitoso normal
      if (data.success && data.token) {
        localStorage.setItem("token", data.token);

        // éxito con animación
        showToast("¡Inicio de sesión exitoso!", "success", 2000);

        // pequeño delay para que el usuario vea el toast
        setTimeout(() => {
          navigate("/inicio");
        }, 1200);
      }
    } catch (e) {
      // mensajes típicos: 401 credenciales inválidas / message del backend
      const status = e.response?.status;
      const backendMsg =
        e.response?.data?.message || e.response?.data?.errors?.[0];

      const msg =
        status === 401
          ? "Email o contraseña incorrectos"
          : backendMsg || "Error al iniciar sesión. Intenta nuevamente";

      // Manejar caso de cuenta desactivada
      if (status === 403 && backendMsg && backendMsg.includes("Cuenta desactivada")) {
        // Redirigir a pantalla especial de cuenta desactivada
        navigate("/inactive-account", {
          state: { email: email }
        });
        return;
      }

      // Manejar caso de email no verificado
      if (e.response?.data?.requiresEmailVerification) {
        showToast("Debes verificar tu email antes de iniciar sesión", "warning", 4000);
        setTimeout(() => {
          navigate("/email-verification", {
            state: {
              email: email,
              fromLogin: true
            }
          });
        }, 2000);
        return;
      }

      // error con animación; limpiamos el password para reintentar
      setPassword("");
      showToast(msg, "error", 3000);
      console.error(e);
      setLoading(false); // Solo en caso de error
    }
    // NOTA: No setLoading(false) aquí - la animación continua hasta la redirección
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !loading) {
      event.preventDefault();
      fetchLogin();
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} closeToast={closeToast} />

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: COLORS.fondoClaro,
          color: COLORS.bodyText,
          p: 2,
        }}
      >
        <Paper
          elevation={8}
          onKeyDown={handleKeyPress}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 420,
            textAlign: "center",
            bgcolor: "background.paper",
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme) => `0 6px 20px ${theme.palette.shadow || "rgba(0,0,0,0.06)"}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 2.5,
              fontWeight: 700,
              color: COLORS.principal,       // same as Register title
              fontFamily: "'Lora', serif",
            }}
          >
            Iniciar sesión
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: COLORS.mutedText, fontFamily: "'Dancing Script', cursive" }}>
            Bienvenide de vuelta a Paulina Cultura
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              color="primary"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: COLORS.divider },
                  "&:hover fieldset": { borderColor: COLORS.claro },
                  "&.Mui-focused fieldset": { borderColor: COLORS.principal, boxShadow: `0 0 0 6px ${COLORS.principal}11` },
                },
                "& label": { color: COLORS.oscuro },
                "& .MuiInputLabel-root": { color: COLORS.oscuro },
                "& .Mui-focused": { color: COLORS.principal }
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              color="primary"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: COLORS.divider },
                  "&:hover fieldset": { borderColor: COLORS.claro },
                  "&.Mui-focused fieldset": { borderColor: COLORS.principal, boxShadow: `0 0 0 6px ${COLORS.principal}11` },
                },
                "& label": { color: COLORS.oscuro },
                "& .MuiInputLabel-root": { color: COLORS.oscuro },
                "& .Mui-focused": { color: COLORS.principal }
              }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={fetchLogin}
              disabled={loading}
              sx={{
                py: 1.1,
                fontWeight: 700,
                borderRadius: 2,
                textTransform: "none",
                "&.Mui-disabled": {
                  bgcolor: "primary.main",
                  color: "#fff",
                  opacity: 0.7
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Iniciando sesión...</span>
                </Box>
              ) : (
                "Entrar"
              )}
            </Button>

            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              ¿No tenés cuenta?{" "}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none" }}
              >
                Registrate acá
              </Link>
            </Typography>

            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
              ¿Olvidaste tu contraseña?{" "}
              <Link
                component={RouterLink}
                to="/forgot-password"
                sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none" }}
              >
                Recupérala acá
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
