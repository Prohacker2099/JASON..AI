import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemText,
  CssBaseline, Box, Container, Grid, Paper, Card, CardContent, CardActions, CircularProgress,
  Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import DevicesIcon from '@mui/icons-material/Devices';
import SettingsIcon from '@mui/icons-material/Settings';
import ShareIcon from '@mui/icons-material/Share';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';

// Mock API service for demonstration
const apiService = {
  fetchDevices: async () => {
    return new Promise(resolve => setTimeout(() => resolve([
      { id: '1', name: 'Living Room Light', type: 'light', status: 'on', value: 80, metadata: { brightness: 80 } },
      { id: '2', name: 'Smart Thermostat', type: 'thermostat', status: 'on', value: 22, metadata: { unit: 'C' } },
      { id: '3', name: 'Front Door Lock', type: 'lock', status: 'locked', value: 'locked', metadata: { battery: 'high' } },
      { id: '4', name: 'Smart Speaker', type: 'speaker', status: 'off', value: 0, metadata: { volume: 0 } },
    ]), 500));
  },
  updateDevice: async (id: string, updates: any) => {
    console.log(`Updating device ${id} with`, updates);
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 300));
  },
  fetchInsights: async () => {
    return new Promise(resolve => setTimeout(() => resolve({
      energyConsumption: { labels: ['Jan', 'Feb', 'Mar'], data: [300, 320, 310] },
      deviceUsage: { labels: ['Light', 'Thermostat', 'Lock'], data: [120, 90, 50] },
    }), 700));
  },
  fetchAutomationRules: async () => {
    return new Promise(resolve => setTimeout(() => resolve([
      { id: 'auto1', name: 'Morning Routine', status: 'active', trigger: '6:00 AM', action: 'Turn on lights, set temp to 22C' },
      { id: 'auto2', name: 'Night Mode', status: 'inactive', trigger: '10:00 PM', action: 'Lock doors, turn off lights' },
    ]), 600));
  },
  fetchSharingSettings: async () => {
    return new Promise(resolve => setTimeout(() => resolve({
      sharedUsers: [
        { id: 'user1', name: 'Alice', accessLevel: 'full' },
        { id: 'user2', name: 'Bob', accessLevel: 'limited' },
      ],
      invitations: [
        { id: 'inv1', email: 'charlie@example.com', status: 'pending' },
      ]
    }), 400));
  }
};

// Theme configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

