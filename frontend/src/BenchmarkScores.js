import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  LinearProgress, 
  Card 
} from '@mui/material';

export default function BenchmarkScores() {
  
  // Helper to render progress bars
  const renderBar = (label, value, color) => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>{label}</Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: color }}>{value}%</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={value} 
        sx={{ 
          height: 12, 
          borderRadius: 6, 
          bgcolor: '#e0e0e0',
          '& .MuiLinearProgress-bar': { bgcolor: color } 
        }} 
      />
    </Box>
  );

  const oceanData = [
    { label: 'Conscientiousness', val: 25, color: '#0039a6' },
    { label: 'Extraversion', val: 25, color: '#e31e24' },
    { label: 'Agreeableness', val: 22, color: '#4caf50' },
    { label: 'Openness', val: 22, color: '#ff9800' },
    { label: 'Neuroticism', val: 7, color: '#9e9e9e' },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0039a6' }}>
          The Ideal Sales Manager
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Benchmark Profile & Competency Requirements
        </Typography>
      </Box>

      <Grid container spacing={3}>
        
        {/* 1. Competency Cluster - Full Width to match OCEAN */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 4, borderBottom: '2px solid #eee', pb: 2, color: '#0039a6' }}>
              Competency Cluster
            </Typography>
            
            {renderBar("Cognitive Skills", 83, "#0039a6")}
            {renderBar("Interpersonal Skills", 78, "#4caf50")}
            {renderBar("Self-Leadership Skills", 81, "#e31e24")}
          </Paper>
        </Grid>

        {/* 2. OCEAN Attributes - Full Width */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 1, color: '#0039a6' }}>
              OCEAN Attributes
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4, borderBottom: '2px solid #eee', pb: 2 }}>
              This is the ideal OCEAN profile of a sales manager.
            </Typography>

            <Grid container spacing={2}>
              {oceanData.map((item, idx) => (
                <Grid item xs={12} sm={6} md={2.4} key={idx}>
                  <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1.5, border: 'none', bgcolor: '#f9f9f9' }}>
                    <Box 
                      sx={{ 
                        width: 50, 
                        height: 50, 
                        borderRadius: '50%', 
                        bgcolor: `${item.color}20`, 
                        color: item.color,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        mr: 2,
                        fontSize: '1rem'
                      }}
                    >
                      {item.val}%
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{item.label}</Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* 3. Bottom Text */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: '#333', color: 'white', borderRadius: 2 }}>
            <Typography variant="body1" align="center" sx={{ lineHeight: 1.6, fontSize: '1.1rem' }}>
              Based on research and insights on high performance in automotive dealerships and the service industry, the ideal manager should have an average score of <strong>80%</strong> in the above 3 competency clusters to perform exceptionally well.
            </Typography>
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}