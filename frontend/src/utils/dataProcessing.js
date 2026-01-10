import Papa from 'papaparse';
import participantFile from '../data/participants.csv';

// --- CONFIGURATION ---
// ⚠️ IMPORTANT: Ensure this is your BACKEND Web Service URL from Render
// It should NOT be the same URL as your Dashboard website.
const API_URL = "https://catalyst-backend-ggzy.onrender.com"; 

const TIERS = {
  DIAMOND: { label: 'Diamond', color: '#b9f2ff', min: 81 },
  GOLD: { label: 'Gold', color: '#ffd700', min: 66 },
  SILVER: { label: 'Silver', color: '#c0c0c0', min: 51 },
  BRONZE: { label: 'Bronze', color: '#cd7f32', min: 0 }
};

const COMPETENCIES = [
  // Cognitive
  { id: 'c_problem_solving', label: 'Problem Solving', cluster: 'cognitive' },
  { id: 'c_asking_questions', label: 'Asking the Right Questions', cluster: 'cognitive' },
  { id: 'c_listening', label: 'Listening Skills', cluster: 'cognitive' },
  { id: 'c_decision_making', label: 'Decision Making', cluster: 'cognitive' },
  { id: 'c_strategic_sales', label: 'Strategic Sales', cluster: 'cognitive' },
  { id: 'c_social_media', label: 'Social Media', cluster: 'cognitive' },
  // Self-Leadership
  { id: 'sl_leadership', label: 'Leadership & Conflict Management', cluster: 'selfLeadership' },
  { id: 'sl_resilience', label: 'Resilience', cluster: 'selfLeadership' },
  { id: 'sl_time_mgmt', label: 'Personal Effectiveness & Time Management', cluster: 'selfLeadership' },
  // Interpersonal
  { id: 'i_communication', label: 'Communication Skills', cluster: 'interpersonal' },
  { id: 'i_positive_env', label: 'Building a Positive Environment', cluster: 'interpersonal' },
  { id: 'i_org_skills', label: 'Organization Skills & Team Management', cluster: 'interpersonal' }
];

