import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are Pixel, a friendly, magical robot guide in PromptQuest, an educational adventure game for kids aged 6-12. 
You are going on an adventure with the child. 
Keep your responses short (2-3 sentences), engaging, and safe. 
Always give the child a choice of two things to do next. 
Be highly enthusiastic and descriptive about the magical world.
Do NOT use markdown in your response. Just plain text.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { history, userMessage } = req.body;
    
    const contents = history.map(msg => ({
      role: msg.sender === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));
    
    if (userMessage) {
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
        },
        temperature: 0.7,
      }
    });

    res.status(200).json({ message: response.text });
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate response. Please check your API key and try again.' });
  }
}
