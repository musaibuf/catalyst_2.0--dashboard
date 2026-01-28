import Papa from 'papaparse';

// --- IMPORT CSV FILES ---
import participantFile from '../data/participants.csv';
import big5File from '../data/Big 5 Personality - Sheet1.csv';
import otFile from '../data/OT - Response Sheet - Sheet1.csv';
import roleplayFile from '../data/Roleplay - Catalyst 2.0 - Sheet1.csv';
import sjtAFile from '../data/SJT - A Response Sheet - Sheet1.csv';
import sjtBFile from '../data/SJT - B Response Sheet - Sheet1.csv';

// --- CONFIGURATION ---
const MAX_SCORE = 4; 

const TIERS = {
  DIAMOND: { label: 'Diamond', color: '#b9f2ff', min: 81 },
  GOLD: { label: 'Gold', color: '#ffd700', min: 66 },
  SILVER: { label: 'Silver', color: '#c0c0c0', min: 51 },
  BRONZE: { label: 'Bronze', color: '#cd7f32', min: 0 }
};

// ORDER MATTERS HERE: This order matches SJT Q1 to Q12
const COMPETENCIES = [
  // Cognitive (Q1 - Q6)
  { id: 'c_problem_solving', label: 'Problem Solving', cluster: 'cognitive' },
  { id: 'c_asking_questions', label: 'Asking the Right Questions', cluster: 'cognitive' },
  { id: 'c_listening', label: 'Listening Skills', cluster: 'cognitive' },
  { id: 'c_decision_making', label: 'Decision Making', cluster: 'cognitive' },
  { id: 'c_strategic_sales', label: 'Strategic Sales', cluster: 'cognitive' },
  { id: 'c_social_media', label: 'Social Media', cluster: 'cognitive' },
  // Self-Leadership (Q7 - Q9)
  { id: 'sl_leadership', label: 'Leadership & Conflict Management', cluster: 'selfLeadership' },
  { id: 'sl_resilience', label: 'Resilience', cluster: 'selfLeadership' },
  { id: 'sl_time_mgmt', label: 'Personal Effectiveness & Time Management', cluster: 'selfLeadership' },
  // Interpersonal (Q10 - Q12)
  { id: 'i_communication', label: 'Communication Skills', cluster: 'interpersonal' },
  { id: 'i_positive_env', label: 'Building a Positive Environment', cluster: 'interpersonal' },
  { id: 'i_org_skills', label: 'Organization Skills & Team Management', cluster: 'interpersonal' }
];

// --- MAPPING (UPDATED TO USE Z-SCORED COLUMNS) ---
const CSV_COLUMN_MAPPING = {
  // Big 5 (Stays the same)
  ocean_o: 'Openness',
  ocean_c: 'Conscientiousness',
  ocean_e: 'Extraversion',
  ocean_a: 'Agreeableness',
  ocean_n: 'Neuroticism',

  // Competencies (Mapped to Z-Scored Headers in OT/Roleplay)
  c_problem_solving: 'Problem Solving(z scored)',
  c_asking_questions: 'Asking Questions(z scored)',
  c_listening: 'Listening Skills(z scored)',
  c_decision_making: 'Decision Making(z scored)',
  c_strategic_sales: 'Strategic Sales(z scored)',
  c_social_media: 'Social Media(z scored)',
  
  sl_leadership: 'Leadership & Conflict(z scored)',
  sl_resilience: 'Resilience(z scored)',
  sl_time_mgmt: 'Personal Effectiveness(z scored)',
  
  i_communication: 'Communication(z scored)',
  i_positive_env: 'Positive Env.(z scored)',
  i_org_skills: 'Org. Skills(z scored)'
};

// --- FEEDBACK DATABASES ---
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

