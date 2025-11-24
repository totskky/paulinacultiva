// src/components/PostCard.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  IconButton,
  Rating,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Heart,
  MessageCircle,
  Share,
  MoreVertical,
  Star,
  Send,
  Trash2,
  Edit,
  Flag,
  Expand,
} from 'lucide-react';
import { COLORS } from '../utils/colors';
import { TAGS } from '../utils/constants';
import { formatTime } from '../utils/timeFormat';
import ReportDialog from './ReportDialog';
import ReportButton from './ReportButton';

// Importación correcta para el componente Star
const StarIcon = Star;

// Iconos para decoración
import { Clock, Users, ChefHat, TrendingUp, Sparkles, Award, BarChart3 } from 'lucide-react';

// Función para parsear y formatear el contenido de la receta
const parseRecipeContent = (contenido) => {
  if (!contenido) return { ingredientes: '', pasos: '' };

  // Buscar las secciones usando los emojis y títulos
  const ingredientesMatch = contenido.match(/🥘\s*\*\*Ingredientes:\*\*(.*?)(?=\n\n|\n👩‍🍳|$)/s);
  const pasosMatch = contenido.match(/👩‍🍳\s*\*\*Pasos a seguir:\*\*(.*?)$/s);

  const ingredientes = ingredientesMatch ? ingredientesMatch[1].trim() : '';
  const pasos = pasosMatch ? pasosMatch[1].trim() : contenido;

  return { ingredientes, pasos };
};

