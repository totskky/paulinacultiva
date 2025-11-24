import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  Avatar,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  User,
  Settings,
  Lock,
  Mail,
  Calendar,
  Shield,
  Utensils,
  AlertTriangle,
  LogOut,
  UserX,
  ArrowLeft
} from 'lucide-react';
import { useToast, ToastContainer } from './Toast';
import { COLORS } from '../utils/colors';

function Perfil() {
  const navigate = useNavigate();
  const { toasts, showToast, closeToast, removeToast } = useToast();

  // Estados del usuario
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    isAdmin: false,
    createdAt: '',
    estado: ''
  });

  
  // Estados para edición de perfil
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // Estados para eliminación de cuenta
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  // Cargar datos del usuario
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData({
          username: data.username,
          email: data.email,
          role: data.role || 'user',
          createdAt: data.createdAt,
          estado: data.estado
        });
        setEditData(prev => ({
          ...prev,
          username: data.username
        }));
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      showToast('Error al cargar datos del perfil', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!editData.username || !editData.username.trim()) {
      showToast('El nombre de usuario no puede estar vacío', 'error', 3000);
      return;
    }

    if (editData.newPassword && editData.newPassword !== editData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error', 3000);
      return;
    }

    if (editData.newPassword && editData.newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error', 3000);
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Actualizar nombre de usuario si cambió
      if (editData.username !== userData.username) {
        const usernameResponse = await fetch('http://localhost:3000/api/username/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ username: editData.username.trim() })
        });

        const usernameData = await usernameResponse.json();
        if (usernameData.success) {
          showToast('Nombre de usuario actualizado', 'success', 2000);
          setUserData(prev => ({ ...prev, username: editData.username.trim() }));
        } else {
          showToast(usernameData.message || 'Error al actualizar nombre de usuario', 'error', 3000);
          setEditLoading(false);
          return;
        }
      }

      // Cambiar contraseña si se proporcionó
      if (editData.newPassword && editData.currentPassword) {
        const passwordResponse = await fetch('http://localhost:3000/api/password/change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: editData.currentPassword,
            newPassword: editData.newPassword
          })
        });

        const passwordData = await passwordResponse.json();
        if (passwordData.success) {
          showToast('Contraseña actualizada', 'success', 2000);
        } else {
          showToast(passwordData.message || 'Error al actualizar contraseña', 'error', 3000);
        }
      }

      setEditDialogOpen(false);
      setEditData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      showToast('Error de conexión al actualizar perfil', 'error', 3000);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/password/deactivate-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        showToast('Cuenta desactivada exitosamente', 'success', 3000);
        localStorage.removeItem('token');
        navigate('/');
      } else {
        showToast(data.message || 'Error al desactivar cuenta', 'error', 3000);
      }
    } catch (error) {
      console.error('Error al desactivar cuenta:', error);
      showToast('Error de conexión al desactivar cuenta', 'error', 3000);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    showToast('Sesión cerrada correctamente', 'success', 3000);
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} closeToast={closeToast} removeToast={removeToast} />

      <Box sx={{ minHeight: '100vh', bgcolor: COLORS.fondoClaro }}>
        {/* Header con flecha para volver */}
        <AppBar
          position="static"
          sx={{
            bgcolor: COLORS.paperBg,
            color: COLORS.bodyText,
            boxShadow: `0 1px 3px 0 ${COLORS.subtleShadow}`
          }}
        >
          <Toolbar>
            <IconButton
              onClick={() => navigate('/home')}
              sx={{ mr: 2, color: COLORS.bodyText }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Mi Perfil
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4, pb: 4 }}>
          {/* Profile Card */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              bgcolor: COLORS.paperBg,
              borderRadius: 3,
              textAlign: 'center',
              border: 'none'
            }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: COLORS.principal,
                fontSize: '2.5rem',
                mx: 'auto',
                mb: 3,
                border: '4px solid',
                borderColor: 'rgba(255, 107, 53, 0.2)'
              }}
            >
              {userData.username[0].toUpperCase()}
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: COLORS.bodyText }}>
              {userData.username}
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.mutedText, mb: 2 }}>
              {userData.email}
            </Typography>
            {userData.role === 'moderator' && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Shield size={18} style={{ color: COLORS.principal }} />
                <Typography variant="body2" sx={{ color: COLORS.principal, fontWeight: 600 }}>
                  Moderador
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={16} style={{ color: COLORS.mutedText }} />
              <Typography variant="body2" sx={{ color: COLORS.mutedText }}>
                Miembro desde {formatDate(userData.createdAt)}
              </Typography>
            </Box>
          </Paper>

          {/* Settings Section */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: COLORS.bodyText }}>
            ⚙️ Configuración
          </Typography>

          {/* Account Settings */}
          {/* Account Settings */}
          <Card
            elevation={0}
            sx={{
              mb: 3,
              bgcolor: COLORS.paperBg,
              border: 'none'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: COLORS.bodyText }}>
                📝 Cuenta
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Settings />}
                onClick={() => {
                  setEditData(prev => ({
                    ...prev,
                    username: userData.username
                  }));
                  setEditDialogOpen(true);
                }}
                sx={{
                  mb: 2,
                  p: 2,
                  borderColor: COLORS.principal,
                  color: COLORS.principal,
                  '&:hover': {
                    borderColor: COLORS.oscuro,
                    bgcolor: 'rgba(255, 107, 53, 0.04)',
                    color: COLORS.oscuro
                  },
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          {/* Moderator Panel Button */}
          {userData.role === 'moderator' && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Shield />}
              onClick={() => navigate('/moderator')}
              sx={{
                mb: 3,
                p: 2,
                borderColor: COLORS.principal,
                color: COLORS.principal,
                bgcolor: 'transparent',
                '&:hover': {
                  borderColor: COLORS.oscuro,
                  bgcolor: 'rgba(255, 107, 53, 0.04)',
                  color: COLORS.oscuro
                },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              Panel de Moderador
            </Button>
          )}

          {/* Action Buttons Section */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: COLORS.bodyText }}>
            🔒 Gestión de Cuenta
          </Typography>

          {/* Logout Button */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<LogOut />}
            onClick={handleLogout}
            sx={{
              mb: 2,
              p: 2,
              borderColor: COLORS.mutedText,
              color: COLORS.mutedText,
              '&:hover': {
                borderColor: COLORS.bodyText,
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                color: COLORS.bodyText
              },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            Cerrar Sesión
          </Button>

          {/* Delete Account Button */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<UserX />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              p: 2,
              borderColor: COLORS.error,
              color: COLORS.error,
              '&:hover': {
                borderColor: '#d32f2f',
                bgcolor: 'rgba(244, 67, 54, 0.04)',
                color: '#d32f2f'
              },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            Desactivar Cuenta
          </Button>

          {/* Warning Message */}
          <Alert
            severity="warning"
            sx={{
              mt: 3,
              '& .MuiAlert-message': {
                fontSize: '0.875rem'
              }
            }}
          >
            Al desactivar tu cuenta, tu perfil se ocultará y no podrás iniciar sesión. Tus recetas y datos permanecerán en el sistema y podrás reactivar tu cuenta más tarde.
          </Alert>
        </Container>

        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleEditProfile();
          }}>
            <DialogTitle sx={{ color: COLORS.bodyText, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings size={24} />
              Editar Perfil
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                fullWidth
                label="Nombre de usuario"
                value={editData.username}
                onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                variant="outlined"
                sx={{ mt: 2, mb: 3 }}
              />
              <Typography variant="subtitle2" sx={{ color: COLORS.mutedText, mb: 2, fontWeight: 600 }}>
                Cambio de contraseña (opcional)
              </Typography>
              <TextField
                fullWidth
                type="password"
                label="Contraseña actual"
                value={editData.currentPassword}
                onChange={(e) => setEditData(prev => ({ ...prev, currentPassword: e.target.value }))}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="password"
                label="Nueva contraseña"
                value={editData.newPassword}
                onChange={(e) => setEditData(prev => ({ ...prev, newPassword: e.target.value }))}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirmar nueva contraseña"
                value={editData.confirmPassword}
                onChange={(e) => setEditData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                variant="outlined"
              />
              <Typography variant="caption" sx={{ color: COLORS.mutedText, mt: 1, display: 'block' }}>
                La contraseña debe tener al menos 6 caracteres. Deja los campos de contraseña vacíos si solo quieres cambiar el nombre.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                type="button"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={editLoading}
                startIcon={editLoading ? <CircularProgress size={16} /> : <Settings size={16} />}
              >
                {editLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: COLORS.error, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertTriangle size={24} />
            Desactivar Cuenta
          </DialogTitle>
          <DialogContent>
            <Typography paragraph sx={{ color: COLORS.bodyText }}>
              ¿Estás seguro de que quieres desactivar tu cuenta?
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>⚠️ Advertencia importante:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>❗ Tu cuenta será <strong>eliminada permanentemente después de 30 días</strong></li>
                <li>🚫 No podrás iniciar sesión con tu cuenta desactivada</li>
                <li>📄 Podrás reactivar tu cuenta antes de los 30 días usando tu contraseña</li>
                <li>🗑️ Si no la reactivas, se eliminarán <strong>TODOS tus datos</strong> permanentemente</li>
              </ul>
            </Alert>
            <Typography variant="body2" sx={{ color: COLORS.mutedText }}>
              <strong>Importante:</strong> Tras la desactivación, recibirás un enlace para reactivar o eliminar permanentemente tu cuenta. Si no tomas ninguna decisión, la cuenta se eliminará automáticamente después de 30 días.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAccount}
              variant="contained"
              color="error"
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={16} /> : <UserX size={16} />}
            >
              {deleteLoading ? 'Desactivando...' : 'Desactivar Cuenta'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}

export default Perfil;