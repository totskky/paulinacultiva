// src/components/NotificationsDropdown.jsx
import React, { useState, useEffect, memo } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import {
  Bell,
  Check,
  CheckCircle,
  Trash2,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Star,
  Info
} from 'lucide-react';
import { COLORS } from '../utils/colors';
import useNotifications from '../hooks/useNotifications';

const NotificationsDropdown = ({ userId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications
  } = useNotifications(userId);

  const handleOpen = async (event) => {
    setAnchorEl(event.currentTarget);

    // Cargar notificaciones solo cuando se abre el dropdown por primera vez
    if (!hasLoaded && userId) {
      setHasLoaded(true);
      await loadNotifications();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    const iconProps = { size: 20 };

    switch (type) {
      case 'like':
        return <Heart {...iconProps} style={{ color: '#e91e63' }} />;
      case 'comment':
        return <MessageCircle {...iconProps} style={{ color: '#2196f3' }} />;
      case 'favorite':
        return <Heart {...iconProps} style={{ color: '#e91e63' }} />;
      case 'friend_request':
        return <UserPlus {...iconProps} style={{ color: '#9c27b0' }} />;
      case 'friend_accept':
        return <UserCheck {...iconProps} style={{ color: '#4caf50' }} />;
      case 'rating':
        return <Star {...iconProps} style={{ color: '#ffc107' }} />;
      default:
        return <Info {...iconProps} style={{ color: '#607d8b' }} />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'like':
        return 'Nuevo Like';
      case 'comment':
        return 'Nuevo Comentario';
      case 'favorite':
        return 'Nuevo Favorito';
      case 'friend_request':
        return 'Solicitud de Amistad';
      case 'friend_accept':
        return 'Amistad Aceptada';
      case 'rating':
        return 'Nueva Calificación';
      default:
        return 'Notificación';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          color: COLORS.mutedText,
          position: 'relative'
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.65rem',
              height: 16,
              minWidth: 16
            }
          }}
        >
          <Bell className="w-5 h-5" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            bgcolor: COLORS.paperBg,
            border: `1px solid ${COLORS.divider}`
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${COLORS.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.bodyText }}>
              Notificaciones
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  color: COLORS.principal
                }}
              >
                Marcar todas como leídas
              </Button>
            )}
          </Box>
        </Box>

        {/* Lista de notificaciones */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} sx={{ color: COLORS.principal }} />
          </Box>
        ) : notifications.length > 0 ? (
          <>
            {notifications.slice(0, 10).map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={handleClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: notification.isRead ? 'transparent' : `${COLORS.principal}10`,
                  '&:hover': { bgcolor: `${COLORS.principal}20` },
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 0.5
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 1.5 }}>
                  {/* Icono */}
                  <Box sx={{ mt: 0.5 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>

                  {/* Contenido */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.isRead ? 400 : 600,
                          color: COLORS.bodyText,
                          fontSize: '0.875rem'
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip
                        label={getNotificationTypeLabel(notification.type)}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.6rem',
                          height: 20,
                          ml: 1,
                          borderColor: COLORS.divider,
                          color: COLORS.mutedText
                        }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.mutedText,
                        fontSize: '0.8rem',
                        lineHeight: 1.3,
                        mb: 0.5
                      }}
                    >
                      {notification.message}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.mutedText, fontSize: '0.7rem' }}
                    >
                      {formatTime(notification.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                {/* Acciones */}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {!notification.isRead && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      sx={{
                        color: COLORS.principal,
                        '&:hover': { bgcolor: `${COLORS.principal}20` }
                      }}
                    >
                      <CheckCircle size={16} />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={(e) => handleDelete(notification.id, e)}
                    sx={{
                      color: COLORS.error,
                      '&:hover': { bgcolor: `${COLORS.error}20` }
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </MenuItem>
            ))}

            {notifications.length > 10 && (
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={handleClose}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    color: COLORS.principal
                  }}
                >
                  Ver todas las notificaciones
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Bell size={48} sx={{ color: COLORS.divider, mb: 1 }} />
            <Typography variant="body2" sx={{ color: COLORS.mutedText }}>
              No tienes notificaciones
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

NotificationsDropdown.displayName = 'NotificationsDropdown';

export default memo(NotificationsDropdown);