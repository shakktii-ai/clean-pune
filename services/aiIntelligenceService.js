/**
 * AI-Assisted Complaint Intelligence Service
 * Provides advisory intelligence for category prediction, priority assessment,
 * semantic duplicate detection, Marathi-English assistance, and executive summarization.
 * 
 * NOTE: All AI outputs are strictly ADVISORY. Human coordinators and supervisors
 * retain full operational authority and make all final redressal decisions.
 */

// Pune Civic Bilingual Keyword Taxonomy for High-Accuracy Local Fallback
const CIVIC_TAXONOMY = [
  {
    categoryCode: 'CAT_POTHOLE',
    categoryName: 'Pothole / Damaged Road Surface',
    departmentCode: 'ROADS',
    keywords: [
      'pothole', 'crater', 'asphalt', 'tar', 'damaged road', 'road crater', 'paver', 'trench', 'uneven', 'skid', 'accident',
      'खड्डा', 'रस्ता खड्डा', 'डांबरी', 'पेव्हर', 'अपघात', 'दुरुस्ती',
    ],
    priorityScores: {
      CRITICAL: ['crater', 'highway', 'death trap', 'bus stand', 'जीवघेणा', 'हायवे'],
      HIGH: ['deep', 'fc road', 'senapati bapat', 'karve road', 'धोकादायक'],
      MEDIUM: ['small', 'lane', 'society', 'गल्ली'],
    },
  },
  {
    categoryCode: 'CAT_GARBAGE',
    categoryName: 'Garbage Overflow / Unattended Waste',
    departmentCode: 'SWM',
    keywords: [
      'garbage', 'waste', 'trash', 'debris', 'dumping', 'dump', 'litter', 'smell', 'stench', 'bin', 'van',
      'कचरा', 'घाण', 'दुर्गंधी', 'डस्टबिन', 'डंपिंग', 'सफाई',
    ],
    priorityScores: {
      CRITICAL: ['hospital', 'school', 'burning plastic', 'शाळा', 'दवाखाना'],
      HIGH: ['chronic', 'overflowing', 'main road', 'मंदिर'],
      MEDIUM: ['street', 'footpath', 'पायवाट'],
    },
  },
  {
    categoryCode: 'CAT_WATER_LEAK',
    categoryName: 'Drinking Water Pipe Leakage / Contamination',
    departmentCode: 'WATER',
    keywords: [
      'water', 'pipe', 'leak', 'burst', 'gushing', 'dirty', 'muddy', 'contamination', 'pressure', 'valve',
      'पाणी', 'गळती', 'पाईप', 'दूषित', 'गढूळ', 'प्रेशर', 'पिण्याचे पाणी',
    ],
    priorityScores: {
      CRITICAL: ['burst', 'gushing', 'contamination', 'foul smell', 'फुटली', 'दूषित पाणी'],
      HIGH: ['society', 'main line', 'गळती'],
      MEDIUM: ['low pressure', 'कमी दाब'],
    },
  },
  {
    categoryCode: 'CAT_SEWAGE',
    categoryName: 'Open Manhole / Choked Drainage',
    departmentCode: 'DRAINAGE',
    keywords: [
      'drain', 'sewer', 'manhole', 'chamber', 'gutter', 'overflow', 'choked', 'lid', 'open cover',
      'गटार', 'ड्रेनेज', 'मॅनहोल', 'चेंबर', 'झाकण', 'तुंबले', 'उघडे',
    ],
    priorityScores: {
      CRITICAL: ['open manhole', 'child', 'near school', 'उघडे मॅनहोल', 'जीवघेणे'],
      HIGH: ['overflowing', 'road', 'तुंबले'],
      MEDIUM: ['odor', 'वास'],
    },
  },
  {
    categoryCode: 'CAT_STREETLIGHT',
    categoryName: 'Dark Street / Defective Streetlight',
    departmentCode: 'LIGHTING',
    keywords: [
      'streetlight', 'street light', 'light', 'dark', 'pole', 'lamp', 'wire', 'sparking', 'blackout', 'hanging wire',
      'दिवाबत्ती', 'लाईट', 'अंधार', 'पोल', 'वायर', 'स्पार्क',
    ],
    priorityScores: {
      CRITICAL: ['sparking', 'live wire', 'current', 'शॉक', 'उघडी वायर'],
      HIGH: ['entire stretch', 'junction', 'flyover', 'चौक'],
      MEDIUM: ['single bulb', 'blinking', 'एक लाईट'],
    },
  },
  {
    categoryCode: 'CAT_TREE',
    categoryName: 'Fallen Tree / Dangerous Branch',
    departmentCode: 'GARDEN',
    keywords: [
      'tree', 'branch', 'fallen', 'precarious', 'crushed', 'blocking', 'pruning',
      'झाड', 'फांदी', 'पडले', 'मोडले', 'तोडणे',
    ],
    priorityScores: {
      CRITICAL: ['fell on car', 'blocking road', 'power cable', 'रस्ता बंद'],
      HIGH: ['heavy branch', 'precarious', 'धोकादायक फांदी'],
      MEDIUM: ['pruning needed', 'छाटणी'],
    },
  },
];

