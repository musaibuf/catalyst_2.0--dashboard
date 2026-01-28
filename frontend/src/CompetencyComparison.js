import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import catalystFile from './data/catalyst_data.csv';
import participantFile from './data/participants.csv';
import { processData } from './utils/dataProcessing'; 
import {
  Box, Container, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel, LinearProgress
} from '@mui/material';

// --- CONFIGURATION ---
const CATEGORIES = {
  cognitive: {
    id: "cognitive",
    title: "Cognitive Skills",
    color: "#311b92", 
    velocityColor: "#e91e63", 
    csvColumn: "Cognitive Skills", 
    metrics: [
      { label: "Problem Solving", catKey: "Problem Solving Skills", velKey: "c_problem_solving", color: "#d81b60" },
      { label: "Asking the Right Questions", catKey: "Asking The Right Questions", velKey: "c_asking_questions", color: "#673ab7" },
      { label: "Listening Skills", catKey: "Listening Skills & Learning Mindset", velKey: "c_listening", color: "#d32f2f" },
      { label: "Decision-Making Skills", catKey: "Decision Making Skills", velKey: "c_decision_making", color: "#fbc02d" },
      { label: "Strategic Sales & Marketing Approach", catKey: "Strategic Sales & Marketing Approach", velKey: "c_strategic_sales", color: "#00796b" },
      { label: "Social Media", catKey: "Social Media Skills", velKey: "c_social_media", color: "#006064" },
    ]
  },
  selfLeadership: {
    id: "selfLeadership",
    title: "Self-Leadership Skills",
    color: "#311b92",
    velocityColor: "#4caf50", 
    csvColumn: "Self Leadership", 
    metrics: [
      { label: "Leadership & Conflict Management", catKey: "Leadership & Conflict Management", velKey: "sl_leadership", color: "#e91e63" },
      { label: "Resilience", catKey: "Resilience", velKey: "sl_resilience", color: "#4a148c" },
      { label: "Personal Effectiveness & Time Management", catKey: "Personal Effectiveness & Time Management", velKey: "sl_time_mgmt", color: "#2196f3" },
    ]
  },
  interpersonal: {
    id: "interpersonal",
    title: "Interpersonal Skills",
    color: "#311b92",
    velocityColor: "#2196f3", 
    csvColumn: "Interpersonal", 
    metrics: [
      { label: "Communication Skills", catKey: "Communication Skills", velKey: "i_communication", color: "#1a237e" },
      { label: "Building a Positive Environment", catKey: "Builidng Positive Environment", velKey: "i_positive_env", color: "#e64a19" },
      { label: "Organization Skills & Team Management", catKey: "Organizational Skills and Team Management", velKey: "i_org_skills", color: "#f57c00" },
    ]
  }
};

