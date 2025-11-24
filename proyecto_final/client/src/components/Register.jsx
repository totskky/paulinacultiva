import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography, Stack, CircularProgress } from "@mui/material";
import { useToast, ToastContainer } from "../components/Toast";
import { COLORS } from "../utils/colors";
export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toasts, showToast, removeToast, closeToast } = useToast();
  const onChange = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setError("");
  };
  const registerUser = async () => {
    // Prevenir múltiples envíos
    if (loading) return;
    // Validación de campos vacíos
    if (!form.username || !form.email || !form.password) {
      setError("Completá todos los campos");
      showToast("Por favor, completá todos los campos", "error", 3000);
      return;
    }
    // Validación de username (mínimo 3 caracteres)
    if (form.username.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres");
      showToast("El nombre de usuario debe tener al menos 3 caracteres", "error", 3000);
      return;
    }
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("El email no es válido");
      showToast("Por favor, ingresa un email válido", "error", 3000);
      return;
    }
    // Validación de contraseña (mínimo 6 caracteres)
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      showToast("La contraseña debe tener al menos 6 caracteres", "error", 3000);
      return;
    }
    // Validación de coincidencia de contraseñas
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      showToast("Las contraseñas no coinciden", "error", 3000);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:3000/users", {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      if (data.success) {
        // En desarrollo, mostrar el código en la consola
        if (data.verificationCode) {
          console.log("🔢 Código de verificación (desarrollo):", data.verificationCode);
        }

        showToast("📧 Email enviado! Revisa tu bandeja de entrada para completar el registro", "success", 4000);

        // Navegar a la página de verificación
        setTimeout(() => {
          navigate("/email-verification", {
            state: {
              email: form.email,
              verificationCode: data.verificationCode,
              isNewRegistration: true // Indicar que es un registro nuevo
            }
          });
        }, 1500);
      } else {
        throw new Error(data.message || "Error en el registro");
      }
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.response?.data?.errors?.[0] || "Error al registrarse. Intenta nuevamente";
      setError(errorMessage);
      showToast(errorMessage, "error", 4000);
      console.error(e);
      setLoading(false);
    }
  };
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !loading) {
      event.preventDefault();
      registerUser();
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
            bgcolor: COLORS.paperBg,
            borderRadius: 3,
            boxShadow: `0 6px 20px ${COLORS.subtleShadow}`,
            border: `1px solid ${COLORS.divider}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{ mb: 2.5, fontWeight: 700, color: COLORS.principal, fontFamily: "'Lora', serif" }}
          >
            Crear cuenta
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: COLORS.mutedText, fontFamily: "'Dancing Script', cursive" }}>
            Unite a Paulina Cultiva para compartir recetas y saberes
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Nombre de usuario"
              type="text"
              value={form.username}
              onChange={(e) => onChange("username", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: COLORS.divider },
                  "&:hover fieldset": { borderColor: COLORS.claro },
                  "&.Mui-focused fieldset": { borderColor: COLORS.principal },
                  color: COLORS.oscuro
                },
                "& label": { color: COLORS.oscuro },
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: COLORS.divider },
                  "&:hover fieldset": { borderColor: COLORS.claro },
                  "&.Mui-focused fieldset": { borderColor: COLORS.principal },
                  color: COLORS.oscuro
                },
                "& label": { color: COLORS.oscuro },
              }}
            />
            <TextField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: COLORS.divider },
                  "&:hover fieldset": { borderColor: COLORS.claro },
                  "&.Mui-focused fieldset": { borderColor: COLORS.principal },
                  color: COLORS.oscuro
                },
                "& label": { color: COLORS.oscuro },
              }}
            />
            <TextField
              label="Confirmar contraseña"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: COLORS.divider },
                  "&:hover fieldset": { borderColor: COLORS.claro },
                  "&.Mui-focused fieldset": { borderColor: COLORS.principal },
                  color: COLORS.oscuro
                },
                "& label": { color: COLORS.oscuro },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={registerUser}
              disabled={loading}
              sx={{
                py: 1.1,
                fontWeight: 700,
                bgcolor: COLORS.principal,
                color: "#fff",
                "&:hover": { bgcolor: COLORS.oscuro },
                borderRadius: 2,
                textTransform: "none",
                "&.Mui-disabled": {
                  bgcolor: COLORS.principal,
                  color: "#fff",
                  opacity: 0.7
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Registrando...</span>
                </Box>
              ) : (
                "Registrarme"
              )}
            </Button>
            {error && (
              <Typography variant="body2" sx={{ color: COLORS.principal, fontWeight: 600 }}>
                {error}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              ¿Ya tenés cuenta?{" "}
              <Link
                to="/login"
                style={{
                  color: COLORS.principal,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Iniciá sesión
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