const BIG5_FEEDBACK = {
  O: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency', context: 'Comfortable with new customer types, ambiguity, and unscripted conversations', strength: 'Can adapt to lifestyle-led, non-linear sales conversations', coachPoint: 'Leverage comfort with ambiguity to build deeper customer relationships', readinessFactor: 'Excellent for premium/HNI customers' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Reliable, usually visible', context: 'Generally comfortable with new ideas and diverse customer profiles', strength: 'Able to handle varied customer needs with reasonable flexibility', coachPoint: 'Build confidence in truly unscripted scenarios', readinessFactor: 'Good for premium exposure with coaching' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Situational, coachable', context: 'Prefers familiar structures; may hesitate with unconventional approaches', strength: 'Works well with structured processes and known customer types', coachPoint: 'Gradually introduce more ambiguity and unscripted selling techniques', readinessFactor: 'Requires development before premium exposure' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Development risk', context: 'Prefers structure; may struggle with new or premium buyer profiles', strength: 'Excels in process-driven, predictable sales environments', coachPoint: 'Invest in structured premium selling frameworks; exposure therapy for ambiguity', readinessFactor: 'Needs significant development before HNI selling' }
  },
  C: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency', context: 'Reliable, prepared, detail-oriented, builds trust', strength: 'Consistent follow-through, meticulous documentation, earns customer confidence', coachPoint: 'Ensure detail-focus doesn\'t slow down closing; balance precision with pace', readinessFactor: 'Highly suited for premium customers valuing reliability' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Reliable, usually visible', context: 'Generally organized and detail-conscious', strength: 'Dependable follow-up and execution; inspires customer trust', coachPoint: 'Maintain consistency; add strategic thinking to details', readinessFactor: 'Ready for premium customers' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Situational, coachable', context: 'Variable attention to detail; inconsistent organization', strength: 'Can be detail-oriented when motivated or coached', coachPoint: 'Implement systems and checklists; build accountability habits', readinessFactor: 'Needs coaching before premium exposure' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Development risk', context: 'Inconsistent follow-up, weak execution discipline', strength: 'May excel in dynamic, spontaneous situations', coachPoint: 'Critical: Establish CRM discipline, deadline accountability, quality checks', readinessFactor: 'Not ready for HNI customers—must improve execution first' }
  },
  E: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency', context: 'Confident presence, energetic, naturally initiates conversations', strength: 'Comfort initiating with strangers; infectious energy builds rapport', coachPoint: 'Guard against dominating conversations; practice active listening and restraint', readinessFactor: 'Strong presence, but must balance with empathy' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Reliable, usually visible', context: 'Presence without dominance; conversational restraint', strength: 'Balanced approach—confident but not overwhelming; approachable', coachPoint: 'Ideal state for HNI selling; maintain this balance', readinessFactor: 'Naturally suited for premium customer interactions' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Situational, coachable', context: 'Selective initiator; prefers smaller groups or one-on-ones', strength: 'Thoughtful listener; builds deep connections with prepared customers', coachPoint: 'Build confidence in cold outreach and group settings', readinessFactor: 'Can succeed with preparation; needs visibility coaching' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Development risk', context: 'May struggle with visibility or initiation', strength: 'Can succeed with preparation; excels in deep, scheduled conversations', coachPoint: 'Exposure therapy: scheduled networking, prepared cold calls, team shadowing', readinessFactor: 'Needs visibility coaching before independent HNI prospecting' }
  },
  A: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency', context: 'Empathetic, respectful, relationship-focused, non-pushy', strength: 'Naturally trusted; listens deeply; puts customer needs first', coachPoint: 'Ensure empathy doesn\'t prevent assertive closing; balance warmth with results', readinessFactor: 'Excellent for long-term premium customer relationships' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Reliable, usually visible', context: 'Respectful, socially attuned; balanced approach', strength: 'Strong interpersonal skills; builds trust while maintaining professionalism', coachPoint: 'Maintain this balance; this is the ideal for HNI engagement', readinessFactor: 'Naturally suited for respectful premium selling' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Situational, coachable', context: 'Selectively cooperative; can be direct or indirect depending on context', strength: 'Can adjust style based on customer; not overly deferential', coachPoint: 'Develop consistent empathy; practice perspective-taking', readinessFactor: 'Needs coaching on consistent respect and empathy' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Development risk', context: 'May appear pushy, dismissive, or overly transactional', strength: 'Direct, competitive; may excel in aggressive negotiations', coachPoint: 'Critical: Develop empathy and active listening; reframe "win-win" as personal value', readinessFactor: 'Not suited for HNI customers without significant agreeableness coaching' }
  },
  N: {
    high: { band: 'High (4.2-5.0)', interpretation: 'Strong natural tendency (High Neuroticism)', context: 'Anxious, reactive to stress, takes rejection personally', strength: 'Detail-aware; motivated by threat avoidance; conscientious', coachPoint: 'Critical coaching: Build emotional resilience; develop stress management and reframing', readinessFactor: 'Needs significant emotional coaching before premium exposure' },
    moderateHigh: { band: 'Moderately High (3.5-4.1)', interpretation: 'Moderately sensitive to stress', context: 'Reactive to pressure; confidence can fluctuate under stress', strength: 'Aware of risks; can be motivated to improve by avoiding failure', coachPoint: 'Build resilience through small wins; develop antistress techniques', readinessFactor: 'Needs coaching in stress resilience before HNI exposure' },
    moderate: { band: 'Moderate (2.8-3.4)', interpretation: 'Balanced emotional response', context: 'Generally steady under pressure; occasional stress reactions', strength: 'Resilient; can handle customer objections; bounces back from setbacks', coachPoint: 'Maintain current equilibrium; leverage resilience in coaching others', readinessFactor: 'Ready for premium customers; emotionally stable' },
    low: { band: 'Low (Below 2.8)', interpretation: 'Low Neuroticism = High Emotional Stability', context: 'Calm under pressure, silence, price resistance, and status asymmetry', strength: 'Naturally resilient; unshakeable confidence; thrives under stress', coachPoint: 'Mentor others; ensure overconfidence doesn\'t lead to dismissing customer concerns', readinessFactor: 'Ideally suited for high-stakes premium/HNI selling' }
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

const normalizeCNIC = (cnic) => {
  if (!cnic) return "";
  return String(cnic).replace(/[^a-zA-Z0-9]/g, '').trim();
};

// Helper to parse a single CSV file
const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => resolve(results.data),
      error: (err) => reject(err)
    });
  });
};