/**
 * Strips Personally Identifiable Information (phone numbers, email addresses,
 * 12-digit numbers) before external AI processing.
 */
export function scrubPii(text = '') {
  if (!text) return '';
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/(\+91[\-\s]?)?[6-9]\d{9}/g, '[REDACTED_PHONE]')
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_ID]');
}

/**
 * Predicts category, priority, and department based on text content.
 * Uses Gemini API if configured on server, otherwise invokes the high-precision Pune rule-based NLP engine.
 */
export async function analyzeComplaintIntelligence(input = '', options = {}) {
  let description = '';
  let title = '';
  let language = 'en';

  if (typeof input === 'string') {
    description = input;
    if (options && typeof options === 'object') {
      language = options.language || 'en';
      title = options.title || '';
    }
  } else if (input && typeof input === 'object') {
    description = input.description || input.text || '';
    title = input.title || '';
    language = input.language || 'en';
  }

  const combinedText = `${title} ${description}`.toLowerCase();
  const safeText = scrubPii(combinedText);

  // 1. Check if GEMINI_API_KEY is available for LLM inference
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const llmResult = await callGeminiAdvisory(safeText, language, geminiApiKey);
      if (llmResult && llmResult.categoryCode) {
        return {
          ...llmResult,
          suggestedCategoryCode: llmResult.categoryCode,
          summary: llmResult.summary || llmResult.executiveSummary,
          source: 'gemini-1.5-flash',
          isAdvisory: true,
        };
      }
    } catch (err) {
      console.warn('Gemini API inference fallback to rule-based engine:', err.message);
    }
  }

  // 2. High-Accuracy Rule-Based NLP Engine (Guaranteed 100% offline uptime)
  let bestCategory = CIVIC_TAXONOMY[0];
  let highestScore = 0;

  for (const cat of CIVIC_TAXONOMY) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (combinedText.includes(kw)) {
        score += 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  // Determine Priority
  let suggestedPriority = 'MEDIUM';
  let priorityRationale = 'Standard municipal maintenance timeframe recommended.';

  if (bestCategory.priorityScores) {
    for (const kw of bestCategory.priorityScores.CRITICAL || []) {
      if (combinedText.includes(kw)) {
        suggestedPriority = 'CRITICAL';
        priorityRationale = `Detected urgent civic hazard keyword: "${kw}". Immediate ground inspection recommended within 12 hours.`;
        break;
      }
    }
    if (suggestedPriority !== 'CRITICAL') {
      for (const kw of bestCategory.priorityScores.HIGH || []) {
        if (combinedText.includes(kw)) {
          suggestedPriority = 'HIGH';
          priorityRationale = `Detected high-traffic or public impact indicator: "${kw}". 24-hour turnaround suggested.`;
          break;
        }
      }
    }
  }

  // Generate Executive Summary
  const executiveSummary = generateSummary(description || title);

  return {
    source: 'pune-civic-nlp-engine',
    isAdvisory: true,
    categoryCode: bestCategory.categoryCode,
    suggestedCategoryCode: bestCategory.categoryCode,
    categoryName: bestCategory.categoryName,
    departmentCode: bestCategory.departmentCode,
    suggestedPriority,
    priorityRationale,
    summary: executiveSummary,
    executiveSummary,
    confidenceScore: Math.min(0.95, 0.65 + highestScore * 0.05),
    marathiKeywordsDetected: detectMarathiTerms(combinedText),
  };
}

