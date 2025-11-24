import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  AccountCircle,
  Warning,
  Restore,
  DeleteForever,
  ArrowBack,
  Email,
  Lock,
  CheckCircle
} from '@mui/icons-material';
import { COLORS } from '../utils/colors';

export default function InactiveAccountScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [formData, setFormData] = useState({
    email: email,
    password: ''
  });
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'reactivate' o 'delete'

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }
    fetchAccountInfo();
  }, [email, navigate]);

  const fetchAccountInfo = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/inactive-account-info?email=${email}`);
      if (response.data.success) {
        setAccountInfo(response.data.account);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Error al obtener información de la cuenta');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handlePasswordKeyPress = (event) => {
    if (event.key === 'Enter' && !loading) {
      event.preventDefault();
      if (dialogType === 'reactivate') {
        handleReactivation();
      } else if (dialogType === 'delete') {
        handlePermanentDelete();
      }
    }
  };

  const openDialog = (type) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setFormData(prev => ({ ...prev, password: '' }));
    setError('');
    setSuccess('');
    setLoading(false);
  };

  const handleReactivation = async () => {
    if (!formData.password) {
      setError('Por favor, ingresa tu contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/reactivate-account', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        setSuccess('¡Cuenta reactivada exitosamente! Redirigiendo al login...');
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Tu cuenta ha sido reactivada. Ya puedes iniciar sesión.' }
          });
        }, 2000);
      } else {
        setError(response.data.message);
        setLoading(false);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al reactivar la cuenta';
      setError(message);
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!formData.password) {
      setError('Por favor, ingresa tu contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/permanent-delete-account', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        setSuccess('Cuenta eliminada permanentemente. Redirigiendo...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message);
        setLoading(false);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar la cuenta';
      setError(message);
      setLoading(false);
    }
  };

  const getTimeRemainingMessage = () => {
    if (!accountInfo?.minutesRemaining && accountInfo?.minutesRemaining !== 0) return '';
    if (accountInfo.minutesRemaining === 0) return 'Se eliminará ahora';
    if (accountInfo.minutesRemaining === 1) return 'Se eliminará en 1 minuto';
    return `Se eliminará en ${accountInfo.minutesRemaining} minutos`;
  };

  if (accountLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: COLORS.fondoClaro,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: COLORS.paperBg,
          }}
        >
          <CircularProgress size={40} sx={{ color: COLORS.principal, mb: 2 }} />
          <Typography>Cargando información de la cuenta...</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: COLORS.fondoClaro,
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          textAlign: 'center',
          bgcolor: COLORS.paperBg,
        }}
      >
        {/* Header */}
        <IconButton
          onClick={() => navigate('/login')}
          sx={{ position: 'absolute', top: 20, left: 20 }}
        >
          <ArrowBack />
        </IconButton>

        <AccountCircle
          sx={{
            fontSize: 60,
            color: COLORS.principal,
            mb: 2
          }}
        />

        <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.principal, mb: 1 }}>
          🪪 Estado de la cuenta
        </Typography>

        {/* Account Info */}
        {accountInfo && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: COLORS.bodyText, mb: 1 }}>
              Usuario: <strong>{accountInfo.username}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.bodyText, mb: 1 }}>
              Email: <strong>{accountInfo.email}</strong>
            </Typography>
            {accountInfo.minutesRemaining !== null && accountInfo.minutesRemaining !== undefined && (
              <Typography variant="body2" sx={{ color: COLORS.error, fontWeight: 600 }}>
                {getTimeRemainingMessage()}
              </Typography>
            )}
          </Box>
        )}

        {/* Alert Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
            {success}
          </Alert>
        )}

        {/* Information */}
        <Alert
          severity="warning"
          icon={<Warning />}
          sx={{ mb: 3, textAlign: 'left' }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Tu cuenta está desactivada.</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Si la reactivas, se restaurarán <strong>todos tus datos asociados</strong>: posts y comentarios.
          </Typography>
          <Typography variant="body2">
            • Si no la reactivas dentro de <strong>30 días</strong>, la cuenta será eliminada automáticamente.
          </Typography>
        </Alert>

        {/* Email Field */}
        <TextField
          fullWidth
          label="Email"
          value={formData.email}
          disabled
          sx={{
            mb: 2,
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: COLORS.bodyText,
            },
          }}
          InputProps={{
            startAdornment: <Email sx={{ mr: 1, color: COLORS.mutedText }} />
          }}
        />

        {/* Action Buttons */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => openDialog('reactivate')}
            startIcon={<Restore />}
            sx={{
              py: 1.5,
              bgcolor: COLORS.success,
              '&:hover': { bgcolor: COLORS.successHover || COLORS.success },
              fontWeight: 600,
            }}
          >
            Reactivar cuenta
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => openDialog('delete')}
            startIcon={<DeleteForever />}
            sx={{
              py: 1.5,
              borderColor: COLORS.error,
              color: COLORS.error,
              '&:hover': {
                borderColor: COLORS.errorHover || COLORS.error,
                bgcolor: 'rgba(244, 67, 54, 0.04)',
              },
              fontWeight: 600,
            }}
          >
            Eliminar cuenta permanentemente
          </Button>
        </Stack>

        {/* Back to Login */}
        <Button
          fullWidth
          variant="text"
          onClick={() => navigate('/login')}
          sx={{
            color: COLORS.mutedText,
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          ← Volver al inicio de sesión
        </Button>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          {dialogType === 'reactivate' ? (
            <>
              <CheckCircle sx={{ fontSize: 40, color: COLORS.success, mb: 1 }} />
              <Typography variant="h6">Reactivar cuenta</Typography>
            </>
          ) : (
            <>
              <DeleteForever sx={{ fontSize: 40, color: COLORS.error, mb: 1 }} />
              <Typography variant="h6">Eliminar cuenta permanentemente</Typography>
            </>
          )}
        </DialogTitle>

        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Typography variant="body2" sx={{ textAlign: 'center', mb: 3 }}>
            {dialogType === 'reactivate'
              ? 'Ingresa tu contraseña para confirmar la reactivación de tu cuenta.'
              : 'Esta acción es irreversible. Ingresa tu contraseña para confirmar la eliminación permanente de tu cuenta y todos tus datos.'
            }
          </Typography>

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onKeyDown={handlePasswordKeyPress}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: COLORS.divider },
                '&:hover fieldset': { borderColor: COLORS.principal },
                '&.Mui-focused fieldset': { borderColor: COLORS.principal },
              },
            }}
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: COLORS.mutedText }} />
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={closeDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={dialogType === 'reactivate' ? handleReactivation : handlePermanentDelete}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: dialogType === 'reactivate' ? COLORS.success : COLORS.error,
              '&:hover': {
                bgcolor: dialogType === 'reactivate'
                  ? (COLORS.successHover || COLORS.success)
                  : (COLORS.errorHover || COLORS.error),
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Procesando...
              </>
            ) : dialogType === 'reactivate' ? 'Reactivar' : 'Eliminar Permanentemente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}