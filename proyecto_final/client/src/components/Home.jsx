// src/components/Home.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, Container, Paper, Avatar, IconButton, Chip, InputAdornment, TextField, CircularProgress } from '@mui/material';
import { ChefHat, Bell, Plus, Search, X, Shield, HelpCircle } from 'lucide-react';
import { useToast, ToastContainer } from './Toast';
import NotificationsDropdown from './NotificationsDropdown';
import { COLORS } from '../utils/colors';
import { TAGS } from '../utils/constants';
import PostCard from './PostCard_old';

function Home() {
  const navigate = useNavigate();
  const { toasts, showToast, closeToast, removeToast } = useToast();
  const [userName, setUserName] = useState('Usuario');
  const [isAdmin, setIsAdmin] = useState(false);

  // Posts dinámicos desde la API
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Obtener usuario actual
  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('http://localhost:3000/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Actualizar estado solo si ha cambiado
        if (data.id !== currentUserId) {
          setCurrentUserId(data.id);
          setUserName(data.username);
          setIsAdmin(data.isAdmin || false);
        }

        // Verificar si viene de un registro exitoso (parámetro en URL) - solo una vez
        const urlParams = new URLSearchParams(window.location.search);
        const fromRegistration = urlParams.get('from') === 'registration';

        // Mostrar notificación de bienvenida especial solo si viene del registro
        if (fromRegistration && !sessionStorage.getItem('welcomeShown')) {
          showToast({
            id: 'welcome', // ID único para identificar esta notificación
            message: `¡Hola, ${data.username}! 👋`,
            type: 'welcome',
            duration: 4000,
            position: 'top-right',
            style: {
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', // Gradiente naranja suave
              color: 'white',
              borderRadius: '20px', // Más redondeado
              padding: '12px 20px', // Más pequeño y compacto
              boxShadow: '0 4px 16px rgba(255, 107, 53, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '14px', // Más pequeño
              fontWeight: '600',
              minWidth: '280px',
              animation: 'slideInRight 0.5s ease-out',
              transform: 'none', // Sin escala extra
              backdropFilter: 'blur(10px)',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                borderRadius: '20px'
              }
            }
          });

          // Marcar que ya se mostró y limpiar URL
          sessionStorage.setItem('welcomeShown', 'true');
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        return data.id;
      }
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
    }
    return null;
  };

  // Manejar eliminación de post
  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post.id !== postId));
    showToast('Receta eliminada exitosamente', 'success', 2000);
  };

  // Manejar calificación de post
  const handleRatingChange = async (postId, rating) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/posts/${postId}/calification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: rating })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Calificación guardada:', data);

        // Actualizar el post localmente con la nueva calificación
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  userRating: rating, // Guardar la calificación del usuario actual
                  averageRating: data.averageRating || post.averageRating || rating,
                  totalRatings: data.totalRatings || post.totalRatings || (post.totalRatings || 0) + 1
                }
              : post
          )
        );
        showToast('¡Calificación guardada exitosamente! ⭐', 'success', 2000);
      } else {
        const errorData = await response.json();
        console.error('❌ Error al calificar:', errorData);
        // Solo mostrar error si no es por calificación duplicada
        const errorMessage = errorData.error || errorData.message || 'Error al calificar';
        if (!errorMessage.toLowerCase().includes('ya calificaste') &&
            !errorMessage.toLowerCase().includes('ya has calificado') &&
            !errorMessage.toLowerCase().includes('already rated')) {
          showToast(errorMessage, 'error', 3000);
        }
      }
    } catch (error) {
      console.error('Error al calificar:', error);
      showToast('Error de conexión al calificar', 'error', 3000);
    }
  };

  // Cargar datos iniciales - optimizado para evitar múltiples llamadas
  useEffect(() => {
    const initializeHome = async () => {
      // Evitar inicialización si ya tenemos datos
      if (currentUserId && posts.length > 0) {
        setLoading(false);
        return;
      }

      const userId = await getCurrentUser();
      if (userId) {
        await loadPosts();
      }
      setLoading(false);
    };

    initializeHome();
  }, []); // Solo se ejecuta una vez al montar

  const loadPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/recipes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Usar los datos directamente de la API (ya vienen en el formato correcto)
        const transformedPosts = data.recipes.map(recipe => ({
          ...recipe,
          // Campos adicionales para el frontend
          averageRating: 0, // TODO: implementar calificaciones
          totalRatings: 0,
          totalFavorites: 0,
          isFavorite: false,
          comments: []
        }));
        setPosts(transformedPosts);
      } else {
        console.error('Error al cargar posts');
        showToast('Error al cargar las recetas', 'error', 3000);
      }
    } catch (error) {
      console.error('Error al cargar posts:', error);
      showToast('Error de conexión al cargar las recetas', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  
  const [openNewPost, setOpenNewPost] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);


  
  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSearch = () => {
    if (selectedTags.length === 0) {
      showToast('Por favor, selecciona al menos una etiqueta para buscar', 'error', 3000);
      return;
    }

    // Usar la misma lógica de filtrado que getFilteredPosts para consistencia
    const filteredPosts = getFilteredPosts();

    showToast(`Se encontraron ${filteredPosts.length} recetas con las etiquetas seleccionadas`, 'success', 2000);
    setSearchOpen(false);
  };

  // Función para filtrar posts según las etiquetas seleccionadas
  const getFilteredPosts = () => {
    if (selectedTags.length === 0) {
      return posts;
    }
    return posts.filter(post => {
      // Manejar diferentes formatos de etiquetas
      let postTags = [];

      if (post.etiquetas) {
        if (Array.isArray(post.etiquetas)) {
          postTags = post.etiquetas;
        } else if (typeof post.etiquetas === 'string') {
          try {
            postTags = JSON.parse(post.etiquetas);
          } catch (e) {
            // Si no es JSON válido, intentar extraer etiquetas manualmente
            const matches = post.etiquetas.match(/"([^"]+)"/g);
            if (matches) {
              postTags = matches.map(match => match.replace(/"/g, ''));
            }
          }
        }
      }

      return selectedTags.some(tagId => postTags.includes(tagId));
    });
  };

  const clearSearch = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  
  return (
    <>
      <ToastContainer toasts={toasts} closeToast={closeToast} removeToast={removeToast} />

      <Box sx={{ minHeight: '100vh', bgcolor: COLORS.fondoClaro }}>
        {/* Header/AppBar */}
        <AppBar
          position="static"
          sx={{
            bgcolor: COLORS.paperBg,
            color: COLORS.bodyText,
            boxShadow: `0 1px 3px 0 ${COLORS.subtleShadow}`
          }}
        >
          <Toolbar>
            <ChefHat className="w-8 h-8 mr-2" style={{ color: COLORS.principal }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: COLORS.principal }}>
              Paulina Cultiva
            </Typography>

            {/* Botón de panel de administrador - solo visible para admins */}
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<Shield className="w-4 h-4" />}
                onClick={() => navigate('/admin')}
                sx={{
                  mr: 2,
                  borderColor: '#FF6B35',
                  color: '#FF6B35',
                  '&:hover': {
                    borderColor: '#FF5722',
                    bgcolor: 'rgba(255, 107, 53, 0.04)',
                    color: '#FF5722'
                  },
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Panel Admin
              </Button>
            )}

            <Button
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/nueva-receta')} // ← Navega al formulario completo
              sx={{
                mr: 2,
                bgcolor: COLORS.principal,
                '&:hover': { bgcolor: COLORS.oscuro },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Nueva Receta
            </Button>

  
            <NotificationsDropdown userId={currentUserId} />

            <IconButton
              onClick={() => navigate('/perfil')}
              sx={{
                bgcolor: COLORS.paperBg,
                '&:hover': {
                  bgcolor: COLORS.principal,
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
              title="Mi Perfil"
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: COLORS.principal,
                  fontSize: '0.875rem',
                  border: '2px solid transparent',
                  '&:hover': {
                    border: '2px solid #fff'
                  }
                }}
              >
                {userName[0].toUpperCase()}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>

  
        {/* Search Section - Moved to Top */}
        <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
          <Paper sx={{ p: 3, bgcolor: COLORS.paperBg, borderRadius: 3 }}>
            {/* Search Bar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Selecciona etiquetas para buscar..."
                value={selectedTags.length > 0 ? `${selectedTags.length} etiqueta(s) seleccionada(s)` : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="w-5 h-5" style={{ color: COLORS.mutedText }} />
                    </InputAdornment>
                  ),
                  endAdornment: selectedTags.length > 0 && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={clearSearch}
                        sx={{ color: COLORS.mutedText }}
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  readOnly: true,
                  onClick: () => setSearchOpen(!searchOpen),
                  sx: {
                    cursor: 'pointer',
                    bgcolor: COLORS.fondoClaro,
                    '&:hover': { bgcolor: COLORS.divider }
                  }
                }}
                variant="outlined"
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={selectedTags.length === 0}
                startIcon={<Search className="w-4 h-4" />}
                sx={{
                  bgcolor: COLORS.principal,
                  '&:hover': { bgcolor: COLORS.oscuro },
                  '&.Mui-disabled': { bgcolor: COLORS.mutedText }
                }}
              >
                Buscar
              </Button>
            </Box>

            {/* Tags Dropdown */}
            {searchOpen && (
              <Box sx={{
                p: 2,
                bgcolor: COLORS.fondoClaro,
                borderRadius: 2,
                border: `1px solid ${COLORS.divider}`
              }}>
                <Typography variant="body2" sx={{ mb: 2, color: COLORS.bodyText, fontWeight: 600 }}>
                  Selecciona una o más etiquetas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {TAGS.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      clickable
                      onClick={() => handleTagToggle(tag.id)}
                      color={selectedTags.includes(tag.id) ? 'primary' : 'default'}
                      variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
                      sx={{
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : COLORS.paperBg,
                        color: selectedTags.includes(tag.id) ? COLORS.white : COLORS.bodyText,
                        borderColor: tag.color,
                        '&:hover': {
                          backgroundColor: selectedTags.includes(tag.id) ? tag.color : `${tag.color}20`,
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Container>

        {/* Main Content - Posts Centered */}
        <Container maxWidth="lg" sx={{ mt: 2, pb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: COLORS.bodyText }}>
              🍳 Explorar Recetas
              {selectedTags.length > 0 && (
                <Typography component="span" variant="body2" sx={{ ml: 2, color: COLORS.mutedText }}>
                  (Filtrando por {selectedTags.length} etiqueta(s))
                </Typography>
              )}
            </Typography>

            <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',           // 1 columna en móviles
              sm: 'repeat(2, 1fr)', // 2 columnas en tablets pequeñas
              md: 'repeat(3, 1fr)'  // 3 columnas en desktop
            },
            gap: 3
          }}>
              {loading ? (
                <Paper sx={{ p: 6, bgcolor: COLORS.paperBg, borderRadius: 2, textAlign: 'center', gridColumn: '1 / -1' }}>
                  <CircularProgress sx={{ mb: 2, color: COLORS.principal }} />
                  <Typography variant="h6" sx={{ color: COLORS.bodyText, mb: 1 }}>
                    Cargando recetas...
                  </Typography>
                </Paper>
              ) : getFilteredPosts().length > 0 ? (
                getFilteredPosts().map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onDelete={handleDeletePost}
                    onRatingChange={handleRatingChange}
                  />
                ))
              ) : (
                <Paper sx={{ p: 4, bgcolor: COLORS.paperBg, borderRadius: 2, textAlign: 'center', gridColumn: '1 / -1' }}>
                  <Typography variant="h6" sx={{ color: COLORS.bodyText, mb: 1 }}>
                    No se encontraron recetas
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.mutedText }}>
                    {selectedTags.length > 0
                      ? "No hay recetas que coincidan con las etiquetas seleccionadas"
                      : "No hay publicaciones para mostrar. ¡Sé el primero en compartir una receta!"
                    }
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>
          </Box>
        </Container>
      </Box>

      {/* Botón flotante de soporte */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <IconButton
          href="mailto:paulina.cultiva.rrhh@gmail.com?subject=Consulta%20de%20soporte%20-%20Paulina%20Cultiva&body=Hola%20Paulina%20Cultiva,%0D%0A%0D%0AEscribo%20para%20solicitar%20ayuda%20con:%0D%0A%0D%0A[Tu%20consulta%20aquí]"
          sx={{
            backgroundColor: COLORS.principal,
            color: 'white',
            width: 56,
            height: 56,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              backgroundColor: COLORS.principalHover || COLORS.principal,
              transform: 'scale(1.05)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
            },
            transition: 'all 0.3s ease-in-out',
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <HelpCircle size={24} fill="white" />
        </IconButton>
      </Box>
    </>
  );
}

export default Home;