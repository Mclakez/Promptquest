export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { sceneDescription } = req.body;
    
    const prompt = `A beautiful, kid-friendly 3D animated style scene of: ${sceneDescription}. Vibrant colors, magical, high quality. No text.`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&nologo=true&seed=${Date.now()}`;

    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Pollinations returned status ${imageResponse.status}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error with Image API:', error);
    res.status(500).json({ error: 'Failed to generate image.' });
  }
}
