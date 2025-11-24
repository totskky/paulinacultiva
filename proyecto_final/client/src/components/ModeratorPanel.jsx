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
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Grid,
  Avatar
} from '@mui/material';
import {
  ArrowLeft,
  Shield,
  Flag,
  Users,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  LogOut
} from 'lucide-react';
import { useToast, ToastContainer } from './Toast';
import { COLORS } from '../utils/colors';
import axios from 'axios';
import ModeratorReportDialog from './ModeratorReportDialog';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function ModeratorPanel() {
  const navigate = useNavigate();
  const { toasts, showToast, closeToast, removeToast } = useToast();

  // Estados principales
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Estados de datos
  const [reports, setReports] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [stats, setStats] = useState({
    pendingReports: 0,
    totalReports: 0,
    inactiveUsers: 0,
    totalUsers: 0
  });

  // Estados de loading
  const [reportsLoading, setReportsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Estados de diálogos
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadStats();
      if (activeTab === 0) loadReports();
      if (activeTab === 1) loadInactiveUsers();
    }
  }, [user, activeTab]);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.role !== 'moderator') {
        showToast('Acceso denegado. Se requiere rol de moderador', 'error', 3000);
        navigate('/home');
        return;
      }

      setUser(response.data);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      showToast('Error al verificar permisos', 'error', 3000);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/moderator/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/moderator/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      showToast('Error al cargar reportes', 'error', 3000);
    } finally {
      setReportsLoading(false);
    }
  };

  const loadInactiveUsers = async () => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/moderator/inactive-users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setInactiveUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error al cargar usuarios inactivos:', error);
      showToast('Error al cargar usuarios inactivos', 'error', 3000);
    } finally {
      setUsersLoading(false);
    }
  };

