import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import catalystFile from './data/catalyst_data.csv'; // Legacy Data
import { processData } from './utils/dataProcessing'; // New Data Logic
import {
  Box, Container, Typography, Paper, Grid, TextField, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails, Chip, Divider, LinearProgress,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import CancelIcon from '@mui/icons-material/Cancel';

// --- MAPPING CONFIGURATION ---
const COMPARISON_MAP = {
  cognitive: {
    label: "Cognitive Skills",
    cat1_col: "Cognitive Skills", 
    cat2_key: "cognitive",        
    behaviors: [
      { label: "Problem Solving", cat1: "Problem Solving Skills", cat2: "c_problem_solving" },
      { label: "Asking Questions", cat1: "Asking The Right Questions", cat2: "c_asking_questions" },
      { label: "Listening Skills", cat1: "Listening Skills & Learning Mindset", cat2: "c_listening" },
      { label: "Decision Making", cat1: "Decision Making Skills", cat2: "c_decision_making" },
      { label: "Strategic Sales", cat1: "Strategic Sales & Marketing Approach", cat2: "c_strategic_sales" },
      { label: "Social Media", cat1: "Social Media Skills", cat2: "c_social_media" }
    ]
  },
  selfLeadership: {
    label: "Self-Leadership",
    cat1_col: "Self Leadership",
    cat2_key: "selfLeadership",
    behaviors: [
      { label: "Leadership & Conflict", cat1: "Leadership & Conflict Management", cat2: "sl_leadership" },
      { label: "Resilience", cat1: "Resilience", cat2: "sl_resilience" },
      { label: "Time Management", cat1: "Personal Effectiveness & Time Management", cat2: "sl_time_mgmt" }
    ]
  },
  interpersonal: {
    label: "Interpersonal Skills",
    cat1_col: "Interpersonal",
    cat2_key: "interpersonal",
    behaviors: [
      { label: "Communication", cat1: "Communication Skills", cat2: "i_communication" },
      { label: "Positive Environment", cat1: "Builidng Positive Environment", cat2: "i_positive_env" },
      { label: "Org Skills", cat1: "Organizational Skills and Team Management", cat2: "i_org_skills" }
    ]
  }
};

// --- HELPER: Normalize CNIC ---
const normalizeCNIC = (cnic) => {
  if (!cnic) return "";
  return String(cnic).replace(/[^a-zA-Z0-9]/g, '').trim();
};

export default function ParticipantHistoryComparison() {
  const [matchedData, setMatchedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('default'); 

  useEffect(() => {
    const loadData = async () => {
      // 1. Load Legacy Data
      const parseLegacy = new Promise((resolve) => {
        Papa.parse(catalystFile, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data)
        });
      });

      // 2. Load New Data
      const parseNew = new Promise((resolve) => {
        processData((data) => resolve(data));
      });

      const [legacyData, newData] = await Promise.all([parseLegacy, parseNew]);

      // 3. Match Participants
      const matches = [];
      const legacyMap = new Map();
      legacyData.forEach(row => {
        const cnicRaw = row["Participant's CNIC number"];
        if (cnicRaw) {
          legacyMap.set(normalizeCNIC(cnicRaw), row);
        }
      });

      // Specific CNIC to force absent in OLD Catalyst
      const forcedOldAbsentCNIC = normalizeCNIC("42301-1054038-5");

      newData.forEach(newP => {
        const cnic = normalizeCNIC(newP['CNIC'] || newP['cnic']);
        const isAbsentNew = newP['Attendance'] !== 'Present';
        
        const oldP = legacyMap.get(cnic);

        if (oldP) {
          // Check if this is the specific user who was absent in the OLD training
          const isOldAbsent = (cnic === forcedOldAbsentCNIC);

          let oldOverall = 0;
          if (!isOldAbsent) {
            oldOverall = parseFloat(oldP["Total Avg %age"]) * 100;
            if (isNaN(oldOverall)) oldOverall = 0;
          }

          const matchObj = {
            name: newP['Name'],
            cnic: newP['CNIC'] || newP['cnic'],
            dealership: newP['Dealership Name'],
            region: newP['Region'],
            attendance: newP['Attendance'],
            isOldAbsent: isOldAbsent, // Flag to track old absence
            overall: { 
                old: oldOverall, 
                new: isAbsentNew ? 0 : newP.calculated.overall 
            },
            clusters: {}
          };

          Object.keys(COMPARISON_MAP).forEach(key => {
            const config = COMPARISON_MAP[key];
            
            let oldClusterPct = 0;
            if (!isOldAbsent) {
                let oldClusterRaw = parseFloat(oldP[config.cat1_col]);
                oldClusterPct = (oldClusterRaw / 6) * 100;
                if (isNaN(oldClusterPct)) oldClusterPct = 0;
            }

            matchObj.clusters[key] = {
              label: config.label,
              old: oldClusterPct,
              new: isAbsentNew ? 0 : newP.calculated[config.cat2_key],
              behaviors: []
            };

            config.behaviors.forEach(beh => {
              let oldBehPct = 0;
              if (!isOldAbsent) {
                  let oldBehRaw = parseFloat(oldP[beh.cat1]);
                  oldBehPct = (oldBehRaw / 6) * 100;
                  if (isNaN(oldBehPct)) oldBehPct = 0;
              }

              matchObj.clusters[key].behaviors.push({
                label: beh.label,
                old: oldBehPct,
                new: isAbsentNew ? 0 : newP.scores[beh.cat2]
              });
            });
          });

          matches.push(matchObj);
        }
      });

      setMatchedData(matches);
      setLoading(false);
    };

    loadData();
  }, []);

  // --- RENDER HELPERS ---

  const DeltaIndicator = ({ oldVal, newVal, size = "small" }) => {
    const diff = newVal - oldVal;
    const isSame = Math.abs(diff) < 0.005;
    const isUp = diff > 0;

    if (isSame) {
      return <Chip icon={<RemoveIcon />} label="Same" size={size} variant="outlined" sx={{ borderColor: '#ccc', color: '#666', fontWeight: 'bold' }} />;
    }
    
    return (
      <Chip 
        icon={isUp ? <TrendingUpIcon /> : <TrendingDownIcon />} 
        label={`${Math.abs(diff).toFixed(2)}%`} 
        size={size} 
        color={isUp ? "success" : "error"} 
        variant={isUp ? "filled" : "outlined"}
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const ScoreBar = ({ val, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      <LinearProgress 
        variant="determinate" 
        value={val} 
        sx={{ 
          flexGrow: 1, 
          height: 8, 
          borderRadius: 4, 
          bgcolor: '#eee', 
          '& .MuiLinearProgress-bar': { bgcolor: color } 
        }} 
      />
      <Typography variant="caption" sx={{ minWidth: 45, fontWeight: 'bold', textAlign: 'right' }}>
        {val.toFixed(2)}%
      </Typography>
    </Box>
  );

  // --- FILTERING & SORTING LOGIC ---
  const processedList = matchedData
    .map(p => ({
        ...p,
        delta: p.overall.new - p.overall.old
    }))
    .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.cnic.includes(searchTerm)
    )
    .filter(p => {
        if (filterType === 'increased') return p.delta > 0;
        if (filterType === 'decreased') return p.delta < 0;
        return true; // 'default' shows all
    })
    .sort((a, b) => {
        if (filterType === 'decreased') {
            return a.delta - b.delta;
        }
        return b.delta - a.delta;
    });

  if (loading) return <Container><Typography sx={{ mt: 4 }}>Loading Comparison Data...</Typography></Container>;

  return (
    <Container maxWidth="xl" sx={{ pb: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6' }}>
          Participant History Comparison
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Comparing performance between Catalyst 1.0 and Catalyst 2.0 ({matchedData.length} participants matched)
        </Typography>
      </Box>

      {/* Search Bar & Filter Dropdown */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by Name or CNIC..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                    }}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                    <InputLabel id="sort-filter-label">Filter</InputLabel>
                    <Select
                        labelId="sort-filter-label"
                        value={filterType}
                        label="Filter"
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <MenuItem value="default">All</MenuItem>
                        <MenuItem value="increased">Increased</MenuItem>
                        <MenuItem value="decreased">Decreased</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
      </Paper>

      {/* List */}
      {processedList.map((p, index) => {
        const isAbsentNew = p.attendance !== 'Present';

        return (
          <Accordion 
            key={index} 
            disabled={isAbsentNew} 
            sx={{ 
              mb: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2, 
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
              '&:before': { display: 'none' },
              bgcolor: '#fff' 
            }}
          >
            <AccordionSummary expandIcon={!isAbsentNew && <ExpandMoreIcon />} sx={{ bgcolor: '#fff', borderRadius: 2 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.2 }}>{p.name}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                    {p.cnic} <span style={{ margin: '0 5px' }}>|</span> {p.dealership}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Catalyst</Typography>
                    {/* CHECK IF ABSENT IN OLD */}
                    {p.isOldAbsent ? (
                        <Chip 
                            icon={<CancelIcon />} 
                            label="Absent" 
                            color="error" 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 'bold', mt: 0.5 }} 
                        />
                    ) : (
                        <Typography variant="h5" sx={{ color: '#757575', fontWeight: '500' }}>{p.overall.old.toFixed(2)}%</Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Catalyst 2.0</Typography>
                    {isAbsentNew ? (
                        <Chip 
                            icon={<CancelIcon />} 
                            label="Absent" 
                            color="error" 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 'bold', mt: 0.5 }} 
                        />
                    ) : (
                        <Typography variant="h5" sx={{ color: '#0039a6', fontWeight: 'bold' }}>{p.overall.new.toFixed(2)}%</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                  {/* Hide Delta if either side is absent */}
                  {!isAbsentNew && !p.isOldAbsent && (
                    <DeltaIndicator oldVal={p.overall.old} newVal={p.overall.new} size="medium" />
                  )}
                </Grid>
              </Grid>
            </AccordionSummary>
            
            {/* Only render details if present in New */}
            {!isAbsentNew && (
              <AccordionDetails sx={{ bgcolor: '#fafafa', borderTop: '1px solid #eee', p: 3 }}>
                <Grid container spacing={4}>
                  {Object.keys(p.clusters).map(clusterKey => {
                    const cluster = p.clusters[clusterKey];
                    const color = clusterKey === 'cognitive' ? '#0039a6' : clusterKey === 'selfLeadership' ? '#e31e24' : '#4caf50';
                    
                    return (
                      <Grid item xs={12} md={4} key={clusterKey}>
                        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${color}40`, height: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `2px solid ${color}`, pb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: color }}>{cluster.label}</Typography>
                            {!p.isOldAbsent && <DeltaIndicator oldVal={cluster.old} newVal={cluster.new} />}
                          </Box>

                          {/* Cluster Overall Comparison */}
                          <Grid container spacing={1} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">Catalyst</Typography>
                              {p.isOldAbsent ? (
                                <Typography variant="caption" sx={{ display:'block', color: 'red', fontWeight:'bold' }}>Absent</Typography>
                              ) : (
                                <ScoreBar val={cluster.old} color="#999" />
                              )}
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">Catalyst 2.0</Typography>
                              <ScoreBar val={cluster.new} color={color} />
                            </Grid>
                          </Grid>

                          <Divider sx={{ my: 2 }} />

                          {/* Behaviors Breakdown */}
                          {cluster.behaviors.map((beh, bIdx) => {
                            const diff = beh.new - beh.old;
                            const isUp = diff > 0;
                            const isSame = Math.abs(diff) < 0.005;

                            return (
                              <Box key={bIdx} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{beh.label}</Typography>
                                  {!p.isOldAbsent && (
                                    <Typography variant="caption" sx={{ 
                                        color: isSame ? '#999' : isUp ? 'green' : 'red' 
                                    }}>
                                        {isSame ? 'Same' : `${isUp ? '+' : ''}${diff.toFixed(2)}%`}
                                    </Typography>
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, height: 6 }}>
                                  <Box sx={{ width: `${beh.old}%`, bgcolor: '#ccc', borderRadius: 1 }} />
                                  <Box sx={{ width: `${beh.new}%`, bgcolor: color, borderRadius: 1 }} />
                                </Box>
                              </Box>
                            );
                          })}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </AccordionDetails>
            )}
          </Accordion>
        );
      })}
      
      {processedList.length === 0 && (
        <Typography align="center" color="textSecondary" sx={{ mt: 4 }}>No matching participants found.</Typography>
      )}
    </Container>
  );
}