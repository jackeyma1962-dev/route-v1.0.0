import { RouteOption, Coordinate, RouteStop } from "../types";

// 使用 OpenStreetMap Nominatim API 進行地理編碼
async function getCoordinates(query: string): Promise<{ lat: number; lng: number; name: string; displayName: string } | null> {
  try {
    // 1. 增加 limit=5 以獲取更多候選地點
    // 2. 加入 accept-language=zh-HK,zh-TW 以優化繁體中文搜尋
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=zh-HK,zh-TW,en`
    );
    if (!response.ok) throw new Error("Geocoding fetch failed");
    const data = await response.json();
    
    if (data && data.length > 0) {
      // === 關鍵修改：優先篩選香港 (hk) 的結果 ===
      // 如果搜尋結果中有香港地點，優先使用；否則使用第一個結果（預設行為）
      const hkResult = data.find((item: any) => item.address && item.address.country_code === 'hk');
      const result = hkResult || data[0];

      const addr = result.address || {};
      // 建構簡短名稱：優先使用旅遊景點、建築物名、或地名
      const shortName = addr.tourism || addr.building || addr.amenity || addr.shop || addr.leisure || addr.road || addr.suburb || result.name || query;
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: shortName, // 簡短名稱
        displayName: result.display_name // 完整名稱 (含地址)
      };
    }
    return null;
  } catch (error) {
    console.warn(`Geocoding failed for ${query}:`, error);
    return null;
  }
}

// 逆向地理編碼：將座標轉為路名
async function getLocationName(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-HK,zh-TW`
    );
    if (!response.ok) return "途中休息點";
    const data = await response.json();
    if (data && data.address) {
      // 嘗試回傳最具代表性的名稱
      return data.address.tourism || 
             data.address.building || 
             data.address.amenity || 
             data.address.shop || 
             data.address.road || 
             data.address.pedestrian || 
             data.address.park || 
             data.address.suburb || 
             "未知路段";
    }
    return "步行路徑上";
  } catch {
    return "途中";
  }
}

// OSRM 相關介面
interface OSRMResponse {
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    distance: number;
    duration: number;
  }>;
}

