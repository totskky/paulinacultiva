import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Paper, TextField, Button, Typography, Stack, Alert, CircularProgress } from "@mui/material";
import { ToastContainer, useToast } from "../components/Toast";
import { COLORS } from "../utils/colors";

export default function PasswordRecovery() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast, closeToast } = useToast();

  // Estados para cada paso del flujo
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para controlar qué paso mostrar
  const [emailSent, setEmailSent] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);

  // Estados para el reenvío de código
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Efecto para manejar el cooldown del botón de reenvío
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast("Por favor, ingresa tu email", "error", 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Por favor, ingresa un email válido", "error", 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post("http://localhost:3000/password-reset-request", {
        email
      });

      if (data.success) {
        setEmailSent(true);
        showToast("Email enviado con instrucciones para recuperar tu contraseña", "success", 4000);

        if (data.debugInfo?.code) {
          console.log("🔑 Código de recuperación (desarrollo):", data.debugInfo.code);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error al enviar email de recuperación";
      showToast(errorMessage, "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateCode = async (e) => {
    e.preventDefault();

    if (!code) {
      showToast("Por favor, ingresa el código", "error", 3000);
      return;
    }

    if (code.length !== 6) {
      showToast("El código debe tener exactamente 6 dígitos", "error", 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post("http://localhost:3000/verify-reset-code", {
        email,
        code
      });

      if (data.success) {
        setCodeValidated(true);
        showToast("Código validado correctamente", "success", 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Código inválido o expirado";
      showToast(errorMessage, "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      showToast("Por favor, ingresa tu email", "error", 3000);
      return;
    }

    if (resendCooldown > 0) {
      showToast(`Espera ${resendCooldown} segundos antes de reenviar`, "warning", 3000);
      return;
    }

    setIsResending(true);

    try {
      const { data } = await axios.post("http://localhost:3000/password-reset-request", {
        email
      });

      if (data.success) {
        showToast("📧 Nuevo código enviado a tu email", "success", 3000);
        setResendCooldown(60); // 1 minuto de cooldown

        if (data.debugInfo?.code) {
          console.log("🔑 Nuevo código de recuperación (desarrollo):", data.debugInfo.code);
        }
      } else {
        showToast("Error al reenviar el código", "error", 3000);
      }
    } catch (error) {
      console.error("Error al reenviar código:", error);
      showToast("Error al reenviar el código. Intenta nuevamente", "error", 3000);
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast("Por favor, completa todos los campos", "error", 3000);
      return;
    }

    if (newPassword.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "error", 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error", 3000);
      return;
    }

    setIsSubmitting(true);
    let resetSuccess = false;

    try {
      const { data } = await axios.post("http://localhost:3000/reset-password", {
        email,
        code,
        newPassword
      });

      if (data.success) {
        resetSuccess = true;
        showToast("Contraseña actualizada exitosamente. Redirigiendo...", "success", 3000);

        // Mantener el loading activo durante la redirección
        setTimeout(() => {
          navigate("/login", {
            state: { message: "Contraseña actualizada. Inicia sesión con tu nueva contraseña." }
          });
        }, 3000); // Aumentado a 3 segundos para dar tiempo al usuario
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error al actualizar contraseña";
      showToast(errorMessage, "error", 4000);
    } finally {
      // Solo quitamos el loading si no hubo éxito
      if (!resetSuccess) {
        setIsSubmitting(false);
      }
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
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 500,
            bgcolor: COLORS.cardBackground,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                color: COLORS.primary,
                fontWeight: "bold",
                mb: 2
              }}
            >
              Recuperar Contraseña
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.mutedText }}>
              Sigue los pasos para recuperar tu cuenta
            </Typography>
          </Box>

          {/* Paso 1: Ingresar Email */}
          {!emailSent && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Ingresa tu email para recibir instrucciones de recuperación.
                  Te enviaremos un código de 6 dígitos.
                </Typography>
              </Alert>

              <form onSubmit={handleSendEmail}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    required
                    disabled={isSubmitting}
                    placeholder="tu@email.com"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: COLORS.divider,
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
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting || !email}
                    sx={{
                      py: 1.5,
                      bgcolor: COLORS.primary,
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "16px",
                      "&:hover": {
                        bgcolor: COLORS.claro,
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
                        Enviando...
                      </>
                    ) : (
                      "Enviar Instrucciones"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="text"
                    onClick={() => navigate("/login")}
                    sx={{
                      color: COLORS.mutedText,
                      "&:hover": {
                        color: COLORS.primary,
                      },
                    }}
                  >
                    ← Volver al Inicio de Sesión
                  </Button>
                </Stack>
              </form>
            </>
          )}

          {/* Paso 2: Ingresar Código */}
          {emailSent && !codeValidated && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Revisa tu email y ingresa el código de recuperación de 6 dígitos que te enviamos.
                </Typography>
              </Alert>

              <form onSubmit={handleValidateCode}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Código de Recuperación"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    variant="outlined"
                    required
                    disabled={isSubmitting}
                    placeholder="Ej: 123456"
                    helperText="Ingresa el código de 6 dígitos que recibiste en tu email"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: COLORS.divider,
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
                        textAlign: "center",
                        fontSize: "24px",
                        fontFamily: "monospace",
                        letterSpacing: "8px",
                        fontWeight: "bold",
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
                        bgcolor: COLORS.claro,
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
                        Validando...
                      </>
                    ) : (
                      "Validar Código"
                    )}
                  </Button>

                  <Button
                    type="button"
                    fullWidth
                    variant="outlined"
                    onClick={handleResendCode}
                    disabled={isResending || resendCooldown > 0}
                    sx={{
                      py: 1.5,
                      borderColor: COLORS.primary,
                      color: COLORS.primary,
                      fontWeight: "bold",
                      fontSize: "14px",
                      "&:hover": {
                        borderColor: COLORS.claro,
                        color: COLORS.claro,
                        bgcolor: "rgba(76, 175, 80, 0.04)",
                      },
                      "&:disabled": {
                        borderColor: COLORS.divider,
                        color: COLORS.divider,
                      },
                    }}
                  >
                    {isResending ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Reenviando...
                      </>
                    ) : resendCooldown > 0 ? (
                      `Reenviar en ${resendCooldown}s`
                    ) : (
                      "Reenviar Código"
                    )}
                  </Button>
                </Stack>
              </form>
            </>
          )}

          {/* Paso 3: Nueva Contraseña */}
          {codeValidated && (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Código validado correctamente. Ahora ingresa tu nueva contraseña.
                </Typography>
              </Alert>

              <form onSubmit={handleResetPassword}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Nueva Contraseña"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    variant="outlined"
                    required
                    disabled={isSubmitting}
                    placeholder="Mínimo 6 caracteres"
                    helperText="La contraseña debe tener al menos 6 caracteres"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: COLORS.divider,
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
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Confirmar Contraseña"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    variant="outlined"
                    required
                    disabled={isSubmitting}
                    placeholder="Repite tu nueva contraseña"
                    helperText="Vuelve a ingresar tu contraseña"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: COLORS.divider,
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
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={
                      isSubmitting ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword.length < 6 ||
                      newPassword !== confirmPassword
                    }
                    sx={{
                      py: 1.5,
                      bgcolor: COLORS.primary,
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "16px",
                      "&:hover": {
                        bgcolor: COLORS.claro,
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
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar Contraseña"
                    )}
                  </Button>
                </Stack>
              </form>
            </>
          )}
        </Paper>
      </Box>
    </>
  );
}