// --- MAIN PROCESSING FUNCTION ---
export const processData = async (callback) => {
  try {
    // 1. Load all CSV files in parallel
    const [
      participants,
      big5Data,
      otData,
      roleplayData,
      sjtAData,
      sjtBData
    ] = await Promise.all([
      parseCSV(participantFile),
      parseCSV(big5File),
      parseCSV(otFile),
      parseCSV(roleplayFile),
      parseCSV(sjtAFile),
      parseCSV(sjtBFile)
    ]);

    // 2. Create Lookup Maps for Data Files (Key: Normalized CNIC)
    const createMap = (data, keyName = 'CNIC') => {
      const map = new Map();
      data.forEach(row => {
        let cnic = row[keyName];
        if (!cnic && keyName === 'CNIC') cnic = row['cnic']; // Fallback
        if (cnic) map.set(normalizeCNIC(cnic), row);
      });
      return map;
    };

    const big5Map = createMap(big5Data, 'CNIC');
    const otMap = createMap(otData, 'Participant CNIC');
    const roleplayMap = createMap(roleplayData, 'Participant CNIC');
    const sjtAMap = createMap(sjtAData, 'CNIC');
    const sjtBMap = createMap(sjtBData, 'CNIC');

    // 3. Merge Data
    const merged = participants.map(p => {
      const targetCnic = normalizeCNIC(p['CNIC'] || p['cnic']);
      
      // Retrieve data rows from maps
      const big5Row = big5Map.get(targetCnic) || {};
      const otRow = otMap.get(targetCnic) || {};
      const roleplayRow = roleplayMap.get(targetCnic) || {};
      
      // Check SJT A first, then B
      const sjtARow = sjtAMap.get(targetCnic);
      const sjtBRow = sjtBMap.get(targetCnic);
      const sjtRow = sjtARow || sjtBRow || {};
      const isVariantA = !!sjtARow; 

      // Combine all data sources into one object for easier lookup
      const allDataSources = { ...big5Row, ...otRow, ...roleplayRow, ...sjtRow };

      // --- CALCULATE SCORES ---
      const finalScores = {};
      const clusterTotals = { cognitive: 0, selfLeadership: 0, interpersonal: 0 };
      const clusterCounts = { cognitive: 0, selfLeadership: 0, interpersonal: 0 };
      const feedbackList = [];

      // --- DETERMINE SJT CLUSTER SCORES (Q13-Q15) ---
      // These are added to EVERY competency in their respective cluster
      const q13 = parseFloat(sjtRow['Score of Q13']) || 0;
      const q14 = parseFloat(sjtRow['Score of Q14']) || 0;
      const q15 = parseFloat(sjtRow['Score of Q15']) || 0;

      let sjtCognitiveScore = 0;
      let sjtSelfLeadScore = 0;
      let sjtInterpersonalScore = 0;

      if (isVariantA) {
        sjtCognitiveScore = q13;
        sjtSelfLeadScore = q14;
        sjtInterpersonalScore = q15;
      } else if (sjtBRow) {
        sjtSelfLeadScore = q13;
        sjtCognitiveScore = q14;
        sjtInterpersonalScore = q15;
      }

      // --- CALCULATE COMPETENCY SCORES ---
      COMPETENCIES.forEach((comp, index) => {
        const csvHeader = CSV_COLUMN_MAPPING[comp.id];
        
        // 1. OT Score (Using Z-Scored Column)
        let otScore = parseFloat(otRow[csvHeader]);
        
        // 2. Roleplay Score (Using Z-Scored Column)
        let rpScore = parseFloat(roleplayRow[csvHeader]);
        
        // 3. SJT Specific Question (Q1 - Q12)
        // Note: Index is 0-based, Questions are 1-based
        let sjtSpecificScore = parseFloat(sjtRow[`Score Q${index + 1}`]);

        // 4. SJT Cluster Score (The "Averaging Out" Factor)
        let sjtClusterScore = 0;
        if (comp.cluster === 'cognitive') sjtClusterScore = sjtCognitiveScore;
        else if (comp.cluster === 'selfLeadership') sjtClusterScore = sjtSelfLeadScore;
        else if (comp.cluster === 'interpersonal') sjtClusterScore = sjtInterpersonalScore;

        // --- AVERAGE CALCULATION ---
        let sum = 0;
        let count = 0;

        if (!isNaN(otScore)) { sum += otScore; count++; }
        if (!isNaN(rpScore)) { sum += rpScore; count++; }
        if (!isNaN(sjtSpecificScore)) { sum += sjtSpecificScore; count++; }
        if (sjtClusterScore > 0) { sum += sjtClusterScore; count++; }

        // Average Score for this Competency (Scale 1-4)
        let avgScore = count > 0 ? sum / count : 0;
        
        // Calculate Percentage (Score / 4 * 100)
        const pct = (avgScore / MAX_SCORE) * 100;
        finalScores[comp.id] = pct;

        // Add to Cluster Totals
        if (count > 0) {
          clusterTotals[comp.cluster] += pct;
          clusterCounts[comp.cluster]++;
        }

        // Generate Feedback
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

      // C. Big 5 Scores
      const oceanScores = { O: 0, C: 0, E: 0, A: 0, N: 0 };
      const big5Feedback = {};
      
      ['O', 'C', 'E', 'A', 'N'].forEach(trait => {
        const key = `ocean_${trait.toLowerCase()}`;
        const header = CSV_COLUMN_MAPPING[key];
        let val = parseFloat(big5Row[header]); 
        if (isNaN(val)) val = 0;
        
        oceanScores[trait] = val;

        // Generate Big 5 Feedback
        let feedback = {};
        if (val >= 4.2) feedback = BIG5_FEEDBACK[trait].high;
        else if (val >= 3.5) feedback = BIG5_FEEDBACK[trait].moderateHigh;
        else if (val >= 2.8) feedback = BIG5_FEEDBACK[trait].moderate;
        else feedback = BIG5_FEEDBACK[trait].low;

        big5Feedback[trait] = {
          score: val,
          ...feedback
        };
      });

      // D. Overall Calculations
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
          feedback: feedbackList,
          big5Feedback: big5Feedback
        }
      };
    });

    merged.sort((a, b) => b.calculated.overall - a.calculated.overall);
    
    callback(merged);

  } catch (error) {
    console.error("❌ Error processing data:", error);
    callback([]);
  }
};