// 嘗試使用 OSRM 取得路徑 (優先使用德國伺服器，失敗則回傳 null)
async function getWalkingRouteFromOSRM(start: Coordinate, end: Coordinate): Promise<{ coordinates: Coordinate[], totalDistance: number, totalDuration: number } | null> {
  const servers = [
    `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`,
    `https://router.project-osrm.org/route/v1/walking/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
  ];

  for (const url of servers) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          return {
            coordinates: route.geometry.coordinates.map((p: number[]) => ({ lat: p[1], lng: p[0] })),
            totalDistance: route.distance,
            totalDuration: route.duration
          };
        }
      }
    } catch (e) {
      console.warn("OSRM server error:", e);
    }
  }
  return null;
}

// 計算兩點距離 (Haversine formula, 回傳公里)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getDistMeters(c1: Coordinate, c2: Coordinate) {
    const R = 6371e3; 
    const φ1 = c1.lat * Math.PI/180;
    const φ2 = c2.lat * Math.PI/180;
    const Δφ = (c2.lat-c1.lat) * Math.PI/180;
    const Δλ = (c2.lng-c1.lng) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function interpolatePoints(start: Coordinate, end: Coordinate, count: number): Coordinate[] {
  const points: Coordinate[] = [];
  for (let i = 1; i <= count; i++) {
    const fraction = i / (count + 1);
    points.push({
      lat: start.lat + (end.lat - start.lat) * fraction,
      lng: start.lng + (end.lng - start.lng) * fraction
    });
  }
  return points;
}

// --- 主函數 ---

export const generateWalkingRoutes = async (
  origin: string,
  destination: string,
  intervalKm: number
): Promise<RouteOption[]> => {
  
  // 1. 解析起終點
  const isCoordinate = (str: string) => /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(str.trim());
  let startLocation, endLocation;

  // 處理起點
  if (isCoordinate(origin)) {
      const [lat, lng] = origin.split(',').map(Number);
      const name = await getLocationName(lat, lng);
      startLocation = { lat, lng, name: "目前位置", displayName: name };
  } else {
      startLocation = await getCoordinates(origin);
  }

  // 處理終點
  if (isCoordinate(destination)) {
      const [lat, lng] = destination.split(',').map(Number);
      const name = await getLocationName(lat, lng);
      endLocation = { lat, lng, name: "指定目的地", displayName: name };
  } else {
      endLocation = await getCoordinates(destination);
  }

  // 錯誤處理
  if (!startLocation || !endLocation) {
    throw new Error("無法找到地點。請嘗試輸入更完整的名稱 (例如：香港中環、旺角)。");
  }

  // 2. 嘗試 OSRM 路徑規劃
  const routeData = await getWalkingRouteFromOSRM(
    { lat: startLocation.lat, lng: startLocation.lng },
    { lat: endLocation.lat, lng: endLocation.lng }
  );

  // 3. 計算路徑與休息點
  const stops: RouteStop[] = [];

  // 加入起點
  stops.push({
    name: startLocation.name,
    description: "旅程起點",
    distanceFromPrev: "0 km",
    coordinates: { lat: startLocation.lat, lng: startLocation.lng },
    type: "start"
  });

  if (routeData) {
    // === 策略 A: OSRM 成功 ===
    const intervalMeters = intervalKm * 1000;
    let distanceCovered = 0;
    let nextStopTarget = intervalMeters;
    const path = routeData.coordinates;

    for (let i = 0; i < path.length - 1; i++) {
        const segmentDist = getDistMeters(path[i], path[i+1]);
        if (distanceCovered + segmentDist >= nextStopTarget) {
            if (nextStopTarget < routeData.totalDistance - 500) {
                 // 限制反查數量
                 let locationName = "休息點";
                 if (stops.length < 10) {
                    locationName = await getLocationName(path[i+1].lat, path[i+1].lng);
                 }

                 stops.push({
                    name: locationName,
                    description: `距離起點約 ${(nextStopTarget/1000).toFixed(1)} km`,
                    distanceFromPrev: `${intervalKm} km`,
                    coordinates: path[i+1],
                    type: "rest"
                });
                nextStopTarget += intervalMeters;
            }
        }
        distanceCovered += segmentDist;
    }

    // 加入終點
    stops.push({
      name: endLocation.name,
      description: "旅程終點",
      distanceFromPrev: `${((routeData.totalDistance - (stops.length - 1) * intervalMeters)/1000).toFixed(1)} km`,
      coordinates: { lat: endLocation.lat, lng: endLocation.lng },
      type: "end"
    });

    return [{
      id: "route-osrm",
      name: "最佳步行路線",
      description: `全程 ${(routeData.totalDistance/1000).toFixed(1)} 公里，沿途經過真實道路。`,
      totalDistance: `${(routeData.totalDistance/1000).toFixed(1)} km`,
      estimatedDuration: `${Math.ceil(routeData.totalDuration / 60)} 分`,
      stops: stops,
      path: path
    }];

  } else {
    // === 策略 B: OSRM 失敗 (Fallback) ===
    const totalDistKm = getDistanceFromLatLonInKm(startLocation.lat, startLocation.lng, endLocation.lat, endLocation.lng);
    let numStops = Math.floor(totalDistKm / intervalKm);
    if (numStops > 8) numStops = 8;
    if (numStops < 0) numStops = 0;

    const intermediatePoints = interpolatePoints(
      { lat: startLocation.lat, lng: startLocation.lng },
      { lat: endLocation.lat, lng: endLocation.lng },
      numStops
    );

    intermediatePoints.forEach((coord, idx) => {
      stops.push({
        name: `休息點 ${idx + 1}`,
        description: `(直線估算) 建議休息`,
        distanceFromPrev: `${intervalKm} km`,
        coordinates: coord,
        type: "rest"
      });
    });

    // 加入終點
    stops.push({
      name: endLocation.name,
      description: "旅程終點",
      distanceFromPrev: `${(totalDistKm - numStops * intervalKm).toFixed(1)} km`,
      coordinates: { lat: endLocation.lat, lng: endLocation.lng },
      type: "end"
    });

    return [{
      id: "route-fallback",
      name: "直線參考路線",
      description: `導航服務暫時無法使用，已為您計算直線距離與建議休息點。`,
      totalDistance: `約 ${totalDistKm.toFixed(1)} km`,
      estimatedDuration: `約 ${Math.round(totalDistKm * 15)} 分`,
      stops: stops,
    }];
  }
};