
import { GoogleGenAI, Type } from "@google/genai";
import { Biome, GameChallenge } from "../types";

const BIOME_DETAILS: Record<Biome, { animal: string; environment: string; texture: string; hiding: string }> = {
  [Biome.TUNDRA]: {
    animal: 'Snow Leopard',
    environment: 'A vast, dramatic Himalayan mountain slope at dawn — jagged granite outcrops dusted with fresh powder snow, pale lichen-covered boulders, thin wisps of cloud threading between peaks, blue-grey shadows in the crevices',
    texture: 'granite, snow, and lichen patterns',
    hiding: 'pressed flat against a rocky ledge, its pale rosette-patterned fur indistinguishable from the lichen-mottled stone, partially behind a boulder with only parts of its body visible'
  },
  [Biome.RAINFOREST]: {
    animal: 'Leaf-Tailed Gecko',
    environment: 'Dense tropical rainforest interior — enormous moss-covered tree trunks with peeling bark, tangled aerial roots, dappled light filtering through the canopy, decomposing leaves on the forest floor, ferns and epiphytes covering every surface',
    texture: 'bark, moss, and decomposing leaves',
    hiding: 'flattened motionless against a tree trunk, its fringe-edged body eliminating any shadow line, its skin texture perfectly replicating the bark and moss pattern it rests on'
  },
  [Biome.DESERT]: {
    animal: 'Saharan Sand Viper',
    environment: 'An expansive desert dune field at golden hour — wind-sculpted ripples in fine sand, scattered sun-bleached pebbles, heat shimmer in the distance, subtle shadow gradients across the dune faces, a few dry desert scrub plants',
    texture: 'sand grains, ripple patterns, and pebbles',
    hiding: 'partially buried in the sand with only the top of its head and eyes visible, its sand-colored keeled scales identical to the surrounding grains, positioned off to one side near some pebbles'
  },
  [Biome.WOODLAND]: {
    animal: 'Tawny Frogmouth',
    environment: 'Australian eucalyptus woodland in soft overcast light — weathered grey-white eucalyptus trunks with strips of peeling bark, broken dead branches, grey-green leaf litter, patches of dry bark on the ground',
    texture: 'dead wood, peeling bark, and broken branch stumps',
    hiding: 'perched motionless on a broken branch with its head tilted up, eyes closed to slits, its streaked grey-brown plumage perfectly mimicking the bark and branch stub it sits on — it looks like part of the tree'
  },
  [Biome.SAVANNA]: {
    animal: 'Cheetah',
    environment: 'African savanna grassland in the late afternoon — tall dry golden grass swaying slightly, scattered acacia trees in the distance, warm amber light casting long shadows, patches of shorter brown grass and bare earth',
    texture: 'dry grass stalks, seed heads, and dappled grass shadows',
    hiding: 'lying low in the tall grass with only parts of its spotted body visible through the grass stalks, its dappled coat pattern blending with the grass shadows and seed heads, not obviously centered in the frame'
  },
};

export class GeminiService {
  private static async getAI() {
    return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  }

  static async generateExpedition(biome: Biome, isUltraHD: boolean = false): Promise<GameChallenge> {
    const ai = await this.getAI();
    const { animal, environment, texture, hiding } = BIOME_DETAILS[biome];
    
    const generationPrompt = `A breathtaking, award-winning nature photograph. ${environment}. The image should be visually spectacular on its own as landscape photography.

Hidden within this scene is a single ${animal}, ${hiding}. The animal MUST be genuinely difficult to spot — it should take a viewer real effort to locate it. Its body textures (fur, scales, feathers) must match the surrounding ${texture} so closely that it almost disappears. The animal should NOT be centered in the frame, should NOT be obviously the focal point, and should NOT look digitally composited onto the scene. Lighting direction, depth of field, and shadow angles on the animal must be physically consistent with the rest of the environment. The animal is in its real natural habitat doing what it naturally does to avoid detection.

Photorealistic. Shot on a professional telephoto lens. National Geographic quality.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: generationPrompt }] },
      config: { 
        imageConfig: { 
          aspectRatio: "16:9", 
          imageSize: isUltraHD ? "4K" : "1K" 
        } 
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    if (!imageUrl) throw new Error("Generation Error");

    // Step 2: Contextual Verification & Narrativization
    const verificationResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: imageUrl.split(',')[1], mimeType: 'image/png' } },
          { text: `ANALYZE IMAGE: Locate the ${animal}. 
          Return a JSON object with a bounding box using percentage values on a 0-100 scale (e.g. top: 25 means 25% from the top), a 2-sentence 'Field Brief' for a tactical commander, 
          3 tactical hints (progressive difficulty), and a biological camouflage fact.` }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            boundingBox: {
              type: Type.OBJECT,
              properties: {
                top: { type: Type.NUMBER },
                left: { type: Type.NUMBER },
                width: { type: Type.NUMBER },
                height: { type: Type.NUMBER }
              },
              required: ['top', 'left', 'width', 'height']
            },
            fieldBrief: { type: Type.STRING },
            hints: { type: Type.ARRAY, items: { type: Type.STRING } },
            natureFact: { type: Type.STRING }
          },
          required: ['boundingBox', 'fieldBrief', 'hints', 'natureFact']
        }
      }
    });

    const data = JSON.parse(verificationResponse.text || '{}');
    
    // Normalize bounding box to 0-100 percentage scale
    // Gemini sometimes returns 0-1 scale instead of 0-100
    if (data.boundingBox) {
      const bb = data.boundingBox;
      if (bb.top <= 1 && bb.left <= 1 && bb.width <= 1 && bb.height <= 1) {
        bb.top *= 100;
        bb.left *= 100;
        bb.width *= 100;
        bb.height *= 100;
      }
    }
    
    return { imageUrl, animal, biome, ...data, timestamp: Date.now(), isUltraHD };
  }
}
