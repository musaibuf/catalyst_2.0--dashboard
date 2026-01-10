import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom'; 
import Papa from 'papaparse';
import participantFile from './data/participants.csv'; 
import AssessorForm from './AssessorForm'; 
import CompetencyComparison from './CompetencyComparison';
import DemographicsComparison from './DemographicsComparison';
import ParticipantRankings from './ParticipantRankings';
import DealershipRankings from './DealershipRankings';
import ParticipantBreakdown from './ParticipantBreakdown';
import OverallScores from './OverallScores';

import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ThemeProvider,
  createTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip
} from '@mui/material';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StoreIcon from '@mui/icons-material/Store';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PieChartIcon from '@mui/icons-material/PieChart';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// --- THEME CONFIGURATION ---
const dashboardTheme = createTheme({
  palette: {
    primary: { main: '#0039a6' }, // Pak Suzuki Blue
    secondary: { main: '#e31e24' }, // Pak Suzuki Red
    background: { default: '#f4f6f8' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, color: '#0039a6' },
    tagline: {
      fontFamily: '"Playfair Display", "Times New Roman", serif',
      fontWeight: 600,
      color: '#B31B1B',
      lineHeight: 1.2,
      fontSize: '0.9rem',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

const drawerWidth = 280;
const appBarHeight = 90; 

// --- SIDEBAR MENU ITEMS (UPDATED ORDER) ---
const menuItems = [
  { id: 1, text: 'Participants Overview', icon: <PeopleIcon />, sub: 'Catalyst 2.0' },
  { id: 2, text: 'Demographics', icon: <PieChartIcon />, sub: 'Catalyst 2.0' }, // Moved Up & Renamed
  { id: 3, text: 'Participant Rankings', icon: <EmojiEventsIcon />, sub: '' },
  { id: 4, text: 'Dealership Rankings', icon: <StoreIcon />, sub: '' },
  { id: 5, text: 'Overall Scores', icon: <AssessmentIcon />, sub: 'Competency & Big 5' }, // Updated Sub
  { id: 6, text: 'Participant Breakdown', icon: <PersonSearchIcon />, sub: 'Individual' },
  { id: 7, text: 'Competency Comparison', icon: <CompareArrowsIcon />, sub: 'Cat vs Cat 2.0' },
  // Removed Participant Trends
];

// --- DASHBOARD COMPONENT ---
function Dashboard() {
  const [activePage, setActivePage] = useState(1);
  const [participantsList, setParticipantsList] = useState([]);

  // --- FILTER STATES ---
  const [filters, setFilters] = useState({
    region: '',
    dealership: '',
    degree: '',
    experience: ''
  });

  // --- LOAD CSV DATA ---
  useEffect(() => {
    Papa.parse(participantFile, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParticipantsList(results.data);
      },
      error: (err) => console.error("Error reading CSV:", err)
    });
  }, []);

  // --- FILTER LOGIC ---
  const uniqueRegions = useMemo(() => [...new Set(participantsList.map(p => p.region))].filter(Boolean).sort(), [participantsList]);
  const uniqueDealerships = useMemo(() => [...new Set(participantsList.map(p => p.dealership))].filter(Boolean).sort(), [participantsList]);
  const uniqueDegrees = useMemo(() => [...new Set(participantsList.map(p => p.degree))].filter(Boolean).sort(), [participantsList]);
  const uniqueExperience = useMemo(() => [...new Set(participantsList.map(p => p['Years of Experience at Pak Suzuki']))]
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b)), [participantsList]);

  const filteredParticipants = useMemo(() => {
    return participantsList.filter(item => {
      if (filters.region && item.region !== filters.region) return false;
      if (filters.dealership && item.dealership !== filters.dealership) return false;
      if (filters.degree && item.degree !== filters.degree) return false;
      if (filters.experience && item['Years of Experience at Pak Suzuki'] !== filters.experience) return false;
      return true;
    });
  }, [participantsList, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ region: '', dealership: '', degree: '', experience: '' });
  };

  // --- DYNAMIC CONTENT RENDERER ---
  const renderContent = () => {
    switch (activePage) {
      case 1:
        const totalCount = filteredParticipants.length;
        const dealershipCount = [...new Set(filteredParticipants.map(p => p.dealership))].length;
        const regionCount = [...new Set(filteredParticipants.map(p => p.region))].length;

        // --- NEW FILTER STRIP COMPONENT ---
        const ParticipantsFilters = () => (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: '#eef2f6', 
              border: '1px solid #e0e0e0',
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap', 
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#666', mr: 1, fontWeight: 'bold' }}>
              FILTERS:
            </Typography>

            <FormControl sx={{ minWidth: 220, bgcolor: 'white' }} size="small">
              <InputLabel>Region</InputLabel>
              <Select value={filters.region} label="Region" onChange={(e) => handleFilterChange('region', e.target.value)}>
                <MenuItem value=""><em>All Regions</em></MenuItem>
                {uniqueRegions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 280, bgcolor: 'white' }} size="small">
              <InputLabel>Dealership Location</InputLabel>
              <Select value={filters.dealership} label="Dealership Location" onChange={(e) => handleFilterChange('dealership', e.target.value)}>
                <MenuItem value=""><em>All Dealerships</em></MenuItem>
                {uniqueDealerships.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200, bgcolor: 'white' }} size="small">
              <InputLabel>Degree</InputLabel>
              <Select value={filters.degree} label="Degree" onChange={(e) => handleFilterChange('degree', e.target.value)}>
                <MenuItem value=""><em>All Degrees</em></MenuItem>
                {uniqueDegrees.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180, bgcolor: 'white' }} size="small">
              <InputLabel>Experience (Yrs)</InputLabel>
              <Select value={filters.experience} label="Experience (Yrs)" onChange={(e) => handleFilterChange('experience', e.target.value)}>
                <MenuItem value=""><em>All Experience</em></MenuItem>
                {uniqueExperience.map(e => <MenuItem key={e} value={e}>{e} Years</MenuItem>)}
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />

            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<RestartAltIcon />} 
              onClick={resetFilters}
              sx={{ height: 40, px: 3, fontWeight: 'bold' }}
            >
              Reset Filters
            </Button>
          </Paper>
        );

        return (
          <PageLayout title="Participants Overview (Catalyst 2.0)">
            <ParticipantsFilters />
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <PlaceholderCard title="Total Participants" value={totalCount} color="#0039a6" />
              <PlaceholderCard title="Dealerships" value={dealershipCount} color="#e31e24" />
              <PlaceholderCard title="Active Regions" value={regionCount} color="#2e7d32" />
            </Box>
            <Paper sx={{ mt: 2, width: '100%', overflow: 'hidden', boxShadow: 2, border: '1px solid #eee' }}>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader aria-label="participants table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>CNIC</TableCell>
                      <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Region</TableCell>
                      <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Dealership</TableCell>
                      <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Age</TableCell>
                      <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Gender</TableCell>
                      <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Degree</TableCell>
                      <TableCell sx={{ bgcolor: '#0039a6', color: 'white', fontWeight: 'bold' }}>Exp (Yrs)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredParticipants.length > 0 ? (
                      filteredParticipants.map((row, index) => (
                        <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                          <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                          <TableCell>{row.cnic}</TableCell>
                          <TableCell>
                            <Box sx={{ bgcolor: row.region === 'Karachi' ? '#e3f2fd' : '#fce4ec', color: '#333', p: 0.5, borderRadius: 1, textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              {row.region}
                            </Box>
                          </TableCell>
                          <TableCell>{row.dealership}</TableCell>
                          <TableCell>{row.age}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{row.gender}</TableCell>
                          <TableCell>{row.degree}</TableCell>
                          <TableCell>{row['Years of Experience at Pak Suzuki']}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><Typography color="textSecondary">No participants match these filters.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #eee' }}>
                <Typography variant="caption" color="textSecondary">Showing {filteredParticipants.length} of {participantsList.length} records</Typography>
              </Box>
            </Paper>
          </PageLayout>
        );

      case 2: return <DemographicsComparison />; // Moved Here
      case 3: return <ParticipantRankings />;
case 4: return <DealershipRankings />;
case 5: return <OverallScores />;
case 6: return <ParticipantBreakdown />;
      case 7: return <CompetencyComparison />;
      default: return <Typography>Select a page</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'white', color: '#333', borderBottom: '3px solid #e31e24', boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1)', height: appBarHeight }}>
        <Toolbar sx={{ height: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src="/pak-suzuki-logo.png" alt="Pak Suzuki" style={{ height: '50px', marginRight: '15px' }} />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0039a6', lineHeight: 1.1 }}>PAK SUZUKI</Typography>
              <Typography variant="caption" sx={{ color: '#e31e24', fontWeight: 'bold', letterSpacing: 1 }}>DASHBOARD</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', mr: 2 }}>
              <Typography variant="body1" sx={dashboardTheme.typography.tagline}>Convey Meaning.</Typography>
              <Typography variant="body1" sx={dashboardTheme.typography.tagline}>Create Significance.</Typography>
            </Box>
            <Box sx={{ height: '45px', width: '1px', bgcolor: '#ccc', mr: 2 }} />
            <img src="/logo.png" alt="Carnelian" style={{ height: '60px' }} />
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#0039a6', color: 'white', mt: `${appBarHeight}px` } }}>
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton selected={activePage === item.id} onClick={() => setActivePage(item.id)} sx={{ '&.Mui-selected': { bgcolor: '#e31e24', '&:hover': { bgcolor: '#c2191e' } }, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, mb: 0.5, mx: 1, borderRadius: 1 }}>
                  <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} secondary={item.sub} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} secondaryTypographyProps={{ fontSize: '0.7rem', color: '#cfcfcf' }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 2 }} />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f4f6f8', minHeight: '100vh', mt: `${appBarHeight}px` }}>
        {renderContent()}
      </Box>
    </Box>
  );
}

// --- HELPER COMPONENTS ---
const PageLayout = ({ title, children }) => (
  <Container maxWidth="xl">
    <Box sx={{ mb: 3 }}><Typography variant="h4" gutterBottom sx={{ mb: 0 }}>{title}</Typography></Box>
    <Box>{children}</Box>
  </Container>
);

const PlaceholderCard = ({ title, value, color }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 3, borderLeft: `6px solid ${color}`, display: 'inline-block', minWidth: 200, mr: 3 }}>
    <Typography variant="subtitle2" color="textSecondary">{title}</Typography>
    <Typography variant="h4" sx={{ fontWeight: 'bold', color: color }}>{value}</Typography>
  </Paper>
);

// ==========================================
// 2. MAIN APP WRAPPER (ROUTING ONLY)
// ==========================================
function App() {
  return (
    <ThemeProvider theme={dashboardTheme}>
      <Routes>
        {/* Route 1: The Main Dashboard */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Route 2: The Assessor Form (NO SIDEBAR) */}
        <Route path="/assessor" element={<AssessorForm />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;