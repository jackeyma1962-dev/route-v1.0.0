import { GoogleGenAI, Type } from "@google/genai";
import { RouteOption } from "../types";

const processEnvApiKey = process.env.API_KEY;

export const generateWalkingRoutes = async (
  origin: string,
  destination: string,
  intervalKm: number
): Promise<RouteOption[]> => {
  if (!processEnvApiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

  const prompt = `
    請規劃從 "${origin}" 到 "${destination}" 的 2 條截然不同的步行路線。
    
    關鍵指令:
    將每條路線切分為數個站點，每個站點之間的距離大約為 ${intervalKm} 公里。
    第一個站點必須是「起點」，最後一個站點必須是「終點」。
    中間的站點必須是合理的休息地點（例如：公園、咖啡廳、便利商店、著名地標、廣場）。
    
    關於座標 (lat/lng): 請根據地點名稱提供最準確的估計座標。
    
    語言要求:
    所有回傳的內容（名稱、描述、距離）必須使用「繁體中文 (Traditional Chinese)」。
    
    格式要求:
    回傳純 JSON 資料。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of 2 route options",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING, description: "路線名稱，例如：河濱公園景觀路線" },
              description: { type: Type.STRING, description: "路線的簡短氛圍描述" },
              totalDistance: { type: Type.STRING, description: "總距離，例如：5.2 公里" },
              estimatedDuration: { type: Type.STRING, description: "預估時間，例如：1小時 15分" },
              stops: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "為什麼這裡是個好的休息點" },
                    distanceFromPrev: { type: Type.STRING, description: "距離上一站的距離" },
                    type: { type: Type.STRING, enum: ["start", "rest", "end"] },
                    coordinates: {
                      type: Type.OBJECT,
                      properties: {
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER },
                      },
                      required: ["lat", "lng"],
                    },
                  },
                  required: ["name", "description", "distanceFromPrev", "type", "coordinates"],
                },
              },
            },
            required: ["id", "name", "description", "totalDistance", "estimatedDuration", "stops"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data as RouteOption[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("無法產生路線，請稍後再試。");
  }
};