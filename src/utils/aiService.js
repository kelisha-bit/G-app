/**
 * AI Service Utility
 * 
 * Provides AI-powered features for the church app using free AI APIs
 * 
 * Supported Providers:
 * 1. Hugging Face Inference API (Free, no API key required for some models)
 * 2. OpenAI API (Requires API key, has free tier)
 * 
 * Usage:
 *   import { generatePrayerSuggestion, generateDevotionalContent, suggestBibleVerses } from '../utils/aiService';
 */

// Configuration - Set your preferred provider
const AI_PROVIDER = 'openai'; // This will use OpenAI instead of Hugging Face // 'huggingface' or 'openai'

// Hugging Face API (Free tier available, no credit card required)
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
// Optional: Add your Hugging Face token for faster responses (get free at huggingface.co)
const HUGGINGFACE_TOKEN = null; // Set to your token if you have one

// OpenAI API (Requires API key - get free credits at platform.openai.com)
// API key is loaded from environment variable: EXPO_PUBLIC_OPENAI_API_KEY
// Set it in your .env file (which is already in .gitignore for security)
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || null;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generic AI text generation using Hugging Face
 * Uses multiple fallback models for reliability
 */
const generateWithHuggingFace = async (prompt, model = null) => {
  // List of models to try (in order of preference)
  const models = model 
    ? [model] 
    : [
        'gpt2', // Simple, reliable text generation
        'distilgpt2', // Faster alternative
        'EleutherAI/gpt-neo-125M', // Alternative model
      ];

  let lastError = null;

  for (const modelName of models) {
    try {
      const url = `${HUGGINGFACE_API_URL}/${modelName}`;
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (HUGGINGFACE_TOKEN) {
        headers['Authorization'] = `Bearer ${HUGGINGFACE_TOKEN}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: prompt, parameters: { max_length: 200, temperature: 0.7 } }),
      });

      // If model is loading, wait a bit and try again
      if (response.status === 503) {
        const data = await response.json();
        if (data.estimated_time) {
          // Model is loading, skip to next model
          continue;
        }
      }

      if (!response.ok) {
        // If 410 (Gone) or 404 (Not Found), try next model
        if (response.status === 410 || response.status === 404) {
          lastError = new Error(`Model ${modelName} not available`);
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data) && data[0]?.generated_text) {
        const generated = data[0].generated_text.replace(prompt, '').trim();
        if (generated.length > 0) return generated;
      } else if (data[0]?.summary_text) {
        return data[0].summary_text;
      } else if (typeof data === 'string') {
        return data;
      } else if (data.generated_text) {
        return data.generated_text.replace(prompt, '').trim();
      }
      
      // If we got here but no valid response, try next model
      continue;
    } catch (error) {
      lastError = error;
      // Continue to next model
      continue;
    }
  }

  // All models failed
  throw lastError || new Error('All Hugging Face models unavailable');
};

/**
 * Generic AI text generation using OpenAI
 */
const generateWithOpenAI = async (prompt, systemPrompt = 'You are a helpful assistant.') => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add your API key in src/utils/aiService.js');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

/**
 * Main AI generation function - routes to appropriate provider
 */
const generateAI = async (prompt, options = {}) => {
  const { systemPrompt, model } = options;

  try {
    if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
      return await generateWithOpenAI(prompt, systemPrompt);
    } else {
      // Default to Hugging Face
      try {
        return await generateWithHuggingFace(prompt, model);
      } catch (hfError) {
        // Hugging Face failed, but don't throw - let fallback handle it
        console.warn('Hugging Face generation failed, will use fallback:', hfError.message);
        return null;
      }
    }
  } catch (error) {
    // Fallback to rule-based responses if AI fails
    console.warn('AI generation failed, using fallback:', error.message);
    return null;
  }
};

/**
 * AI Prayer Request Helper
 * Suggests improvements or helps structure prayer requests
 */
export const generatePrayerSuggestion = async (userInput, topic = '') => {
  try {
    const prompt = topic 
      ? `Help me write a prayer request about ${topic}. Here's what I want to say: ${userInput}. Provide a well-structured, clear prayer request that expresses my need.`
      : `Help me improve this prayer request to be clear and meaningful: "${userInput}". Provide a better version.`;

    const systemPrompt = 'You are a compassionate assistant helping people write prayer requests for a church community. Be encouraging, clear, and respectful.';

    const suggestion = await generateAI(prompt, { systemPrompt });
    
    if (suggestion) {
      return {
        suggestion,
        error: null,
      };
    }

    // Fallback: Simple rule-based suggestions
    return {
      suggestion: generatePrayerFallback(userInput, topic),
      error: null,
    };
  } catch (error) {
    return {
      suggestion: null,
      error: error.message || 'Failed to generate suggestion. Please try again.',
    };
  }
};

/**
 * Fallback prayer request helper (rule-based)
 */
const generatePrayerFallback = (input, topic) => {
  if (!input || input.trim().length < 10) {
    return `Please share more details about your prayer request. What specific situation or need would you like prayer for?`;
  }

  // Enhanced fallback that creates a better structured prayer
  const topicText = topic ? ` for ${topic}` : '';
  const inputLower = input.toLowerCase();
  
  // Detect common prayer topics and provide structured suggestions
  if (inputLower.includes('heal') || inputLower.includes('sick') || inputLower.includes('health')) {
    return `Please pray${topicText} for healing and restoration. I am trusting God for complete healing and strength during this time. Your prayers for God's healing touch and peace are greatly appreciated.`;
  } else if (inputLower.includes('job') || inputLower.includes('work') || inputLower.includes('employment')) {
    return `Please pray${topicText} for God's guidance and provision in my job search/career. I need wisdom to make the right decisions and favor in finding the right opportunity that aligns with God's will for my life.`;
  } else if (inputLower.includes('family') || inputLower.includes('relationship')) {
    return `Please pray${topicText} for my family and relationships. I need God's wisdom, love, and peace to guide us through this situation. Pray for unity, understanding, and God's blessing on our relationships.`;
  } else if (inputLower.includes('financ') || inputLower.includes('money') || inputLower.includes('provision')) {
    return `Please pray${topicText} for God's provision and financial breakthrough. I trust that God will supply all my needs according to His riches in glory. Your prayers for wisdom and provision are appreciated.`;
  } else if (inputLower.includes('guidance') || inputLower.includes('decision') || inputLower.includes('direction')) {
    return `Please pray${topicText} for God's guidance and direction. I need wisdom and clarity to make the right decisions and to follow God's path for my life.`;
  } else {
    // Generic structured prayer
    return `Please pray${topicText} regarding: ${input}. I would appreciate your prayers for God's intervention, guidance, and peace in this situation. Thank you for standing with me in prayer.`;
  }
};

/**
 * AI Devotional Content Assistant
 * Generates devotional reflection content based on a Bible verse
 */
export const generateDevotionalContent = async (verse, verseText, title = '') => {
  try {
    const prompt = `Write a short devotional reflection (2-3 paragraphs) based on this Bible verse: "${verseText}" (${verse}). The reflection should be encouraging, practical, and help readers apply the verse to their daily lives.`;

    const systemPrompt = 'You are a Christian devotional writer. Write thoughtful, encouraging, and practical reflections that help people grow in their faith.';

    const content = await generateAI(prompt, { systemPrompt });

    if (content) {
      return {
        reflection: content,
        prayer: generatePrayerFromVerse(verse, verseText),
        error: null,
      };
    }

    // Fallback
    return {
      reflection: generateDevotionalFallback(verse, verseText),
      prayer: generatePrayerFromVerse(verse, verseText),
      error: null,
    };
  } catch (error) {
    return {
      reflection: null,
      prayer: null,
      error: error.message || 'Failed to generate content. Please try again.',
    };
  }
};

/**
 * Fallback devotional content generator (enhanced)
 */
const generateDevotionalFallback = (verse, verseText) => {
  const book = verse.split(' ')[0];
  const verseLower = verseText.toLowerCase();
  
  // Create more contextual reflections based on verse content
  let reflection = '';
  
  if (verseLower.includes('love') || verseLower.includes('loved')) {
    reflection = `This powerful verse from ${verse} speaks of God's incredible love for us. "${verseText}" - These words remind us that we are deeply loved and valued by our Creator. Today, let this truth transform how we see ourselves and how we love others. God's love is not conditional or temporary; it is eternal and all-encompassing. As we go about our day, may we remember that we are loved beyond measure, and may that love overflow into our relationships and interactions.`;
  } else if (verseLower.includes('peace') || verseLower.includes('rest')) {
    reflection = `In ${verse}, we find a promise of peace: "${verseText}". In a world filled with anxiety and worry, this verse offers us a refuge. God's peace is not the absence of trouble, but the presence of His comfort and assurance in the midst of it. Today, let us choose to trust in God's peace, knowing that He is in control and that His plans for us are good.`;
  } else if (verseLower.includes('strength') || verseLower.includes('power')) {
    reflection = `The words of ${verse} declare: "${verseText}". This is a reminder that our strength does not come from ourselves, but from God. When we feel weak or overwhelmed, we can draw on His infinite power. Today, let us lean on God's strength rather than our own, trusting that He will carry us through whatever challenges we face.`;
  } else if (verseLower.includes('trust') || verseLower.includes('faith')) {
    reflection = `${verse} encourages us: "${verseText}". Trusting in God requires us to let go of our own understanding and lean on His wisdom. Today, let us practice placing our complete trust in God, knowing that He sees the bigger picture and has our best interests at heart.`;
  } else {
    reflection = `This verse from ${verse} speaks to us today: "${verseText}". As we reflect on these words, let us consider how they apply to our current circumstances. God's Word is living and active, speaking into our lives in meaningful ways. Take a moment to meditate on this truth and ask God to reveal how He wants you to apply it today. Let this scripture guide your thoughts, decisions, and actions as you seek to honor God in all you do.`;
  }
  
  return reflection;
};

/**
 * Generate a prayer based on a Bible verse
 */
const generatePrayerFromVerse = (verse, verseText) => {
  const book = verse.split(' ')[0];
  return `Heavenly Father, thank You for Your Word in ${verse}. Help us to understand and apply this truth in our lives. May this verse guide our thoughts and actions today. In Jesus' name, Amen.`;
};

/**
 * AI Bible Verse Recommender
 * Suggests relevant Bible verses based on a topic or situation
 */
export const suggestBibleVerses = async (topic, situation = '') => {
  try {
    const prompt = situation
      ? `Suggest 3-5 relevant Bible verses for someone dealing with: ${situation}. Topic: ${topic}. Provide verse references and brief explanations.`
      : `Suggest 3-5 relevant Bible verses about ${topic}. Provide verse references and brief explanations.`;

    const systemPrompt = 'You are a Bible study assistant. Suggest relevant, encouraging Bible verses that provide comfort, guidance, and wisdom.';

    const suggestions = await generateAI(prompt, { systemPrompt });

    if (suggestions) {
      return {
        verses: parseVerseSuggestions(suggestions),
        error: null,
      };
    }

    // Fallback: Return common verses by topic
    return {
      verses: getFallbackVerses(topic),
      error: null,
    };
  } catch (error) {
    return {
      verses: getFallbackVerses(topic),
      error: null, // Don't show error, just use fallback
    };
  }
};

/**
 * Parse AI-generated verse suggestions
 */
const parseVerseSuggestions = (text) => {
  // Try to extract verse references (e.g., "John 3:16", "Psalm 23:1")
  const versePattern = /([1-3]?\s?[A-Za-z]+\s+\d+:\d+)/g;
  const matches = text.match(versePattern);
  
  if (matches && matches.length > 0) {
    return matches.slice(0, 5).map(ref => ({
      reference: ref.trim(),
      explanation: 'Suggested verse',
    }));
  }

  return getFallbackVerses('encouragement');
};

/**
 * Fallback verse suggestions by topic
 */
const getFallbackVerses = (topic) => {
  const verseDatabase = {
    healing: [
      { reference: 'Jeremiah 17:14', explanation: 'Prayer for healing' },
      { reference: 'James 5:15', explanation: 'Prayer of faith will heal' },
      { reference: 'Psalm 103:3', explanation: 'God heals all diseases' },
    ],
    encouragement: [
      { reference: 'Philippians 4:13', explanation: 'Strength through Christ' },
      { reference: 'Isaiah 41:10', explanation: 'God is with you' },
      { reference: 'Joshua 1:9', explanation: 'Be strong and courageous' },
    ],
    peace: [
      { reference: 'Philippians 4:7', explanation: 'Peace that surpasses understanding' },
      { reference: 'John 14:27', explanation: 'Peace I give you' },
      { reference: 'Isaiah 26:3', explanation: 'Perfect peace' },
    ],
    guidance: [
      { reference: 'Proverbs 3:5-6', explanation: 'Trust in the Lord' },
      { reference: 'Psalm 32:8', explanation: 'I will guide you' },
      { reference: 'James 1:5', explanation: 'Ask for wisdom' },
    ],
    hope: [
      { reference: 'Romans 15:13', explanation: 'God of hope' },
      { reference: 'Jeremiah 29:11', explanation: 'Plans to prosper you' },
      { reference: 'Psalm 42:11', explanation: 'Put your hope in God' },
    ],
  };

  const normalizedTopic = topic.toLowerCase();
  
  for (const [key, verses] of Object.entries(verseDatabase)) {
    if (normalizedTopic.includes(key)) {
      return verses;
    }
  }

  // Default: return encouragement verses
  return verseDatabase.encouragement;
};

/**
 * Check if AI service is configured
 */
export const isAIConfigured = () => {
  if (AI_PROVIDER === 'openai') {
    return !!OPENAI_API_KEY;
  }
  // Hugging Face works without API key (though slower)
  return true;
};

/**
 * Get AI provider status
 */
export const getAIProviderStatus = () => {
  return {
    provider: AI_PROVIDER,
    configured: isAIConfigured(),
    needsApiKey: AI_PROVIDER === 'openai' && !OPENAI_API_KEY,
  };
};

