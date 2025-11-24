import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Box, Paper, TextField, Button, Typography, Stack, Alert, CircularProgress } from "@mui/material";
import { ToastContainer, useToast } from "../components/Toast";
import { COLORS } from "../utils/colors";

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, showToast, removeToast, closeToast } = useToast();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState(location.state?.verificationCode || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Detectar si viene del flujo de registro
  const isFromRegistration = location.state?.fromRegistration || false;

  // Efecto para manejar el cooldown del botón de reenvío
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!email || !code) {
      showToast("Por favor, completa todos los campos", "error", 3000);
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      showToast("El código debe tener 6 dígitos", "error", 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post("http://localhost:3000/verify-email", {
        email,
        code
      });

      if (data.success) {
        setIsVerified(true);
        const isNewRegistration = location.state?.isNewRegistration || false;

        if (isNewRegistration) {
          showToast("¡Registro completado exitosamente!", "success", 3000);
        } else {
          showToast("¡Email verificado exitosamente!", "success", 3000);
        }

        setTimeout(() => {
          navigate("/login", {
            state: {
              message: isNewRegistration
                ? "¡Tu cuenta ha sido creada exitosamente! Ya puedes iniciar sesión."
                : "Email verificado exitosamente. Ya puedes iniciar sesión."
            }
          });
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error al verificar el código";
      showToast(errorMessage, "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      showToast("No hay email disponible para reenviar el código", "error", 3000);
      return;
    }

    setIsResending(true);

    try {
      // Usar el endpoint de reenvío para cualquier caso (nuevo registro o existente)
      const endpoint = "http://localhost:3000/send-verification";
      const bodyData = { email };

      const { data } = await axios.post(endpoint, bodyData);

      if (data.success) {
        showToast("Código reenviado exitosamente", "success", 3000);

        // Iniciar cooldown de 60 segundos
        setResendCooldown(60);

              } else {
        throw new Error(data.message || "Error al reenviar el código");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error al reenviar el código";
      showToast(errorMessage, "error", 4000);
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
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
            p: 2,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              width: "100%",
              maxWidth: 450,
              textAlign: "center",
              bgcolor: COLORS.cardBackground,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: COLORS.primary,
                mb: 2,
                fontSize: "48px"
              }}
            >
              ✅
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: COLORS.primary,
                mb: 2,
                fontWeight: "600"
              }}
            >
              ¡Email Verificado!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: COLORS.bodyText,
                mb: 3
              }}
            >
              Tu email ha sido verificado exitosamente.
              Serás redirigido al inicio de sesión...
            </Typography>
            <CircularProgress size={24} sx={{ color: COLORS.primary }} />
          </Paper>
        </Box>
      </>
    );
  }

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
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 450,
            bgcolor: COLORS.cardBackground,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                color: COLORS.primary,
                fontWeight: "bold",
                mb: 1
              }}
            >
              🌱 Paulina Cultiva
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: COLORS.bodyText,
                fontWeight: "600",
                mb: 2
              }}
            >
              Verificación de Email
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.bodyText,
                mb: 1
              }}
            >
              Enviamos un código de 6 dígitos a:
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: COLORS.primary,
                fontWeight: "600",
                mb: 3,
                textAlign: "center"
              }}
            >
              {email}
            </Typography>
          </Box>

          {/* Alerta de información */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Revisa tu bandeja de entrada y carpeta de spam.
              El código expirará en 1 hora.
            </Typography>
          </Alert>

          {/* Alerta de cooldown cuando está activo */}
          {resendCooldown > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Para evitar spam, debes esperar {resendCooldown} segundos antes de reenviar el código.
              </Typography>
            </Alert>
          )}

          <form onSubmit={handleVerifyCode}>
            <Stack spacing={3}>

              <TextField
                fullWidth
                label="Código de Verificación"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                variant="outlined"
                required
                disabled={isSubmitting}
                placeholder="000000"
                inputProps={{ maxLength: 6 }}
                helperText="Ingresa el código de 6 dígitos"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: COLORS.inputBorder,
                    },
                    "&:hover fieldset": {
                      borderColor: COLORS.primary,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: COLORS.primary,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: COLORS.bodyText,
                  },
                  "& .MuiInputBase-input": {
                    color: COLORS.bodyText,
                    fontSize: "18px",
                    textAlign: "center",
                    letterSpacing: "8px"
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting || code.length !== 6}
                sx={{
                  py: 1.5,
                  bgcolor: COLORS.primary,
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  "&:hover": {
                    bgcolor: COLORS.primaryHover || COLORS.primary,
                  },
                  "&:disabled": {
                    bgcolor: COLORS.primary,
                    opacity: 0.7,
                  },
                }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                    Verificando...
                  </>
                ) : (
                  "Verificar Email"
                )}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleResendCode}
                disabled={isResending || resendCooldown > 0}
                sx={{
                  py: 1.5,
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  fontWeight: "600",
                  "&:hover": {
                    borderColor: COLORS.primaryHover || COLORS.primary,
                    bgcolor: "rgba(76, 175, 80, 0.04)",
                  },
                  "&:disabled": {
                    borderColor: COLORS.primary,
                    opacity: 0.7,
                    color: COLORS.primary,
                  },
                }}
              >
                {isResending ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: COLORS.primary }} />
                    Enviando...
                  </>
                ) : resendCooldown > 0 ? (
                  `Reenviar Código (${resendCooldown}s)`
                ) : (
                  "Reenviar Código"
                )}
              </Button>
            </Stack>
          </form>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button
              onClick={() => navigate("/login")}
              sx={{
                color: COLORS.primary,
                textTransform: "none",
                fontWeight: "600"
              }}
            >
              ← Volver al inicio de sesión
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
}