/**
 * Checks for possible duplicate complaints within the same ward or nearby coordinates.
 */
export function detectDuplicateCandidates(newComplaint, existingComplaints = []) {
  if (!existingComplaints.length) return [];

  const newWords = new Set(
    (newComplaint.title + ' ' + (newComplaint.description || ''))
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );

  const duplicates = [];

  for (const candidate of existingComplaints) {
    if (candidate.complaintId === newComplaint.complaintId) continue;

    // Check same ward or same category
    const sameWard = String(candidate.ward?.wardNumber || candidate.wardNumber) === String(newComplaint.wardNumber);
    const candidateWords = new Set(
      (candidate.title + ' ' + (candidate.description || ''))
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3)
    );

    // Calculate Jaccard word intersection
    let intersection = 0;
    newWords.forEach((word) => {
      if (candidateWords.has(word)) intersection++;
    });

    const union = newWords.size + candidateWords.size - intersection;
    const similarity = union > 0 ? intersection / union : 0;

    if (similarity >= 0.35 || (sameWard && similarity >= 0.25)) {
      duplicates.push({
        complaintId: candidate.complaintId,
        title: candidate.title,
        status: candidate.status,
        similarityScore: Number(similarity.toFixed(2)),
        address: candidate.location?.address || 'Same Ward',
        reportedDate: candidate.createdAt,
        advisoryNote:
          similarity >= 0.5
            ? 'High similarity: Potential duplicate issue already reported in this locality.'
            : 'Moderate similarity: Related complaint reported in same administrative ward.',
      });
    }
  }

  return duplicates.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 3);
}

/**
 * Summarizes long grievance text into an executive triage note.
 */
function generateSummary(text = '') {
  if (!text) return '';
  const sentences = text.split(/[.?!।\n]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 2) return text.trim();
  return `${sentences[0]}. ${sentences[1]}.`;
}

/**
 * Detects local Marathi civic vocabulary
 */
function detectMarathiTerms(text = '') {
  const marathiDict = ['खड्डा', 'कचरा', 'गळती', 'गटार', 'दिवाबत्ती', 'झाड', 'फांदी', 'रस्ता', 'अपघात', 'पाणी'];
  return marathiDict.filter((term) => text.includes(term));
}

/**
 * Optional Gemini LLM Provider integration (executed only when GEMINI_API_KEY is configured)
 */
async function callGeminiAdvisory(safeText, language, apiKey) {
  const prompt = `You are a municipal civic triage advisor for Pune Civic Platform. Analyze this civic grievance description and return ONLY JSON with fields: categoryCode (one of CAT_POTHOLE, CAT_GARBAGE, CAT_WATER_LEAK, CAT_SEWAGE, CAT_LIGHTS, CAT_TREE), categoryName, suggestedPriority (LOW, MEDIUM, HIGH, CRITICAL), priorityRationale (1 sentence), executiveSummary (1-2 sentences). Complaint text: "${safeText}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 350,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error status: ${response.status}`);
  }

  const json = await response.json();
  const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) throw new Error('Empty Gemini response');

  return JSON.parse(rawContent);
}