// --- 5-LEVEL DETAILED FEEDBACK DATABASE ---
const FEEDBACK_DB = {
  c_problem_solving: {
    ex_low: { title: "Foundations of Logic", duration: "2 Days", areas: "Defining Problems, Fact vs Opinion", method: "Drills", rationale: "Struggles to identify core issues." },
    low: { title: "Root Cause Analysis", duration: "1 Day", areas: "5 Whys, Fishbone Diagram", method: "Case Studies", rationale: "Treats symptoms rather than causes." },
    med: { title: "Creative Problem Solving", duration: "2 Days", areas: "Ideation, Lateral Thinking", method: "Workshop", rationale: "Solves standard problems but lacks innovation." },
    high: { title: "Strategic Problem Solving", duration: "1 Day", areas: "Systemic Risk, Long-term Impact", method: "Simulation", rationale: "Needs to focus on systemic prevention." },
    ex_high: { title: "Crisis Management Lab", duration: "2 Days", areas: "Chaos Theory, Rapid Response", method: "Real-world Sim", rationale: "Mastery level; ready for high-stakes scenarios." }
  },
  c_asking_questions: {
    ex_low: { title: "Power of Asking", duration: "1 Day", areas: "Open vs Closed Questions", method: "Roleplay", rationale: "Rarely asks questions; needs inquiry habit." },
    low: { title: "Needs Assessment", duration: "1 Day", areas: "Probing, Fact-Finding", method: "Sales Scenarios", rationale: "Misses key details; needs probing skills." },
    med: { title: "Consultative Questioning (SPIN)", duration: "2 Days", areas: "Situation, Problem, Implication", method: "Advanced Roleplay", rationale: "Needs to guide customer thinking via questions." },
    high: { title: "The Socratic Method", duration: "Ongoing", areas: "Critical Thinking, Influence", method: "Coaching", rationale: "Ready to influence outcomes via inquiry." },
    ex_high: { title: "Strategic Discovery", duration: "1 Day", areas: "Uncovering Latent Needs", method: "Mentoring", rationale: "Exceptional; should mentor others." }
  },
  c_listening: {
    ex_low: { title: "Attention & Focus", duration: "1 Day", areas: "Removing Distractions, Eye Contact", method: "Video Analysis", rationale: "Frequently interrupts; needs focus." },
    low: { title: "Active Listening Basics", duration: "1 Day", areas: "Paraphrasing, Summarizing", method: "Group Work", rationale: "Misses details; needs retention techniques." },
    med: { title: "Empathetic Listening", duration: "2 Days", areas: "EQ, Validating Feelings", method: "Workshop", rationale: "Misses emotional subtext." },
    high: { title: "Listening for Subtext", duration: "1 Day", areas: "Reading Between Lines", method: "Simulation", rationale: "Ready to hear what isn't said." },
    ex_high: { title: "Negotiation Psychology", duration: "2 Days", areas: "High-stakes Profiling", method: "Case Study", rationale: "Can de-escalate and close complex deals." }
  },
  c_decision_making: {
    ex_low: { title: "Overcoming Indecision", duration: "1 Day", areas: "Confidence, Basic Choice", method: "Coaching", rationale: "Freezes under pressure." },
    low: { title: "Decision Frameworks", duration: "1 Day", areas: "Pros/Cons, SWOT", method: "Classroom", rationale: "Lacks structure in choices." },
    med: { title: "Data-Driven Decisions", duration: "2 Days", areas: "Analytics, Reducing Bias", method: "Case Studies", rationale: "Needs to back intuition with data." },
    high: { title: "Strategic Decision Making", duration: "1 Day", areas: "Risk vs Reward, Stakeholders", method: "Gamified Sim", rationale: "Focus on organizational ripple effects." },
    ex_high: { title: "Decision Making Under Pressure", duration: "2 Days", areas: "Crisis Leadership, Ambiguity", method: "High-Stress Sim", rationale: "Thrives in ambiguity." }
  },
  c_strategic_sales: {
    ex_low: { title: "Intro to Sales", duration: "2 Days", areas: "Sales Cycle, Product Knowledge", method: "Training", rationale: "Lacks foundational sales knowledge." },
    low: { title: "Pipeline Management", duration: "1 Day", areas: "Prospecting, Closing", method: "CRM Training", rationale: "Disorganized funnel management." },
    med: { title: "Consultative Selling", duration: "2 Days", areas: "Value Prop, Solution Selling", method: "Roleplay", rationale: "Needs to shift from transactional to solution." },
    high: { title: "Key Account Management", duration: "2 Days", areas: "Relationship Building, Up-selling", method: "Seminar", rationale: "Focus on high-value retention." },
    ex_high: { title: "Global Market Strategy", duration: "3 Days", areas: "Macro-trends, Partnerships", method: "Retreat", rationale: "Top performer; strategic asset." }
  },
  c_social_media: {
    ex_low: { title: "Digital Literacy", duration: "0.5 Day", areas: "Platform Overview, Safety", method: "Lab", rationale: "Unfamiliar with platforms." },
    low: { title: "Professional Presence", duration: "1 Day", areas: "LinkedIn Profile, Etiquette", method: "Workshop", rationale: "Passive user; needs optimization." },
    med: { title: "Social Selling", duration: "2 Days", areas: "Content Strategy, Lead Gen", method: "Interactive", rationale: "Needs to convert likes to leads." },
    high: { title: "Content & Branding", duration: "1 Day", areas: "Video, Copywriting, Analytics", method: "Creative Lab", rationale: "Refine content authority." },
    ex_high: { title: "Thought Leadership", duration: "Ongoing", areas: "Industry Influence", method: "Mentorship", rationale: "Digital native brand ambassador." }
  },
  sl_leadership: {
    ex_low: { title: "Self-Leadership Basics", duration: "1 Day", areas: "Accountability, Ownership", method: "Classroom", rationale: "Must lead self before others." },
    low: { title: "Emerging Leaders", duration: "2 Days", areas: "Delegation, Motivation", method: "Workshop", rationale: "Lacks management tools." },
    med: { title: "Conflict Resolution", duration: "2 Days", areas: "Mediation, Difficult Convos", method: "Roleplay", rationale: "Avoids conflict; needs constructive skills." },
    high: { title: "Situational Leadership", duration: "2 Days", areas: "Adaptive Styles, Coaching", method: "Simulation", rationale: "Adapt style to team maturity." },
    ex_high: { title: "Organizational Influence", duration: "Ongoing", areas: "Vision, Culture, Change", method: "Executive Coaching", rationale: "Ready for strategic roles." }
  },
  sl_resilience: {
    ex_low: { title: "Coping with Stress", duration: "1 Day", areas: "Triggers, Breathing", method: "Wellness", rationale: "Easily overwhelmed." },
    low: { title: "Building Resilience", duration: "1 Day", areas: "Growth Mindset, Persistence", method: "Workshop", rationale: "Slow recovery from setbacks." },
    med: { title: "Emotional Intelligence", duration: "2 Days", areas: "Self-Regulation, Empathy", method: "Interactive", rationale: "Reactive; needs regulation." },
    high: { title: "Adaptability & Agility", duration: "2 Days", areas: "Change Mgmt, Flexibility", method: "Simulation", rationale: "Thrive during rapid change." },
    ex_high: { title: "Anti-Fragility", duration: "1 Day", areas: "Leading in Crisis, Stoicism", method: "Seminar", rationale: "Unshakeable anchor." }
  },
  sl_time_mgmt: {
    ex_low: { title: "Time Mgmt 101", duration: "1 Day", areas: "To-Do Lists, Punctuality", method: "Training", rationale: "Disorganized and late." },
    low: { title: "Prioritization", duration: "1 Day", areas: "Urgent vs Important", method: "Workshop", rationale: "Busy but not productive." },
    med: { title: "Productivity & Efficiency", duration: "1 Day", areas: "Deep Work, Batching", method: "Self-Paced", rationale: "Good output but burns out." },
    high: { title: "Agile Workflows", duration: "2 Days", areas: "Sprint Planning, Kanban", method: "Team Workshop", rationale: "Organize team workflows." },
    ex_high: { title: "Strategic Focus", duration: "0.5 Day", areas: "80/20 Rule, Vision Alignment", method: "Coaching", rationale: "Master of time allocation." }
  },
  i_communication: {
    ex_low: { title: "Business Comm Basics", duration: "2 Days", areas: "Grammar, Email Etiquette", method: "Training", rationale: "Unclear or unprofessional." },
    low: { title: "Verbal Communication", duration: "1 Day", areas: "Articulation, Confidence", method: "Drills", rationale: "Lacks speaking confidence." },
    med: { title: "Persuasive Presentation", duration: "2 Days", areas: "Structuring Arguments", method: "Video Practice", rationale: "Needs to sell ideas better." },
    high: { title: "Storytelling for Business", duration: "1 Day", areas: "Narrative Arc, Emotion", method: "Workshop", rationale: "Inspire through stories." },
    ex_high: { title: "Charisma & Presence", duration: "Ongoing", areas: "Media Training, Influence", method: "One-on-One", rationale: "Public face of the brand." }
  },
  i_positive_env: {
    ex_low: { title: "Workplace Etiquette", duration: "1 Day", areas: "Respect, Boundaries", method: "Training", rationale: "Disruptive behavior." },
    low: { title: "Teamwork Fundamentals", duration: "1 Day", areas: "Collaboration, Trust", method: "Team Building", rationale: "Works in silos." },
    med: { title: "Psychological Safety", duration: "1 Day", areas: "Inclusion, Feedback", method: "Interactive", rationale: "Create safe space for others." },
    high: { title: "Conflict Transformation", duration: "2 Days", areas: "Innovation from Conflict", method: "Simulation", rationale: "Turn friction into energy." },
    ex_high: { title: "Culture Building", duration: "2 Days", areas: "Values, Legacy", method: "Seminar", rationale: "Culture carrier." }
  },
  i_org_skills: {
    ex_low: { title: "Personal Organization", duration: "1 Day", areas: "Filing, Checklists", method: "Training", rationale: "Messy workspace/files." },
    low: { title: "Task Management", duration: "1 Day", areas: "Scheduling, Deadlines", method: "Workshop", rationale: "Misses deadlines." },
    med: { title: "Project Mgmt Fundamentals", duration: "2 Days", areas: "Resources, Timelines", method: "Case Study", rationale: "Manage small projects." },
    high: { title: "Systems Thinking", duration: "2 Days", areas: "Process Optimization", method: "Simulation", rationale: "Improve system efficiency." },
    ex_high: { title: "Operational Excellence", duration: "2 Days", areas: "Lean, Scaling", method: "Executive Course", rationale: "Operational expert." }
  }
};