// Context for global state management
interface AppContextType {
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  insights: any;
  automationRules: any[];
  sharingSettings: any;
  loading: boolean;
  error: string | null;
  fetchAppData: () => void;
  updateDeviceStatus: (id: string, status: 'on' | 'off' | 'locked' | 'unlocked') => Promise<void>;
  updateDeviceValue: (id: string, value: number | string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [insights, setInsights] = useState<any>({});
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [sharingSettings, setSharingSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [devicesData, insightsData, automationData, sharingData] = await Promise.all([
        apiService.fetchDevices(),
        apiService.fetchInsights(),
        apiService.fetchAutomationRules(),
        apiService.fetchSharingSettings(),
      ]);
      setDevices(devicesData as Device[]);
      setInsights(insightsData);
      setAutomationRules(automationData);
      setSharingSettings(sharingData);
    } catch (err) {
      setError('Failed to fetch application data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const updateDeviceStatus = async (id: string, status: 'on' | 'off' | 'locked' | 'unlocked') => {
    try {
      await apiService.updateDevice(id, { status });
      setDevices(prevDevices =>
        prevDevices.map(device =>
          device.id === id ? { ...device, status } : device
        )
      );
    } catch (err) {
      setError(`Failed to update device status for ${id}.`);
      console.error(err);
    }
  };

  const updateDeviceValue = async (id: string, value: number | string) => {
    try {
      await apiService.updateDevice(id, { value });
      setDevices(prevDevices =>
        prevDevices.map(device =>
          device.id === id ? { ...device, value } : device
        )
      );
    } catch (err) {
      setError(`Failed to update device value for ${id}.`);
      console.error(err);
    }
  };

  return (
    <AppContext.Provider value={{
      devices, setDevices, insights, automationRules, sharingSettings,
      loading, error, fetchAppData, updateDeviceStatus, updateDeviceValue
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Basic Device Interface
interface Device {
  id: string;
  name: string;
  type: string;
  status: 'on' | 'off' | 'locked' | 'unlocked' | 'unknown';
  value: number | string;
  metadata?: any;
}

// Main Layout Component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setOpenDrawer(!openDrawer);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpenDrawer(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            JASON Smart Home
          </Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/devices">Devices</Button>
          <Button color="inherit" component={Link} to="/automations">Automations</Button>
          <Button color="inherit" component={Link} to="/sharing">Sharing</Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={openDrawer}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> {/* Keep app bar space */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button onClick={() => handleNavigation('/')}>
              <HomeIcon sx={{ mr: 2 }} />
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button onClick={() => handleNavigation('/devices')}>
              <DevicesIcon sx={{ mr: 2 }} />
              <ListItemText primary="Devices" />
            </ListItem>
            <ListItem button onClick={() => handleNavigation('/automations')}>
              <SettingsIcon sx={{ mr: 2 }} />
              <ListItemText primary="Automations" />
            </ListItem>
            <ListItem button onClick={() => handleNavigation('/sharing')}>
              <ShareIcon sx={{ mr: 2 }} />
              <ListItemText primary="Sharing" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
};

// Dashboard Page
const DashboardPage: React.FC = () => {
  const { devices, insights, loading, error, fetchAppData } = useAppContext();

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>Smart Home Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>Device Overview</Typography>
            <Grid container spacing={2}>
              {devices.map(device => (
                <Grid item xs={12} sm={6} md={4} key={device.id}>
                  <DeviceCard device={device} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>Insights</Typography>
            <Typography variant="h6">Energy Consumption</Typography>
            <p>{insights.energyConsumption?.data.reduce((a: number, b: number) => a + b, 0)} kWh (last 3 months)</p>
            <Typography variant="h6">Device Usage</Typography>
            <ul>
              {insights.deviceUsage?.labels.map((label: string, index: number) => (
                <li key={label}>{label}: {insights.deviceUsage.data[index]} hours</li>
              ))}
            </ul>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Devices Page
const DevicesPage: React.FC = () => {
  const { devices, loading, error } = useAppContext();

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>All Devices</Typography>
      <Grid container spacing={3}>
        {devices.map(device => (
          <Grid item xs={12} sm={6} key={device.id}>
            <DeviceCard device={device} showControls={true} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

// Automations Page
const AutomationsPage: React.FC = () => {
  const { automationRules, loading, error } = useAppContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRule, setCurrentRule] = useState<any>(null);

  const handleOpenDialog = (rule: any = null) => {
    setCurrentRule(rule);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRule(null);
  };

  const handleSaveRule = (rule: any) => {
    console.log('Saving rule:', rule);
    handleCloseDialog();
    // In a real app, you'd send this to the API and update state
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Automations</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
        Add New Rule
      </Button>
      <List sx={{ mt: 3 }}>
        {automationRules.map(rule => (
          <Card key={rule.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">{rule.name}</Typography>
              <Typography variant="body2" color="text.secondary">Trigger: {rule.trigger}</Typography>
              <Typography variant="body2" color="text.secondary">Action: {rule.action}</Typography>
              <Typography variant="body2" color="text.secondary">Status: {rule.status}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => handleOpenDialog(rule)}>Edit</Button>
              <Button size="small" color="error">Delete</Button>
            </CardActions>
          </Card>
        ))}
      </List>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentRule ? 'Edit Automation Rule' : 'Add New Automation Rule'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rule Name"
            type="text"
            fullWidth
            variant="standard"
            defaultValue={currentRule?.name || ''}
            id="rule-name"
          />
          <TextField
            margin="dense"
            label="Trigger"
            type="text"
            fullWidth
            variant="standard"
            defaultValue={currentRule?.trigger || ''}
            id="rule-trigger"
          />
          <TextField
            margin="dense"
            label="Action"
            type="text"
            fullWidth
            variant="standard"
            defaultValue={currentRule?.action || ''}
            id="rule-action"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="rule-status"
              defaultValue={currentRule?.status || 'active'}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={() => handleSaveRule(currentRule)}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Sharing Page (AdvancedSharingSystem)
const SharingPage: React.FC = () => {
  const { sharingSettings, loading, error } = useAppContext();

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Advanced Sharing System</Typography>
      <AdvancedSharingSystem devices={[]} /> {/* Devices prop is not used in the current AdvancedSharingSystem, but kept for type compatibility */}
    </Container>
  );
};

// DeviceCard Component (simplified for App.tsx)
interface DeviceCardProps {
  device: Device;
  showControls?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, showControls = false }) => {
  const { updateDeviceStatus, updateDeviceValue } = useAppContext();
  const [localValue, setLocalValue] = useState(device.value);

  useEffect(() => {
    setLocalValue(device.value);
  }, [device.value]);

  const handleToggleStatus = () => {
    const newStatus = device.status === 'on' ? 'off' : 'on';
    updateDeviceStatus(device.id, newStatus);
  };

  const handleLockToggle = () => {
    const newStatus = device.status === 'locked' ? 'unlocked' : 'locked';
    updateDeviceStatus(device.id, newStatus);
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setLocalValue(newValue);
  };

  const handleValueBlur = () => {
    updateDeviceValue(device.id, localValue);
  };

  return (
    <Card variant="outlined" sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {device.name}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          {device.type}
        </Typography>
        <Typography variant="body2">
          Status: {device.status}
        </Typography>
        {device.type !== 'lock' && (
          <Typography variant="body2">
            Value: {device.value} {device.metadata?.unit}
          </Typography>
        )}
      </CardContent>
      {showControls && (
        <CardActions>
          {device.type === 'light' && (
            <Button size="small" onClick={handleToggleStatus}>
              {device.status === 'on' ? 'Turn Off' : 'Turn On'}
            </Button>
          )}
          {device.type === 'thermostat' && (
            <TextField
              label="Temperature"
              type="number"
              value={localValue}
              onChange={handleValueChange}
              onBlur={handleValueBlur}
              size="small"
              sx={{ width: 120 }}
            />
          )}
          {device.type === 'lock' && (
            <Button size="small" onClick={handleLockToggle}>
              {device.status === 'locked' ? 'Unlock' : 'Lock'}
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

// AdvancedSharingSystem Component (placeholder for now, will be replaced by actual content)
interface AdvancedSharingSystemProps {
  devices: Device[]; // This prop is currently unused in the provided content, but kept for type compatibility
}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = ({ devices }) => {
  const { sharingSettings, fetchAppData } = useAppContext();
  const [inviteEmail, setInviteEmail] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleInviteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInviteEmail(event.target.value);
  };

  const sendInvitation = async () => {
    if (!inviteEmail) {
      setSnackbarMessage('Please enter an email address.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    // Mock API call for sending invitation
    console.log(`Sending invitation to ${inviteEmail}`);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setSnackbarMessage(`Invitation sent to ${inviteEmail}!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setInviteEmail('');
      fetchAppData(); // Refresh sharing settings
    } catch (error) {
      setSnackbarMessage('Failed to send invitation.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Manage Shared Access</Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Current Shared Users</Typography>
        <List>
          {sharingSettings.sharedUsers?.map((user: any) => (
            <ListItem key={user.id}>
              <ListItemText primary={user.name} secondary={`Access Level: ${user.accessLevel}`} />
              <Button size="small" color="error">Remove</Button>
            </ListItem>
          ))}
          {sharingSettings.sharedUsers?.length === 0 && (
            <Typography variant="body2" color="text.secondary">No users currently sharing access.</Typography>
          )}
        </List>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Pending Invitations</Typography>
        <List>
          {sharingSettings.invitations?.map((invite: any) => (
            <ListItem key={invite.id}>
              <ListItemText primary={invite.email} secondary={`Status: ${invite.status}`} />
              <Button size="small">Resend</Button>
              <Button size="small" color="error">Cancel</Button>
            </ListItem>
          ))}
          {sharingSettings.invitations?.length === 0 && (
            <Typography variant="body2" color="text.secondary">No pending invitations.</Typography>
          )}
        </List>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>Invite New User</Typography>
        <TextField
          label="Email Address"
          type="email"
          fullWidth
          value={inviteEmail}
          onChange={handleInviteChange}
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={sendInvitation} sx={{ mt: 2 }}>
          Send Invitation
        </Button>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};


// Main App Component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <AppProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/automations" element={<AutomationsPage />} />
              <Route path="/sharing" element={<SharingPage />} />
              {/* Add more routes as needed */}
            </Routes>
          </MainLayout>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
