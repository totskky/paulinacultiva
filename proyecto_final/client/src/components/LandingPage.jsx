import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Grid,
  IconButton
} from '@mui/material';
import {
  ChefHat,
  HelpCircle
} from 'lucide-react';
import { COLORS } from '../utils/colors';

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Imágenes de comida para el carrusel de fondo
  const foodImages = [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=1080&fit=crop&crop=entropy&q=80', // Pasta fresca
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&h=1080&fit=crop&crop=entropy&q=80', // Pizza italiana
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920&h=1080&fit=crop&crop=entropy&q=80', // Postre de chocolate
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1920&h=1080&fit=crop&crop=entropy&q=80', // Ensalada fresca
    'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=1920&h=1080&fit=crop&crop=entropy&q=80', // Pan fresco
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1920&h=1080&fit=crop&crop=entropy&q=80', // Verduras frescas
  ];

  // Precargar imágenes para mejor rendimiento
  useEffect(() => {
    foodImages.forEach((image) => {
      const img = new Image();
      img.src = image;
    });
  }, []);

  // Carrusel automático de imágenes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % foodImages.length);
    }, 5000); // Cambiar imagen cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section con Carrusel de Imágenes */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${foodImages[currentImageIndex]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transition: 'opacity 1.5s ease-in-out',
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.1) 100%)',
            backdropFilter: 'blur(1px)',
            zIndex: 2,
          },
          '@keyframes float': {
            '0%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' },
            '100%': { transform: 'translateY(0px)' }
          }
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 3, py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            {/* Logo mejorado */}
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 5,
              p: 2.5,
              borderRadius: '25px',
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <ChefHat className="w-16 h-16 mr-3" style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  color: '#ffffff',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  fontFamily: "'Lora', serif",
                  letterSpacing: -0.5
                }}
              >
                Paulina Cultiva
              </Typography>
            </Box>

            {/* Título principal con efectos */}
            <Typography
              variant="h1"
              sx={{
                mb: 4,
                fontWeight: 800,
                color: '#ffffff',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.1,
                fontFamily: "'Lora', serif",
                position: 'relative',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                '& span': {
                  position: 'relative',
                  color: `${COLORS.principal}dd`,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '3px',
                    left: 0,
                    right: 0,
                    height: '10px',
                    backgroundColor: `${COLORS.principal}30`,
                    borderRadius: '4px',
                    zIndex: -1
                  }
                }
              }}
            >
              Comparte tus <Box component="span">recetas</Box>,<br />
              cultiva <Box component="span">sabores</Box>
            </Typography>

            {/* Subtítulo elegante */}
            <Typography
              variant="h6"
              sx={{
                mb: 8,
                color: '#f0f0f0',
                fontWeight: 400,
                lineHeight: 1.7,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                maxWidth: '600px',
                mx: 'auto',
                px: 2,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              Únete a una comunidad apasionada por la cocina, donde cada receta cuenta una historia y cada plato une personas.
            </Typography>

            {/* Botones ultra delicados y etéreos */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              sx={{ justifyContent: 'center', alignItems: 'center' }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  py: 2.2,
                  px: 4.5,
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  textTransform: 'none',
                  borderRadius: '25px',
                  background: `linear-gradient(135deg, ${COLORS.principal}99, ${COLORS.oscuro}aa)`,
                  boxShadow: '0 3px 12px rgba(209, 55, 39, 0.08)',
                  border: `0.5px solid ${COLORS.principal}50`,
                  color: '#ffffff',
                  letterSpacing: '0.5px',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${COLORS.principal}bb, ${COLORS.oscuro}cc)`,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 16px rgba(209, 55, 39, 0.15)',
                    border: `0.5px solid ${COLORS.principal}70`,
                  },
                  transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(6px)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                    transition: 'left 0.6s',
                  },
                  '&:hover::before': {
                    left: '100%',
                  }
                }}
              >
                Unite a nosotros
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  py: 2.2,
                  px: 4.5,
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  textTransform: 'none',
                  borderRadius: '25px',
                  borderWidth: '0.8px',
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  color: '#ffffff',
                  background: 'rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  letterSpacing: '0.5px',
                  '&:hover': {
                    borderWidth: '1px',
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#ffffff',
                    background: 'rgba(0, 0, 0, 0.25)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.15)',
                  },
                  transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                }}
              >
                Iniciar sesión
              </Button>
            </Stack>
          </Box>
        </Container>

        {/* Indicadores del carrusel mejorados */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1.5,
            zIndex: 4,
          }}
        >
          {foodImages.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: currentImageIndex === index
                  ? `${COLORS.principal}`
                  : 'rgba(255, 255, 255, 0.5)',
                border: currentImageIndex === index
                  ? '2px solid rgba(255, 255, 255, 0.8)'
                  : '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                cursor: 'pointer',
                backdropFilter: 'blur(2px)',
                '&:hover': {
                  backgroundColor: `${COLORS.principal}cc`,
                  transform: 'scale(1.2)',
                }
              }}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </Box>
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
    </Box>
  );
}