// --- HELPER FUNCTIONS ---

export const getTier = (percentage) => {
  const rounded = Math.round(percentage);
  if (rounded >= TIERS.DIAMOND.min) return TIERS.DIAMOND;
  if (rounded >= TIERS.GOLD.min) return TIERS.GOLD;
  if (rounded >= TIERS.SILVER.min) return TIERS.SILVER;
  return TIERS.BRONZE;
};

// Helper to clean CNIC for comparison (removes dashes and spaces)
const normalizeCNIC = (cnic) => {
  if (!cnic) return "";
  return String(cnic).replace(/[^a-zA-Z0-9]/g, '').trim();
};

export const processData = (callback) => {
  console.log("1. Starting Data Processing...");

  // 1. Read CSV (Demographics)
  Papa.parse(participantFile, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const csvData = results.data;
      console.log(`2. CSV Loaded: ${csvData.length} participants found.`);
      
      try {
        // 2. FETCH FROM REAL DATABASE
        // Force use of Live URL to ensure we aren't looking at empty local DB
        const fetchUrl = `${API_URL}/api/dashboard-data`;
        
        console.log(`3. Fetching from: ${fetchUrl}`);
        const response = await fetch(fetchUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const dbData = await response.json();
        console.log(`4. DB Data Received: ${dbData.length} assessments found.`);

        // 3. Merge Data
        const merged = csvData.map(p => {
          // Normalize both CNICs to ensure match even if dashes differ
          const targetCnic = normalizeCNIC(p.cnic);
          
          // Find score record from DB
          // IMPORTANT: Backend returns 'cnic', not 'participant_cnic'
          const scoreRecord = dbData.find(s => normalizeCNIC(s.cnic) === targetCnic);
          
          if (!scoreRecord) {
            return null; 
          }

          const rawScores = scoreRecord.scores;
          
          // --- AGGREGATION LOGIC ---
          const compAggregates = {};
          COMPETENCIES.forEach(comp => { compAggregates[comp.id] = { sum: 0, count: 0 }; });
          const oceanScores = { O: 0, C: 0, E: 0, A: 0, N: 0 };

          Object.keys(rawScores).forEach(key => {
            const val = parseInt(rawScores[key]);
            if (key.startsWith('ocean_')) {
              const trait = key.split('_')[1].toUpperCase();
              if (oceanScores[trait] !== undefined) oceanScores[trait] = val;
              return;
            }
            const matchedComp = COMPETENCIES.find(c => key.includes(c.id));
            if (matchedComp) {
              compAggregates[matchedComp.id].sum += val;
              compAggregates[matchedComp.id].count += 1;
            }
          });

          const finalScores = {};
          const feedbackList = [];
          const clusterTotals = { cognitive: 0, selfLeadership: 0, interpersonal: 0 };
          const clusterCounts = { cognitive: 0, selfLeadership: 0, interpersonal: 0 };

          COMPETENCIES.forEach(comp => {
            const agg = compAggregates[comp.id];
            const avgScore = agg.count > 0 ? agg.sum / agg.count : 0;
            const pct = (avgScore / 4) * 100;
            finalScores[comp.id] = pct;

            if (pct > 0) {
              clusterTotals[comp.cluster] += pct;
              clusterCounts[comp.cluster]++;
            }

            // Feedback Logic
            let suggestionObj = { title: "N/A", duration: "", areas: "", method: "", rationale: "" };
            
            if (FEEDBACK_DB[comp.id]) {
                if (avgScore <= 1.5) suggestionObj = FEEDBACK_DB[comp.id].ex_low;
                else if (avgScore <= 2.2) suggestionObj = FEEDBACK_DB[comp.id].low;
                else if (avgScore <= 3.0) suggestionObj = FEEDBACK_DB[comp.id].med;
                else if (avgScore <= 3.6) suggestionObj = FEEDBACK_DB[comp.id].high;
                else suggestionObj = FEEDBACK_DB[comp.id].ex_high;
            }

            feedbackList.push({
              competency: comp.label,
              score: avgScore.toFixed(1),
              details: suggestionObj,
              cluster: comp.cluster
            });
          });

          const cogPct = clusterCounts.cognitive > 0 ? clusterTotals.cognitive / clusterCounts.cognitive : 0;
          const slPct = clusterCounts.selfLeadership > 0 ? clusterTotals.selfLeadership / clusterCounts.selfLeadership : 0;
          const ipPct = clusterCounts.interpersonal > 0 ? clusterTotals.interpersonal / clusterCounts.interpersonal : 0;
          const overallPct = (cogPct + slPct + ipPct) / 3;

          return {
            ...p,
            scores: finalScores,
            calculated: {
              cognitive: cogPct,
              selfLeadership: slPct,
              interpersonal: ipPct,
              overall: overallPct,
              ocean: oceanScores,
              tier: getTier(overallPct),
              feedback: feedbackList
            }
          };
        }).filter(Boolean);

        console.log(`5. Merging Complete. ${merged.length} participants matched and processed.`);
        
        merged.sort((a, b) => b.calculated.overall - a.calculated.overall);
        callback(merged);

      } catch (error) {
        console.error("❌ Error fetching DB data:", error);
        callback([]);
      }
    }
  });
};