export default function CompetencyComparison() {
  const [catalystData, setCatalystData] = useState([]);
  const [catalyst2Data, setCatalyst2Data] = useState([]); 
  const [cat2Participants, setCat2Participants] = useState([]); 
  
  const [catFilters, setCatFilters] = useState({ city: 'All', dealership: 'All' });
  const [cat2Filters, setCat2Filters] = useState({ city: 'All', dealership: 'All' });

  // --- 1. LOAD DATA ---
  useEffect(() => {
    Papa.parse(catalystFile, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => setCatalystData(results.data)
    });

    Papa.parse(participantFile, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => setCat2Participants(results.data)
    });

    const loadLiveScores = () => {
      processData((data) => {
        setCatalyst2Data(data);
      });
    };
    loadLiveScores();

    const interval = setInterval(loadLiveScores, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. EXTRACT FILTERS (FIXED KEYS) ---
  const catCities = useMemo(() => ['All', ...new Set(catalystData.map(d => d["Development center city"]).filter(Boolean))].sort(), [catalystData]);
  const catDealerships = useMemo(() => ['All', ...new Set(catalystData.map(d => d["Participant's dealership location"]).filter(Boolean))].sort(), [catalystData]);

  // FIXED: Used 'Region' and 'Dealership Name' to match CSV headers exactly
  const cat2Cities = useMemo(() => ['All', ...new Set(cat2Participants.map(d => d['Region']).filter(Boolean))].sort(), [cat2Participants]);
  const cat2Dealerships = useMemo(() => ['All', ...new Set(cat2Participants.map(d => d['Dealership Name']).filter(Boolean))].sort(), [cat2Participants]);

  // --- 3. CALCULATE AVERAGES ---
  const calculateStats = (data, source, currentFilters) => {
    const filtered = data.filter(row => {
      
      // --- ATTENDANCE CHECK (Catalyst 2.0 Only) ---
      if (source === 'catalyst2') {
        if (row['Attendance'] !== 'Present') return false;
      }

      let cityMatch = true;
      let dealerMatch = true;

      if (source === 'catalyst') {
        // Legacy Catalyst Logic
        cityMatch = currentFilters.city === 'All' || row["Development center city"] === currentFilters.city;
        dealerMatch = currentFilters.dealership === 'All' || row["Participant's dealership location"] === currentFilters.dealership;
      } else {
        // Catalyst 2.0 Logic (FIXED KEYS)
        // We must use the exact keys from the CSV: 'Region' and 'Dealership Name'
        const rowCity = row['Region']; 
        const rowDealer = row['Dealership Name'];

        cityMatch = currentFilters.city === 'All' || rowCity === currentFilters.city;
        dealerMatch = currentFilters.dealership === 'All' || rowDealer === currentFilters.dealership;
      }
      return cityMatch && dealerMatch;
    });

    if (filtered.length === 0) return null;

    const stats = {};

    // Helper: Calculate Average
    const getAvg = (key) => {
      let sum = 0;
      let count = 0;
      filtered.forEach(row => {
        let val;
        if (source === 'catalyst2') {
           val = row.scores?.[key];
        } else {
           val = parseFloat(row[key]);
        }
        
        if (val !== undefined && !isNaN(val) && val > 0) {
          sum += val;
          count++;
        }
      });

      if (count === 0) return 0;
      
      if (source === 'catalyst2') {
        return sum / count; 
      } else {
        return ((sum / count) / 6) * 100; 
      }
    };

    // Calculate Metrics
    Object.keys(CATEGORIES).forEach(catKey => {
      const catConfig = CATEGORIES[catKey];
      
      catConfig.metrics.forEach(metric => {
        const key = source === 'catalyst' ? metric.catKey : metric.velKey;
        stats[key] = getAvg(key);
      });

      // Calculate Category Overall
      if (source === 'catalyst') {
        stats[`${catKey}_overall`] = getAvg(catConfig.csvColumn);
      } else {
        let sum = 0, count = 0;
        filtered.forEach(row => {
          const val = row.calculated?.[catKey]; 
          if (val > 0) { sum += val; count++; }
        });
        stats[`${catKey}_overall`] = count > 0 ? sum / count : 0;
      }
    });

    // Calculate Grand Overall
    let grandSum = 0;
    let grandCount = 0;
    filtered.forEach(row => {
      let val;
      if (source === 'catalyst') {
        val = parseFloat(row["Total Avg %age"]) * 100; 
      } else {
        val = row.calculated?.overall;
      }
      
      if (val > 0) {
        grandSum += val;
        grandCount++;
      }
    });
    stats.grand_overall = grandCount > 0 ? grandSum / grandCount : 0;

    return stats;
  };

  const catalystStats = useMemo(() => calculateStats(catalystData, 'catalyst', catFilters), [catalystData, catFilters]);
  const catalyst2Stats = useMemo(() => calculateStats(catalyst2Data, 'catalyst2', cat2Filters), [catalyst2Data, cat2Filters]);

  // --- 4. RENDER HELPER ---
  const SingleBar = ({ label, value, color }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: '500', color: '#444' }}>{label}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: color }}>
          {value ? value.toFixed(2) : "0.00"}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={value || 0} 
        sx={{ 
          height: 12, 
          borderRadius: 5, 
          bgcolor: '#f0f0f0',
          '& .MuiLinearProgress-bar': { bgcolor: color } 
        }} 
      />
    </Box>
  );

  // Helper for Cluster Summary Cards
  const ClusterSummary = ({ stats, source }) => (
    <Grid container spacing={1} sx={{ mb: 4 }}>
      {Object.keys(CATEGORIES).map((catKey) => {
        const cat = CATEGORIES[catKey];
        const color = source === 'catalyst' ? cat.color : cat.velocityColor;
        const score = stats?.[`${catKey}_overall`] || 0;
        
        return (
          <Grid item xs={4} key={catKey}>
            <Box sx={{ 
              p: 1, 
              border: `1px solid ${color}`, 
              borderRadius: 1, 
              textAlign: 'center',
              bgcolor: `${color}10`
            }}>
              <Typography variant="caption" sx={{ color: color, fontWeight: 'bold', display: 'block', lineHeight: 1 }}>
                {catKey === 'cognitive' ? 'Cognitive' : catKey === 'selfLeadership' ? 'Self-Lead' : 'Interpersonal'}
              </Typography>
              <Typography variant="h6" sx={{ color: color, fontWeight: 'bold' }}>
                {score.toFixed(2)}%
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Container maxWidth={false} sx={{ pb: 5, px: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6' }}>
          Competency Comparison
        </Typography>
      </Box>

      <Grid container spacing={4}>
        
        {/* --- LEFT SIDE: CATALYST --- */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, borderTop: '6px solid #0039a6', height: '100%' }}>
            
            {/* Header & Filters */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#0039a6' }}>Catalyst</Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>City</InputLabel>
                  <Select value={catFilters.city} label="City" onChange={(e) => setCatFilters({...catFilters, city: e.target.value})}>
                    {catCities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Dealership</InputLabel>
                  <Select value={catFilters.dealership} label="Dealership" onChange={(e) => setCatFilters({...catFilters, dealership: e.target.value})}>
                    {catDealerships.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Overall Score Box */}
            <Box sx={{ bgcolor: '#0039a6', p: 3, borderRadius: 2, textAlign: 'center', mb: 3, mt: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                {catalystStats?.grand_overall ? catalystStats.grand_overall.toFixed(2) : "0.00"}%
              </Typography>
              <Typography variant="subtitle2" sx={{ opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1, color: 'white' }}>Overall Score</Typography>
            </Box>

            {/* Cluster Summary */}
            <ClusterSummary stats={catalystStats} source="catalyst" />

            {/* Categories */}
            {Object.values(CATEGORIES).map((cat, idx) => (
              <Box key={idx} sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: `2px solid ${cat.color}`, pb: 1 }}>
                  <Typography variant="h5" sx={{ color: cat.color, fontWeight: 'bold' }}>
                    {cat.title}
                  </Typography>
                  <Typography variant="h6" sx={{ color: cat.color, fontWeight: 'bold' }}>
                    {catalystStats?.[`${Object.keys(CATEGORIES)[idx]}_overall`] ? catalystStats[`${Object.keys(CATEGORIES)[idx]}_overall`].toFixed(2) : "0.00"}%
                  </Typography>
                </Box>
                
                {cat.metrics.map((metric, mIdx) => (
                  <SingleBar 
                    key={mIdx}
                    label={metric.label}
                    value={catalystStats?.[metric.catKey]}
                    color={metric.color}
                  />
                ))}
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* --- RIGHT SIDE: CATALYST 2.0 --- */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, borderTop: '6px solid #e31e24', height: '100%' }}>
            
            {/* Header & Filters */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#e31e24' }}>Catalyst 2.0</Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>City</InputLabel>
                  <Select value={cat2Filters.city} label="City" onChange={(e) => setCat2Filters({...cat2Filters, city: e.target.value})}>
                    {cat2Cities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Dealership</InputLabel>
                  <Select value={cat2Filters.dealership} label="Dealership" onChange={(e) => setCat2Filters({...cat2Filters, dealership: e.target.value})}>
                    {cat2Dealerships.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Overall Score Box */}
            <Box sx={{ bgcolor: '#e31e24', p: 3, borderRadius: 2, textAlign: 'center', mb: 3, mt: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                {catalyst2Stats?.grand_overall ? catalyst2Stats.grand_overall.toFixed(2) : "0.00"}%
              </Typography>
              <Typography variant="subtitle2" sx={{ opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1, color: 'white' }}>Overall Score</Typography>
            </Box>

            {/* Cluster Summary */}
            <ClusterSummary stats={catalyst2Stats} source="catalyst2" />

             {/* Categories */}
             {Object.values(CATEGORIES).map((cat, idx) => (
              <Box key={idx} sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: `2px solid ${cat.velocityColor}`, pb: 1 }}>
                  <Typography variant="h5" sx={{ color: cat.velocityColor, fontWeight: 'bold' }}>
                    {cat.title}
                  </Typography>
                  <Typography variant="h6" sx={{ color: cat.velocityColor, fontWeight: 'bold' }}>
                    {catalyst2Stats?.[`${Object.keys(CATEGORIES)[idx]}_overall`] ? catalyst2Stats[`${Object.keys(CATEGORIES)[idx]}_overall`].toFixed(2) : "0.00"}%
                  </Typography>
                </Box>

                {cat.metrics.map((metric, mIdx) => (
                  <SingleBar 
                    key={mIdx}
                    label={metric.label}
                    value={catalyst2Stats?.[metric.velKey]}
                    color={cat.velocityColor}
                  />
                ))}
              </Box>
            ))}
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}