const handleReportAction = async (action) => {
    console.log('🔥 handleReportAction called with action:', action);

    try {
      const token = localStorage.getItem('token');

      // Extraer la acción del objeto si viene como {action: 'delete_content'}
      const actualAction = typeof action === 'object' && action.action ? action.action : action;
      console.log('🔥 Extracted actualAction:', actualAction);

      // Determinar el estado correcto según la acción
      let status;
      if (actualAction === 'resolve') {
        status = 'resolved'; // Se marca como revisado pero no se elimina el contenido
      } else if (actualAction === 'delete_content') {
        status = 'resolved'; // Se resuelve el reporte porque el contenido fue eliminado
      } else {
        status = 'dismissed'; // Se descarta el reporte
      }

      const requestBody = {
        status,
        action: actualAction === 'delete_content' ? 'delete_content' : null
      };

      console.log('🔥 Frontend sending request:', {
        reportId: selectedReport.id,
        requestBody
      });

      const response = await axios.put(
        `http://localhost:3000/api/moderator/reports/${selectedReport.id}`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        const message = action === 'delete_content'
          ? 'Contenido eliminado y reporte resuelto correctamente'
          : action === 'resolve'
          ? 'Reporte marcado como revisado correctamente'
          : 'Reporte descartado correctamente';

        showToast(message, 'success', 3000);
        setReportDialogOpen(false);
        setSelectedReport(null);
        loadReports();
        loadStats();
      }
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      showToast('Error al actualizar reporte', 'error', 3000);
    }
  };
  const handleUpdateReportStatus = async (reportId, status, action = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:3000/api/moderator/reports/${reportId}`,
        { status, action },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast('Reporte actualizado correctamente', 'success', 3000);
        loadReports();
        loadStats();
      }
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      showToast('Error al actualizar reporte', 'error', 3000);
    }
  };

  const handleToggleUserStatus = async (userId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:3000/api/moderator/users/${userId}/status`,
        { action },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast(`Usuario ${action === 'activate' ? 'activado' : 'desactivado'} correctamente`, 'success', 3000);
        loadInactiveUsers();
        loadStats();
        setUserDialogOpen(false);
      }
    } catch (error) {
      console.error('Error al cambiar estado de usuario:', error);
      showToast('Error al cambiar estado de usuario', 'error', 3000);
    }
  };

  const handleDeleteContent = async (type, contentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:3000/api/moderator/content/${type}/${contentId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast(`${type === 'post' ? 'Publicación' : 'Comentario'} eliminado correctamente`, 'success', 3000);
        loadReports();
        loadStats();
      }
    } catch (error) {
      console.error('Error al eliminar contenido:', error);
      showToast('Error al eliminar contenido', 'error', 3000);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getReportReasonLabel = (reason) => {
    const labels = {
      spam: 'Spam',
      inappropriate_content: 'Contenido inapropiado',
      harassment: 'Acoso',
      violence: 'Violencia',
      copyright: 'Derechos de autor',
      misinformation: 'Información falsa',
      hate_speech: 'Discurso de odio',
      other: 'Otro'
    };
    return labels[reason] || reason;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      reviewed: 'info',
      resolved: 'success',
      dismissed: 'default'
    };
    return colors[status] || 'default';
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
        {/* Header */}
        <AppBar position="static" sx={{ bgcolor: COLORS.paperBg, color: COLORS.bodyText, boxShadow: `0 1px 3px 0 ${COLORS.subtleShadow}` }}>
          <Toolbar>
            <IconButton onClick={() => navigate('/home')} sx={{ mr: 2, color: COLORS.bodyText }}>
              <ArrowLeft />
            </IconButton>
            <Shield sx={{ mr: 2, color: COLORS.principal }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Panel de Moderador
            </Typography>
            <Typography variant="body2" sx={{ mr: 2, color: COLORS.mutedText }}>
              {user?.username}
            </Typography>
            <Avatar sx={{ bgcolor: COLORS.principal }}>
              {user?.username?.[0]?.toUpperCase() || 'M'}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Estadísticas */}
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: COLORS.paperBg, border: 'none' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Badge badgeContent={stats.pendingReports} color="error">
                    <Flag sx={{ fontSize: 40, color: COLORS.error }} />
                  </Badge>
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                    {stats.pendingReports}
                  </Typography>
                  <Typography variant="body2" color={COLORS.mutedText}>
                    Reportes Pendientes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: COLORS.paperBg, border: 'none' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Users sx={{ fontSize: 40, color: COLORS.principal }} />
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                    {stats.inactiveUsers}
                  </Typography>
                  <Typography variant="body2" color={COLORS.mutedText}>
                    Usuarios Inactivos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: COLORS.paperBg, border: 'none' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AlertTriangle sx={{ fontSize: 40, color: COLORS.warning }} />
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                    {stats.totalReports}
                  </Typography>
                  <Typography variant="body2" color={COLORS.mutedText}>
                    Total Reportes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: COLORS.paperBg, border: 'none' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Users sx={{ fontSize: 40, color: COLORS.success }} />
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color={COLORS.mutedText}>
                    Total Usuarios
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Paper sx={{ bgcolor: COLORS.paperBg, border: 'none' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ borderBottom: `1px solid ${COLORS.subtleShadow}` }}
            >
              <Tab
                icon={<Badge badgeContent={stats.pendingReports} color="error"><Flag /></Badge>}
                label="Reportes"
                iconPosition="start"
              />
              <Tab
                icon={<Users />}
                label="Usuarios Inactivos"
                iconPosition="start"
              />
            </Tabs>

            {/* Tab de Reportes */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  🚩 Reportes de Contenido
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw />}
                  onClick={loadReports}
                  disabled={reportsLoading}
                >
                  Actualizar
                </Button>
              </Box>

              {reportsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : reports.length === 0 ? (
                <Alert severity="info">
                  No hay reportes para revisar en este momento.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Contenido</TableCell>
                        <TableCell>Reportado por</TableCell>
                        <TableCell>Razón</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Chip
                              label={report.reportType === 'post' ? 'Publicación' : 'Comentario'}
                              color={report.reportType === 'post' ? 'primary' : 'secondary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {report.reportedContent ? (
                              report.reportType === 'post'
                                ? report.reportedContent.titulo
                                : report.reportedContent.contenido.substring(0, 50) + '...'
                            ) : 'Contenido no encontrado'}
                          </TableCell>
                          <TableCell>{report.reporter?.username || 'Anónimo'}</TableCell>
                          <TableCell>{getReportReasonLabel(report.reason)}</TableCell>
                          <TableCell>
                            <Chip
                              label={report.status}
                              color={getStatusColor(report.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {report.status === 'pending' && (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setReportDialogOpen(true);
                                  }}
                                  title="Gestionar reporte"
                                >
                                  <Eye size={16} color={COLORS.principal} />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            {/* Tab de Usuarios Inactivos */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  👥 Usuarios Inactivos
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw />}
                  onClick={loadInactiveUsers}
                  disabled={usersLoading}
                >
                  Actualizar
                </Button>
              </Box>

              {usersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : inactiveUsers.length === 0 ? (
                <Alert severity="info">
                  No hay usuarios inactivos en este momento.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {inactiveUsers.map((userItem) => (
                    <Grid item xs={12} sm={6} md={4} key={userItem.id}>
                      <Card sx={{ bgcolor: COLORS.paperBg, border: 'none' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2, bgcolor: COLORS.error }}>
                              {userItem.username[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {userItem.username}
                              </Typography>
                              <Typography variant="body2" color={COLORS.mutedText}>
                                {userItem.email}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color={COLORS.mutedText} sx={{ mb: 1 }}>
                            Posts: {userItem.postsCount} | Comentarios: {userItem.commentsCount}
                          </Typography>
                          <Typography variant="caption" color={COLORS.mutedText}>
                            Inactivo desde: {new Date(userItem.updatedAt).toLocaleDateString('es-ES')}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => {
                              setSelectedUser(userItem);
                              setUserDialogOpen(true);
                            }}
                            startIcon={<CheckCircle size={16} />}
                          >
                            Reactivar
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
          </Paper>
        </Container>

        {/* Diálogo de gestión de reportes */}
        <ModeratorReportDialog
          open={reportDialogOpen}
          onClose={() => {
            setReportDialogOpen(false);
            setSelectedReport(null);
          }}
          onSubmit={handleReportAction}
          report={selectedReport}
        />

        {/* Diálogo de confirmación para usuario */}
        <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirmar Reactivación</DialogTitle>
          <DialogContent>
            <Typography paragraph>
              ¿Estás seguro de que quieres reactivar al usuario <strong>{selectedUser?.username}</strong>?
            </Typography>
            <Alert severity="info">
              Al reactivar al usuario:
              <ul>
                <li>Su cuenta volverá a estar activa</li>
                <li>Podrá iniciar sesión nuevamente</li>
                <li>Sus publicaciones y comentarios volverán a ser visibles</li>
              </ul>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleToggleUserStatus(selectedUser.id, 'activate');
                }
              }}
              variant="contained"
              color="success"
            >
              Reactivar Usuario
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}

export default ModeratorPanel;