import { RouteOption } from "../types";

// 預設的模擬座標數據 (以台北信義區為例)
const MOCK_COORDS = {
  start: { lat: 25.033964, lng: 121.564468 }, // 台北 101
  end: { lat: 25.041530, lng: 121.558366 },   // 國父紀念館附近
  route1_stop1: { lat: 25.035769, lng: 121.561348 }, // 信義廣場
  route1_stop2: { lat: 25.038481, lng: 121.558666 }, // 國父紀念館花園
  route2_stop1: { lat: 25.032969, lng: 121.565985 }, // 象山公園
  route2_stop2: { lat: 25.036000, lng: 121.568000 }, // 松山工農附近
};

export const generateWalkingRoutes = async (
  origin: string,
  destination: string,
  intervalKm: number
): Promise<RouteOption[]> => {
  // 模擬網路延遲，讓體驗更真實
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log(`[模擬模式] 正在規劃從 ${origin} 到 ${destination} 的路線...`);

  // 產生模擬路線 1: 都會漫步
  const route1: RouteOption = {
    id: "route-demo-1",
    name: "都會漫步精華線 (模擬)",
    description: "這是一條模擬的城市散步路線，穿梭於熱鬧的商業區與寧靜的公園之間，適合享受午後時光。",
    totalDistance: "2.5 公里",
    estimatedDuration: "45 分鐘",
    stops: [
      {
        name: origin || "起點 (台北 101)",
        description: "旅程的起點，準備出發。",
        distanceFromPrev: "0 km",
        coordinates: MOCK_COORDS.start,
        type: "start",
      },
      {
        name: "信義廣場",
        description: "位於城市中心的綠地，樹蔭下適合稍作伸展。",
        distanceFromPrev: "0.8 km",
        coordinates: MOCK_COORDS.route1_stop1,
        type: "rest",
      },
      {
        name: "國父紀念館翠湖",
        description: "欣賞湖光倒影，享受片刻寧靜，遠離塵囂。",
        distanceFromPrev: "0.9 km",
        coordinates: MOCK_COORDS.route1_stop2,
        type: "rest",
      },
      {
        name: destination || "終點 (國父紀念館站)",
        description: "抵達目的地，完成今日的步行挑戰！",
        distanceFromPrev: "0.8 km",
        coordinates: MOCK_COORDS.end,
        type: "end",
      },
    ],
  };

  // 產生模擬路線 2: 綠意盎然
  const route2: RouteOption = {
    id: "route-demo-2",
    name: "綠意盎然生態線 (模擬)",
    description: "稍微繞行至附近的公園綠帶，享受更多芬多精，探索城市中的自然角落。",
    totalDistance: "3.2 公里",
    estimatedDuration: "1 小時",
    stops: [
      {
        name: origin || "起點 (台北 101)",
        description: "旅程的起點。",
        distanceFromPrev: "0 km",
        coordinates: MOCK_COORDS.start,
        type: "start",
      },
      {
        name: "象山公園",
        description: "著名的生態公園，運氣好可以看到樹蛙。",
        distanceFromPrev: "0.6 km",
        coordinates: MOCK_COORDS.route2_stop1,
        type: "rest",
      },
      {
        name: "林蔭大道休憩區",
        description: "寬敞的人行道，沿途有許多特色小店與座椅。",
        distanceFromPrev: "1.5 km",
        coordinates: MOCK_COORDS.route2_stop2,
        type: "rest",
      },
      {
        name: destination || "終點 (國父紀念館站)",
        description: "順利抵達。",
        distanceFromPrev: "1.1 km",
        coordinates: MOCK_COORDS.end,
        type: "end",
      },
    ],
  };

  return [route1, route2];
};