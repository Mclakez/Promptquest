import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are Pixel, a friendly, magical robot guide in PromptQuest, an educational adventure game for kids aged 6-12. 
You are going on an adventure with the child. 
Keep your responses short (2-3 sentences), engaging, and safe. 
Always give the child a choice of two things to do next. 
Be highly enthusiastic and descriptive about the magical world.
Do NOT use markdown in your response. Just plain text.`;

app.post('/api/chat', async (req, res) => {
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

    res.json({ message: response.text });
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate response. Please check your API key and try again.' });
  }
});

app.post('/api/image', async (req, res) => {
  try {
    const { sceneDescription } = req.body;
    
    const prompt = `A beautiful, kid-friendly 3D animated style scene of: ${sceneDescription}. Vibrant colors, magical, high quality. No text.`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&nologo=true&seed=${Date.now()}`;

    // Request the image on the server
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Pollinations returned status ${imageResponse.status}`);
    }

    // Convert to buffer using native Node fetch
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send the raw image data back
    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    console.error('Error with Image API:', error);
    res.status(500).json({ error: 'Failed to generate image.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