export default function PostCard({ post, onRatingChange, onFavoriteToggle, onComment, currentUserId, onDelete }) {
  // Parsear el contenido de la receta para mostrarlo formateado
  const recipeContent = post ? parseRecipeContent(post.contenido) : { ingredientes: '', pasos: '' };

  const [rating, setRating] = useState(
    typeof post.userRating === 'number' ? post.userRating :
    typeof post.averageRating === 'number' ? post.averageRating :
    parseFloat(post.userRating) || parseFloat(post.averageRating) || 0
  );
  const [isRated, setIsRated] = useState(!!post.userRating);
  const [isFavorite, setIsFavorite] = useState(post.isFavorite || false);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [expandDialogOpen, setExpandDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);

  const handleRatingChange = async (event, newValue) => {
    if (!newValue || isRated) return; // No permitir calificación vacía o duplicada

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/recipes/${post.id}/calification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: newValue })
      });

      if (response.ok) {
        const data = await response.json();
        setRating(newValue);
        setIsRated(true);
        setTotalRatings(data.totalRatings);
        if (onRatingChange) {
          onRatingChange(post.id, newValue, data.totalRatings);
        }
      } else {
        const errorData = await response.json();
        // Solo mostrar error si no es por calificación duplicada
        if (errorData.message && !errorData.message.toLowerCase().includes('ya calificaste') &&
            !errorData.message.toLowerCase().includes('ya has calificado')) {
          console.error('Error al calificar post:', errorData.message);
        }
      }
    } catch (error) {
      console.error('Error al calificar post:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/recipes/${post.id}/favorites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);

        // Usar el conteo real del backend
        setTotalFavorites(data.totalFavorites);

        if (onFavoriteToggle) {
          onFavoriteToggle(post.id, data.isFavorite, data.totalFavorites);
        }
      } else {
        console.error('Error al toggle favorito');
      }
    } catch (error) {
      console.error('Error al toggle favorito:', error);
    }
  };

  // Cargar comentarios desde la API
  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`http://localhost:3000/recipes/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || data); // Manejar ambas estructuras
        setTotalComments(data.totalComments || (data.comments || data).length);
      } else {
        console.error('Error al cargar comentarios');
      }
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Manejar apertura del diálogo de comentarios
  const handleCommentDialogOpen = () => {
    setCommentDialogOpen(true);
    loadComments();
  };

  const handleCommentSubmit = async () => {
    if (newComment.trim()) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/recipes/${post.id}/comments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contenido: newComment
          })
        });

        if (response.ok) {
          const newCommentData = await response.json();
          setComments([...comments, newCommentData.comment]);
          setTotalComments(newCommentData.totalComments);
          setNewComment('');
          if (onComment) {
            onComment(post.id, newCommentData.comment);
          }
        } else {
          console.error('Error al agregar comentario');
          alert('Error al agregar el comentario. Intenta nuevamente.');
        }
      } catch (error) {
        console.error('Error al agregar comentario:', error);
        alert('Error de conexión al agregar el comentario.');
      }
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Manejar expansión/colapso de la publicación
  const handleExpandDialogOpen = () => {
    setExpandDialogOpen(true);
  };
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🗑️ Intentando eliminar receta ID:', post.id);

      const response = await fetch(`http://localhost:3000/recipes/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('🗑️ Respuesta del servidor:', response.status, data);

      if (response.ok) {
        if (onDelete) {
          onDelete(post.id);
        }
        setDeleteDialogOpen(false);
        alert('Receta eliminada exitosamente');
      } else {
        console.error('Error al eliminar la receta:', data);
        alert(`Error al eliminar la receta: ${data.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al eliminar la receta:', error);
      alert(`Error de conexión: ${error.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Estados para el diálogo de reporte de post
  const [reportPostDialogOpen, setReportPostDialogOpen] = useState(false);

  const handleReport = () => {
    handleMenuClose();
    setReportPostDialogOpen(true);
  };

  const handleSubmitPostReport = async ({ reason, description }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/recipes/${post.id}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason,
          description
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Publicación reportada exitosamente.');
      } else {
        alert(data.message || 'Error al reportar la publicación.');
      }
    } catch (error) {
      console.error('Error al reportar publicación:', error);
      alert('Error de conexión al reportar la publicación.');
    } finally {
      setReportPostDialogOpen(false);
    }
  };

  // Funciones para eliminar comentarios
  const handleDeleteCommentClick = (comment) => {
    setCommentToDelete(comment);
    setDeleteCommentDialogOpen(true);
  };

  const handleDeleteCommentConfirm = async () => {
    if (!commentToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/posts/${post.id}/comments/${commentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Eliminar el comentario de la lista local
        setComments(comments.filter(comment => comment.id !== commentToDelete.id));
        setTotalComments(data.totalComments);
        setDeleteCommentDialogOpen(false);
        setCommentToDelete(null);
      } else {
        console.error('Error al eliminar el comentario');
        alert('Error al eliminar el comentario. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error al eliminar el comentario:', error);
      alert('Error de conexión al eliminar el comentario.');
    }
  };

  const handleDeleteCommentCancel = () => {
    setDeleteCommentDialogOpen(false);
    setCommentToDelete(null);
  };

  // Estados para el diálogo de reporte de comentario
  const [reportCommentDialogOpen, setReportCommentDialogOpen] = useState(false);
  const [selectedCommentToReport, setSelectedCommentToReport] = useState(null);

  // Función para reportar comentario
  const handleReportComment = async (comment) => {
    if (!currentUserId) {
      alert('Debes iniciar sesión para reportar un comentario.');
      return;
    }

    setSelectedCommentToReport(comment);
    setReportCommentDialogOpen(true);
  };

  const handleSubmitCommentReport = async ({ reason, description }) => {
    if (!selectedCommentToReport) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/recipes/${post.id}/comments/${selectedCommentToReport.id}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason,
          description
        })
      });

      const data = await response.json();

      if (data.success) {
        // Marcar el comentario como reportado localmente
        setComments(prev => prev.map(c =>
          c.id === selectedCommentToReport.id ? { ...c, reportado: true } : c
        ));
        alert('Comentario reportado exitosamente.');
      } else {
        alert(data.message || 'Error al reportar el comentario.');
      }
    } catch (error) {
      console.error('Error al reportar comentario:', error);
      alert('Error de conexión al reportar el comentario.');
    } finally {
      setReportCommentDialogOpen(false);
      setSelectedCommentToReport(null);
    }
  };

  // Verificar si el post está en favoritos al cargar el componente
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUserId) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/recipes/${post.id}/favorites/check`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.isFavorite);
          setTotalFavorites(data.totalFavorites);
        }
      } catch (error) {
        console.error('Error al verificar estado de favorito:', error);
      }
    };

    checkFavoriteStatus();

    // Cargar conteo inicial de comentarios
    const loadInitialCommentCount = async () => {
      try {
        const response = await fetch(`http://localhost:3000/recipes/${post.id}/comments`);
        if (response.ok) {
          const data = await response.json();
          setTotalComments(data.totalComments || (data.comments || data).length);
        }
      } catch (error) {
        console.error('Error al cargar conteo inicial de comentarios:', error);
      }
    };

    loadInitialCommentCount();

    // Cargar calificación del usuario
    const loadUserRating = async () => {
      if (!currentUserId) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/recipes/${post.id}/calification`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setRating(data.userRating);
          setIsRated(!!data.userRating);
          setTotalRatings(data.totalRatings);
        }
      } catch (error) {
        console.error('Error al cargar calificación del usuario:', error);
      }
    };

    loadUserRating();
  }, [post.id, currentUserId]);

  const getTagColor = (tagId) => {
    const tag = TAGS.find(t => t.id === tagId);
    return tag ? tag.color : COLORS.mutedText;
  };

  const isAuthor = currentUserId && post.autorId === currentUserId;

  const getTagName = (tagId) => {
    const tag = TAGS.find(t => t.id === tagId);
    return tag ? tag.name : tagId;
  };

  return (
    <>
      <Card sx={{
        mb: 3,
        borderRadius: 2,
        boxShadow: `0 2px 8px ${COLORS.subtleShadow}`,
        transition: 'all 0.2s ease-in-out',
        height: '650px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        background: `linear-gradient(135deg, ${COLORS.paperBg}, ${COLORS.fondoClaro}30)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          background: `linear-gradient(135deg, ${COLORS.claro}10, ${COLORS.principal}05, transparent)`,
          borderRadius: 2,
          zIndex: 0,
          opacity: 0,
          transition: 'opacity 0.3s ease'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: `linear-gradient(45deg, ${COLORS.principal}20, transparent, ${COLORS.claro}20)`,
          borderRadius: 2,
          zIndex: -1,
          opacity: 0,
          transition: 'opacity 0.3s ease'
        },
        '&:hover': {
          transform: 'translateY(-3px) scale(1.01)',
          boxShadow: `0 8px 25px ${COLORS.subtleShadow}`,
          '&::before': {
            opacity: 1
          },
          '&::after': {
            opacity: 0.7
          }
        }
      }}>
        <CardContent sx={{
          p: 3,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Header decorado */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative' }}>
            {/* Insignia de recetas premium */}
            {post.averageRating >= 4.5 && (
              <Box sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 28,
                height: 28,
                background: `linear-gradient(135deg, ${COLORS.principal}, ${COLORS.claro})`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${COLORS.principal}50`,
                zIndex: 3,
                animation: 'pulse 2s infinite'
              }}>
                <Award size={14} style={{ color: 'white' }} />
              </Box>
            )}

            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: COLORS.principal,
                color: COLORS.white,
                mr: 2,
                border: `2px solid ${COLORS.principal}40`,
                boxShadow: `0 2px 8px ${COLORS.subtleShadow}`,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  border: `1px solid ${COLORS.claro}30`,
                  borderRadius: '50%',
                  zIndex: -1
                }
              }}
            >
              {post.autor?.username?.[0]?.toUpperCase() || 'A'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: COLORS.bodyText,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {post.autor?.username || 'Anónimo'}
                {post.averageRating >= 4.5 && (
                  <Sparkles size={14} style={{ color: COLORS.principal }} />
                )}
                {post.totalFavorites > 5 && (
                  <Heart size={12} style={{ color: '#ef4444' }} />
                )}
              </Typography>
              <Typography variant="caption" color={COLORS.mutedText}>
                {new Date(post.fechaPublicacion).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
            <IconButton onClick={handleMenuClick}>
              <MoreVertical className="w-5 h-5" style={{ color: COLORS.mutedText }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {isAuthor ? (
                <MenuItem
                  onClick={handleDeleteClick}
                  sx={{ color: COLORS.error }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </MenuItem>
              ) : (
                <MenuItem onClick={handleReport} sx={{ color: COLORS.warning }}>
                  <Flag className="w-4 h-4 mr-2" />
                  Reportar
                </MenuItem>
              )}
            </Menu>
          </Box>

          {/* Image */}
          {post.foto && (
            <Box sx={{
              mb: 2,
              borderRadius: 3,
              bgcolor: `linear-gradient(135deg, ${COLORS.fondoClaro}, ${COLORS.paperBg})`,
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, transparent 40%, rgba(209, 55, 39, 0.1) 100%)',
                  pointerEvents: 'none'
                }
              }
            }}>
              <img
                src={(() => {
                  const imageUrl = post.foto.startsWith('http') ? post.foto : `http://localhost:3000/${post.foto}`;
                  return imageUrl;
                })()}
                alt={post.titulo}
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  display: 'block',
                  backgroundColor: COLORS.fondoClaro,
                  padding: '4px',
                  boxSizing: 'border-box'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                onLoad={(e) => {
                }}
              />
            </Box>
          )}

          {/* Título - Fijo */}
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: COLORS.bodyText }}>
            {post.titulo}
          </Typography>

  
          {/* Tags - Fijos */}
          {post.etiquetas && (
            (() => {
              let tagsArray = [];

              // Manejar diferentes formatos de etiquetas
              if (Array.isArray(post.etiquetas)) {
                tagsArray = post.etiquetas;
              } else if (typeof post.etiquetas === 'string') {
                try {
                  tagsArray = JSON.parse(post.etiquetas);
                } catch (e) {
                  tagsArray = [];
                }
              } else if (post.etiquetas) {
                // Si es un objeto o cualquier otro tipo, intentar convertir
                try {
                  tagsArray = JSON.parse(JSON.stringify(post.etiquetas));
                  if (!Array.isArray(tagsArray)) {
                    tagsArray = [];
                  }
                } catch (e) {
                  tagsArray = [];
                }
              }

              return tagsArray.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {tagsArray.map((tagId, index) => (
                    <Chip
                      key={tagId || index}
                      label={getTagName(tagId)}
                      size="small"
                      sx={{
                        backgroundColor: `${getTagColor(tagId)}20`,
                        color: getTagColor(tagId),
                        borderColor: getTagColor(tagId),
                        fontSize: '0.7rem'
                      }}
                    />
                  ))}
                </Box>
              ) : null;
            })()
          )}

          {/* Recipe Info decorada */}
          {(post.tiempoPreparacion || post.porciones || post.dificultad) && (
            <Box sx={{
              display: 'flex',
              gap: 1,
              mb: 2,
              flexWrap: 'wrap',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -5,
                left: -5,
                right: -5,
                bottom: -5,
                background: `linear-gradient(135deg, ${COLORS.claro}15, transparent)`,
                borderRadius: 2,
                zIndex: 0
              }
            }}>
              {post.tiempoPreparacion && (
                <Chip
                  icon={<Clock size={12} style={{ color: COLORS.principal }} />}
                  label={formatTime(post.tiempoPreparacion, post.tiempoUnidad || 'min')}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    borderColor: COLORS.principal + '40',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: COLORS.bodyText,
                    fontWeight: 500,
                    position: 'relative',
                    zIndex: 1,
                    '&:hover': {
                      backgroundColor: COLORS.principal + '15',
                      borderColor: COLORS.principal + '60',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(209, 55, 39, 0.15)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                />
              )}
              {post.porciones && (
                <Chip
                  icon={<Users size={12} style={{ color: COLORS.principal }} />}
                  label={`${post.porciones} porciones`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    borderColor: COLORS.principal + '40',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: COLORS.bodyText,
                    fontWeight: 500,
                    position: 'relative',
                    zIndex: 1,
                    '&:hover': {
                      backgroundColor: COLORS.principal + '15',
                      borderColor: COLORS.principal + '60',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(209, 55, 39, 0.15)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                />
              )}
              {post.dificultad && (
                <Chip
                  icon={<ChefHat size={12} style={{ color: post.dificultad === 'Fácil' ? '#f87171' : post.dificultad === 'Media' ? '#ef4444' : '#dc2626' }} />}
                  label={post.dificultad}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    borderColor: post.dificultad === 'Fácil' ? '#f8717140' : post.dificultad === 'Media' ? '#ef444440' : '#dc262640',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: COLORS.bodyText,
                    fontWeight: 500,
                    position: 'relative',
                    zIndex: 1,
                    '&:hover': {
                      backgroundColor: post.dificultad === 'Fácil' ? '#f8717115' : post.dificultad === 'Media' ? '#ef444415' : '#dc262615',
                      borderColor: post.dificultad === 'Fácil' ? '#f8717160' : post.dificultad === 'Media' ? '#ef444460' : '#dc262660',
                      transform: 'translateY(-1px)',
                      boxShadow: post.dificultad === 'Fácil' ? '0 2px 8px rgba(248, 113, 113, 0.15)' : post.dificultad === 'Media' ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(220, 38, 38, 0.15)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                />
              )}
            </Box>
          )}

          {/* Rating */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0.5,
            mb: 2,
            pt: 2,
            borderTop: `1px solid ${COLORS.divider}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: COLORS.mutedText }}>
                Calificación:
              </Typography>
              <Rating
                value={rating}
                onChange={isRated ? undefined : handleRatingChange}
                size="small"
                precision={0.5}
                readOnly={isRated}
                icon={<StarIcon style={{ color: '#ef4444' }} />}
                emptyIcon={<StarIcon style={{ color: COLORS.claro + '60' }} />}
                sx={{
                  '& .MuiRating-icon': {
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  },
                  '& .MuiRating-iconHover': {
                    transform: !isRated ? 'scale(1.15)' : 'none',
                    borderRadius: '50%'
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: COLORS.bodyText }}>
                {typeof rating === 'number' ? rating.toFixed(1) : parseFloat(rating).toFixed(1) || '0.0'}
              </Typography>
            </Box>
            <Box sx={{ alignSelf: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: COLORS.mutedText, fontSize: '0.7rem' }}>
                ({totalRatings} calificaciones)
              </Typography>
            </Box>
          </Box>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{
          justifyContent: 'space-between',
          px: 3,
          pb: 3,
          pt: 0
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<Heart className="w-4 h-4" />}
              onClick={handleFavoriteToggle}
              sx={{
                color: isFavorite ? COLORS.error : COLORS.mutedText,
                '&:hover': {
                  backgroundColor: isFavorite ? `${COLORS.error}10` : `${COLORS.mutedText}10`
                }
              }}
            >
              {totalFavorites}
            </Button>
            <Button
              size="small"
              startIcon={<MessageCircle className="w-4 h-4" />}
              onClick={handleCommentDialogOpen}
              sx={{
                color: COLORS.error,
                '&:hover': {
                  backgroundColor: `${COLORS.error}15`,
                  color: COLORS.error
                }
              }}
            >
              {totalComments}
            </Button>
            <Button
              size="small"
              startIcon={<Expand size={16} className="w-4 h-4" />}
              onClick={handleExpandDialogOpen}
              sx={{
                color: COLORS.principal,
                "&:hover": {
                  backgroundColor: `${COLORS.principal}15`,
                  color: COLORS.principal
                }
              }}
            >
              Ver más
            </Button>
          </Box>
          </CardActions>
      </Card>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>🔥 COMENTARIOS ({totalComments})</DialogTitle>
        <DialogContent sx={{ maxHeight: '60vh' }}>
          {/* Lista de comentarios existentes */}
          <Box sx={{ mb: 3, maxHeight: '300px', overflowY: 'auto' }}>
            {loadingComments ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color={COLORS.mutedText}>
                  Cargando comentarios...
                </Typography>
              </Box>
            ) : comments.length > 0 ? (
              comments.map((comment) => {
                const isPostOwner = comment.author?.id === post.autorId || comment.autor?.id === post.autorId;
                return (
                  <Box
                    key={comment.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#fafafa',
                      border: '2px solid #f44336',
                      position: 'relative'
                    }}
                  >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: '#f44336',
                          color: COLORS.white,
                          mr: 1,
                          fontSize: '0.875rem',
                          border: '2px solid white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        {comment.author?.username?.[0]?.toUpperCase() || 'A'}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: '#d32f2f'
                          }}
                        >
                          {comment.author?.username || 'Anónimo'}
                          {isPostOwner && ' 👑'}
                        </Typography>
                      <Typography variant="caption" color={COLORS.mutedText}>
                        {new Date(comment.fecha).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    {currentUserId && (comment.author?.id === currentUserId || comment.autor?.id === currentUserId) && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCommentClick(comment)}
                        sx={{
                          color: COLORS.error,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 67, 54, 0.1)'
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    )}
                    {/* Botón de reportar para comentarios de otros usuarios */}
                    {currentUserId &&
                     (comment.author?.id !== currentUserId && comment.autor?.id !== currentUserId) &&
                     !comment.reportado && (
                      <IconButton
                        size="small"
                        onClick={() => handleReportComment(comment)}
                        sx={{
                          color: COLORS.mutedText,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 67, 54, 0.1)',
                            color: COLORS.error
                          }
                        }}
                        title="Reportar comentario"
                      >
                        <Flag size={16} />
                      </IconButton>
                    )}
                    {/* Indicador de comentario reportado */}
                    {comment.reportado && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: COLORS.error,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <Flag size={12} />
                        Reportado
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#c62828',
                      lineHeight: 1.5,
                      fontWeight: 500
                    }}
                  >
                    {comment.texto}
                  </Typography>
                </Box>
              );
              })
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color={COLORS.mutedText}>
                  No hay comentarios aún. ¡Sé el primero!
                </Typography>
              </Box>
            )}
          </Box>

        {/* Formulario para agregar nuevo comentario */}
        <Box sx={{ borderTop: `1px solid ${COLORS.divider}`, pt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.bodyText }}>
            Agrega tu comentario:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Escribe tu comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            variant="outlined"
          />
        </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCommentDialogOpen(false);
            setNewComment('');
          }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCommentSubmit}
            variant="contained"
            disabled={!newComment.trim()}
            sx={{
              bgcolor: COLORS.principal,
              '&:hover': { bgcolor: COLORS.oscuro },
              '&.Mui-disabled': { bgcolor: COLORS.mutedText }
            }}
            endIcon={<Send className="w-4 h-4" />}
          >
            Comentar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expand Dialog */}
      <Dialog
        open={expandDialogOpen}
        onClose={() => setExpandDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogContent sx={{
          p: 0,
          backgroundColor: 'transparent'
        }}>
          <Box sx={{
            background: `linear-gradient(135deg, rgba(239, 68, 68, 0.02), rgba(239, 68, 68, 0.04)), linear-gradient(135deg, ${COLORS.claro}10, ${COLORS.principal}05, transparent), linear-gradient(45deg, ${COLORS.principal}20, transparent, ${COLORS.claro}20)`,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundSize: '100% 100%, 100% 100%, 100% 100%',
            backgroundPosition: '0% 0%, 0% 0%, 0% 0%',
            backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
            backgroundBlend: 'normal, normal, multiply'
          }}>
            <Card sx={{
              borderRadius: 0,
              boxShadow: 'none',
              backgroundColor: 'transparent',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'visible'
            }}>
            <CardContent sx={{
              p: 4,
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible',
              position: 'relative'
            }}>
              {/* Header decorado exactamente igual que el original */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative' }}>
                {/* Insignia de recetas premium exactamente igual */}
                {post.averageRating >= 4.5 && (
                  <Box sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 28,
                    height: 28,
                    background: `linear-gradient(135deg, ${COLORS.principal}, ${COLORS.claro})`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 8px ${COLORS.principal}50`,
                    zIndex: 3,
                    animation: 'pulse 2s infinite'
                  }}>
                    <Award size={14} style={{ color: 'white' }} />
                  </Box>
                )}

                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: COLORS.principal,
                    color: COLORS.white,
                    mr: 2,
                    border: `2px solid ${COLORS.principal}40`,
                    boxShadow: `0 2px 8px ${COLORS.subtleShadow}`,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: -3,
                      left: -3,
                      right: -3,
                      bottom: -3,
                      border: `1px solid ${COLORS.claro}30`,
                      borderRadius: '50%',
                      zIndex: -1
                    }
                  }}
                >
                  {post.autor?.username?.[0]?.toUpperCase() || 'A'}
                </Avatar>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: COLORS.bodyText,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    {post.autor?.username || 'Anónimo'}
                    {post.averageRating >= 4.5 && (
                      <Sparkles size={14} style={{ color: COLORS.principal }} />
                    )}
                    {post.totalFavorites > 5 && (
                      <Heart size={12} style={{ color: '#ef4444' }} />
                    )}
                  </Typography>
                  <Typography variant="caption" color={COLORS.mutedText}>
                    {new Date(post.fechaPublicacion).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>

                {/* Menú de opciones exactamente igual */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {currentUserId === post.usuario_id && (
                    <IconButton
                      size="medium"
                      onClick={handleDeleteClick}
                      sx={{
                        mr: 1,
                        color: COLORS.error,
                        '&:hover': {
                          backgroundColor: `${COLORS.error}10`,
                          color: COLORS.error,
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Trash2 size={20} />
                    </IconButton>
                  )}
                  <IconButton
                    size="medium"
                    onClick={handleMenuClick}
                    sx={{
                      '&:hover': {
                        backgroundColor: `${COLORS.mutedText}10`,
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <MoreVertical size={20} style={{ color: COLORS.mutedText }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Imagen principal exactamente igual pero más grande */}
              {post.foto && (
                <Box sx={{
                  width: '100%',
                  mb: 3,
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  height: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, transparent 60%, rgba(209, 55, 39, 0.05) 100%)',
                      pointerEvents: 'none'
                    }
                  }
                }}>
                  <img
                    src={(() => {
                      const imageUrl = post.foto.startsWith('http') ? post.foto : `http://localhost:3000/${post.foto}`;
                      return imageUrl;
                    })()}
                    alt={post.titulo}
                    style={{
                      width: '100%',
                      height: '500px',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block',
                      backgroundColor: COLORS.fondoClaro,
                      padding: '8px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      e.target.style.animation = 'fadeIn 0.6s ease-out';
                    }}
                  />
                </Box>
              )}

              {/* Título - Después de la imagen en diálogo expandido */}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: COLORS.bodyText,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: COLORS.principal,
                    transform: 'translateX(5px)',
                    textShadow: '0 2px 4px rgba(209, 55, 39, 0.1)'
                  }
                }}
              >
                {post.titulo}
              </Typography>

              {/* Sección de chips de información exactamente igual que el original */}
              {(post.tiempoPreparacion || post.porciones || post.dificultad) && (
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  mb: 3,
                  flexWrap: 'wrap',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -5,
                    left: -5,
                    right: -5,
                    bottom: -5,
                    background: `linear-gradient(135deg, ${COLORS.claro}15, transparent)`,
                    borderRadius: 2,
                    zIndex: 0
                  }
                }}>
                  {post.tiempoPreparacion && (
                    <Chip
                      icon={<Clock size={14} style={{ color: COLORS.principal }} />}
                      label={formatTime(post.tiempoPreparacion, post.tiempoUnidad || 'min')}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        borderColor: COLORS.principal + '40',
                        backgroundColor: 'transparent',
                        color: COLORS.principal,
                        fontWeight: 600,
                        position: 'relative',
                        zIndex: 1,
                        '&:hover': {
                          backgroundColor: COLORS.principal + '08',
                          borderColor: COLORS.principal + '70',
                          transform: 'translateY(-2px) scale(1.05)',
                          boxShadow: '0 4px 12px rgba(209, 55, 39, 0.25)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '& .MuiChip-icon': {
                            transform: 'rotate(15deg) scale(1.2)'
                          }
                        },
                        '& .MuiChip-icon': {
                          transition: 'all 0.3s ease'
                        }
                      }}
                    />
                  )}
                  {post.porciones && (
                    <Chip
                      icon={<Users size={14} style={{ color: COLORS.oscuro }} />}
                      label={`${post.porciones} porciones`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        borderColor: COLORS.oscuro + '40',
                        backgroundColor: 'transparent',
                        color: COLORS.oscuro,
                        fontWeight: 600,
                        position: 'relative',
                        zIndex: 1,
                        '&:hover': {
                          backgroundColor: COLORS.oscuro + '08',
                          borderColor: COLORS.oscuro + '70',
                          transform: 'translateY(-2px) scale(1.05)',
                          boxShadow: '0 4px 12px rgba(139, 30, 20, 0.25)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '& .MuiChip-icon': {
                            transform: 'rotate(-15deg) scale(1.2)'
                          }
                        },
                        '& .MuiChip-icon': {
                          transition: 'all 0.3s ease'
                        }
                      }}
                    />
                  )}
                  {post.dificultad && (
                    <Chip
                      icon={<ChefHat size={14} style={{ color: post.dificultad === 'Fácil' ? '#22c55e' : post.dificultad === 'Media' ? '#f59e0b' : '#ef4444' }} />}
                      label={post.dificultad}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        borderColor: post.dificultad === 'Fácil' ? '#22c55e40' : post.dificultad === 'Media' ? '#f59e0b40' : '#ef444440',
                        backgroundColor: 'transparent',
                        color: post.dificultad === 'Fácil' ? '#22c55e' : post.dificultad === 'Media' ? '#f59e0b' : '#ef4444',
                        fontWeight: 600,
                        position: 'relative',
                        zIndex: 1,
                        '&:hover': {
                          backgroundColor: post.dificultad === 'Fácil' ? '#22c55e08' : post.dificultad === 'Media' ? '#f59e0b08' : '#ef444408',
                          borderColor: post.dificultad === 'Fácil' ? '#22c55e70' : post.dificultad === 'Media' ? '#f59e0b70' : '#ef444470',
                          transform: 'translateY(-2px) scale(1.05)',
                          boxShadow: post.dificultad === 'Fácil' ? '0 4px 12px rgba(34, 197, 94, 0.25)' : post.dificultad === 'Media' ? '0 4px 12px rgba(245, 158, 11, 0.25)' : '0 4px 12px rgba(239, 68, 68, 0.25)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '& .MuiChip-icon': {
                            transform: 'rotate(360deg) scale(1.2)'
                          }
                        },
                        '& .MuiChip-icon': {
                          transition: 'all 0.6s ease'
                        }
                      }}
                    />
                  )}
                </Box>
              )}

              {/* Etiquetas - Después de tiempo/dificultad en diálogo expandido */}
              {post.etiquetas && (
                (() => {
                  let tagsArray = [];

                  if (Array.isArray(post.etiquetas)) {
                    tagsArray = post.etiquetas;
                  } else if (typeof post.etiquetas === 'string') {
                    try {
                      tagsArray = JSON.parse(post.etiquetas);
                    } catch (e) {
                      tagsArray = [];
                    }
                  } else if (post.etiquetas) {
                    try {
                      tagsArray = JSON.parse(JSON.stringify(post.etiquetas));
                      if (!Array.isArray(tagsArray)) {
                        tagsArray = [];
                      }
                    } catch (e) {
                      tagsArray = [];
                    }
                  }

                  return tagsArray.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {tagsArray.map((tagId, index) => (
                        <Chip
                          key={tagId || index}
                          label={getTagName(tagId)}
                          size="small"
                          sx={{
                            backgroundColor: `${getTagColor(tagId)}12`,
                            color: getTagColor(tagId),
                            borderColor: getTagColor(tagId),
                            fontSize: '0.75rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              backgroundColor: `${getTagColor(tagId)}25`,
                              borderColor: getTagColor(tagId),
                              transform: 'translateY(-2px) scale(1.08)',
                              boxShadow: `0 6px 16px ${getTagColor(tagId)}30`,
                              color: getTagColor(tagId)
                            }
                          }}
                        />
                      ))}
                    </Box>
                  ) : null;
                })()
              )}

              {/* Contenido completo sin scroll en modo expandido, exactamente igual que el original */}
              <Box sx={{ mb: 3, flexGrow: 1 }}>
                {/* Mostrar ingredientes si existe - exactamente igual que el original */}
                {recipeContent.ingredientes && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: COLORS.bodyText,
                        fontWeight: 600,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      🥘 Ingredientes:
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: COLORS.bodyText,
                        lineHeight: 1.7,
                        pl: 3,
                        backgroundColor: 'rgba(239, 68, 68, 0.04)',
                        borderLeft: '4px solid #ef4444',
                        borderRadius: 1,
                        p: 3,
                        whiteSpace: "pre-line"
                      }}
                    >
                      {recipeContent.ingredientes}
                    </Typography>
                  </Box>
                )}

                {/* Mostrar pasos si existe - exactamente igual que el original */}
                {recipeContent.pasos && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: COLORS.bodyText,
                        fontWeight: 600,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      👩‍🍳 Pasos a seguir:
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: COLORS.bodyText,
                        lineHeight: 1.7,
                        pl: 3,
                        backgroundColor: 'rgba(239, 68, 68, 0.06)',
                        borderLeft: '4px solid #dc2626',
                        borderRadius: 1,
                        p: 3,
                        whiteSpace: "pre-line"
                      }}
                    >
                      {recipeContent.pasos}
                    </Typography>
                  </Box>
                )}

                {/* Si no tiene el formato con emojis, mostrar el contenido original */}
                {!recipeContent.ingredientes && !recipeContent.pasos && (
                  <Typography variant="body1" sx={{
                    color: COLORS.bodyText,
                    lineHeight: 1.7
                  }}>
                    {post.contenido}
                  </Typography>
                )}
              </Box>

              {/* Rating exactamente igual que el original */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.5,
                mb: 2,
                pt: 2,
                borderTop: `1px solid ${COLORS.divider}`
              }}>
                <Typography variant="body2" sx={{ color: COLORS.mutedText, mb: 1 }}>
                  {totalRatings > 0 ? `Calificación de la comunidad` : 'Sé el primero en calificar'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rating
                    name={`rating-${post.id}`}
                    value={rating}
                    precision={0.5}
                    max={5}
                    onChange={handleRatingChange}
                    disabled={isRated || !currentUserId}
                    icon={<StarIcon style={{ color: '#ef4444', fontSize: '28px' }} />}
                    emptyIcon={<StarIcon style={{ color: '#d1d5db', fontSize: '28px' }} />}
                    sx={{
                      transform: !isRated ? 'scale(1.15)' : 'none',
                      '& .MuiRating-icon': {
                        borderRadius: '50%',
                        transition: 'all 0.2s ease',
                        filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.2))'
                      },
                      '& .MuiRating-iconHover': {
                        transform: !isRated ? 'scale(1.2)' : 'none',
                        borderRadius: '50%',
                        filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
                      },
                      '& .MuiRating-iconFilled': {
                        color: '#ef4444'
                      },
                      '& .MuiRating-iconEmpty': {
                        color: isRated ? '#d1d5db' : '#d1d5db',
                        opacity: isRated ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: '#ef444480',
                          transform: 'scale(1.1)',
                          filter: 'drop-shadow(0 3px 6px rgba(239, 68, 68, 0.25))'
                        }
                      }
                    }}
                    size="large"
                  />
                  <Typography variant="body2" sx={{ color: COLORS.bodyText }}>
                    {typeof rating === 'number' ? rating.toFixed(1) : parseFloat(rating).toFixed(1) || '0.0'}
                  </Typography>
                </Box>
                <Box sx={{ alignSelf: 'flex-end' }}>
                  <Typography variant="caption" sx={{ color: COLORS.mutedText, fontSize: '0.8rem' }}>
                    ({totalRatings} calificaciones)
                  </Typography>
                </Box>
              </Box>

              {/* Acciones exactamente igual que el original */}
              <CardActions sx={{
                justifyContent: 'space-between',
                px: 0,
                pb: 0,
                pt: 1
              }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Heart className="w-4 h-4" />}
                    onClick={handleFavoriteToggle}
                    disabled={!currentUserId}
                    sx={{
                      color: isFavorite ? COLORS.error : COLORS.mutedText,
                      '&:hover': {
                        backgroundColor: isFavorite ? `${COLORS.error}10` : `${COLORS.mutedText}10`
                      }
                    }}
                  >
                    {totalFavorites}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<MessageCircle className="w-4 h-4" />}
                    onClick={handleCommentDialogOpen}
                    sx={{
                      color: COLORS.error,
                      '&:hover': {
                        backgroundColor: `${COLORS.error}15`,
                        color: COLORS.error
                      }
                    }}
                  >
                    {totalComments}
                  </Button>
                          </Box>
              </CardActions>
            </CardContent>
          </Card>
        <DialogActions sx={{
          backgroundColor: 'transparent',
          borderTop: `1px solid rgba(239, 68, 68, 0.08)`,
          p: 2
        }}>
          <Button
            onClick={() => setExpandDialogOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: COLORS.principal,
              '&:hover': {
                backgroundColor: COLORS.oscuro
              }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Box>
      </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: COLORS.error }}>
          Eliminar Receta
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que quieres eliminar esta receta?
          </Typography>
          <Typography variant="body2" color={COLORS.mutedText}>
            "{post.titulo}"
          </Typography>
          <Typography variant="body2" color={COLORS.error} sx={{ mt: 2, fontWeight: 600 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: COLORS.error,
              '&:hover': { bgcolor: COLORS.oscuro }
            }}
            startIcon={<Trash2 className="w-4 h-4" />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog open={deleteCommentDialogOpen} onClose={handleDeleteCommentCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: COLORS.error }}>
          Eliminar Comentario
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que quieres eliminar este comentario?
          </Typography>
          {commentToDelete && (
            <Typography variant="body2" color={COLORS.mutedText} sx={{ fontStyle: 'italic' }}>
              "{commentToDelete.texto || commentToDelete.contenido}"
            </Typography>
          )}
          <Typography variant="body2" color={COLORS.error} sx={{ mt: 2, fontWeight: 600 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCommentCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteCommentConfirm}
            variant="contained"
            sx={{
              bgcolor: COLORS.error,
              '&:hover': { bgcolor: COLORS.oscuro }
            }}
            startIcon={<Trash2 className="w-4 h-4" />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Reporte de Comentario */}
      <ReportDialog
        open={reportCommentDialogOpen}
        onClose={() => {
          setReportCommentDialogOpen(false);
          setSelectedCommentToReport(null);
        }}
        onSubmit={handleSubmitCommentReport}
        reportType="comment"
        itemName={`Comentario de ${selectedCommentToReport?.autor?.username || 'usuario'}`}
      />

      {/* Diálogo de Reporte de Publicación */}
      <ReportDialog
        open={reportPostDialogOpen}
        onClose={() => setReportPostDialogOpen(false)}
        onSubmit={handleSubmitPostReport}
        reportType="post"
        itemName={post.titulo}
      />
    </>
  );
}