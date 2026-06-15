import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Ensure dns resolution prefers IPv4 in certain container environments if needed
dns.setDefaultResultOrder?.("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY missing. AI Assistant responses will be mocked.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Assistant endpoint
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { clientData, question, history } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        text: "Bonjour ! Votre clé `GEMINI_API_KEY` n'est pas encore configurée dans les Secrets d'AI Studio. Pour m'activer pleinement, veuillez l'ajouter. En attendant, voici une réponse simulée d'atelier : D'après les mesures du client, privilégiez des pinces de taille et une coupe ajustée.",
      });
    }

    // Build standard system prompt about tailor métier and technique
    const systemPrompt = `
Tu es l'assistant IA d'un atelier de couture haut de gamme sur mesure ("Atelier Couture").
Tu as deux rôles principaux :
1. Niveau MÉTIER : Conseiller la styliste/couturière sur les mesures, morphologies, patrons, ajustements et techniques de couture (emmanchures, pinces, droit fil/grainline, toile, aplomb, tombé).
2. Niveau TECHNIQUE : Aider au fonctionnement technique du logiciel, l'authentification Google Drive, le format JSON d'export, etc.

Voici les informations sur le client actuellement sélectionné :
${clientData ? JSON.stringify(clientData, null, 2) : "Aucun client sélectionné pour le moment."}

Règles de morphologie :
- A (triangle) : Hanches fortes, épaules plus étroites. Élargir les épaules (épaulettes), éviter pantalons droits, favoriser cols larges et cintrés haut.
- H (rectangle) : Silhouette alignée. Créer de la taille artificielle avec des pinces, ceintures, drapés.
- X (sablier) : Taille très marquée. Valoriser la taille, éviter les coupes trop droites ou volumineuses.
- Y (triangle inversé) : Épaules larges, hanches étroites. Équilibrer vers le bas, jeans flare, coupes trapèzes, pas d'épaulettes.
- O (ronde) : Silhouette galbée. Éviter ceintures serrées à la taille, valoriser les décolletés empire, coupes fluides et verticales.

Réponds uniquement en français de manière claire, professionnelle, et chaleureuse. Utilise le vocabulaire technique de la couture professionnelle (toile d'essai, couturages, aplomb, etc.). Sois constructif et donne des conseils applicables.
`;

    // Format chat history for the Gemini API
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: question }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    res.status(500).json({ error: error.message || "Une erreur est survenue lors de l'appel à l'assistant." });
  }
});

// Setup Vite development server middleware or production static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Atelier Couture Server] Running on port ${PORT}`);
  });
}

startServer();
