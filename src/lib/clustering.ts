import { Incident, HotspotCluster, OverpassElement } from '@/types';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * DBSCAN-based Spatial Incident Clustering with Epsilon = 0.5km (500m) and MinPts = 2.
 */
export function clusterIncidents(
  incidents: Incident[],
  userLat: number,
  userLng: number,
  touristPoints: OverpassElement[] = [],
  epsilonKm: number = 0.5,
  minPts: number = 2
): HotspotCluster[] {
  const visited = new Set<string>();
  const clusteredIds = new Set<string>();
  const rawClusters: Incident[][] = [];

  // Helper to find all neighbors within epsilon
  const getNeighbors = (target: Incident): Incident[] => {
    return incidents.filter(
      (other) =>
        calculateHaversineDistance(target.lat, target.lng, other.lat, other.lng) <= epsilonKm
    );
  };

  for (const incident of incidents) {
    if (visited.has(incident.id)) continue;
    visited.add(incident.id);

    const neighbors = getNeighbors(incident);

    if (neighbors.length >= minPts) {
      // Create new cluster
      const currentCluster: Incident[] = [incident];
      clusteredIds.add(incident.id);

      const queue = [...neighbors.filter((n) => n.id !== incident.id)];

      while (queue.length > 0) {
        const neighbor = queue.shift()!;
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          const nextNeighbors = getNeighbors(neighbor);
          if (nextNeighbors.length >= minPts) {
            for (const nn of nextNeighbors) {
              if (!queue.some((q) => q.id === nn.id) && !clusteredIds.has(nn.id)) {
                queue.push(nn);
              }
            }
          }
        }
        if (!clusteredIds.has(neighbor.id)) {
          clusteredIds.add(neighbor.id);
          currentCluster.push(neighbor);
        }
      }

      rawClusters.push(currentCluster);
    }
  }

  // Also include isolated incidents as single-incident clusters for comprehensive visibility
  for (const incident of incidents) {
    if (!clusteredIds.has(incident.id)) {
      rawClusters.push([incident]);
    }
  }

  // Convert raw clusters into rich HotspotCluster objects with Urgency Scores
  return rawClusters.map((clusterGroup, index) => {
    // Calculate centroid
    const centerLat =
      clusterGroup.reduce((acc, inc) => acc + inc.lat, 0) / clusterGroup.length;
    const centerLng =
      clusterGroup.reduce((acc, inc) => acc + inc.lng, 0) / clusterGroup.length;

    const clusterId = `cluster-${index + 1}`;
    clusterGroup.forEach((inc) => (inc.clusterId = clusterId));

    // Sum and maximum of severity ratings
    const totalSeverity = clusterGroup.reduce((acc, inc) => acc + inc.severity, 0);
    const maxSeverity = Math.max(...clusterGroup.map((i) => i.severity || 1));

    // Nearby tourist hotspots within 1km of cluster center
    const nearbyTourists = touristPoints.filter((poi) => {
      const lon = poi.lon ?? poi.lng;
      if (typeof poi.lat !== 'number' || isNaN(poi.lat) || typeof lon !== 'number' || isNaN(lon)) return false;
      return calculateHaversineDistance(centerLat, centerLng, poi.lat, lon) <= 1.0;
    });

    // Distance from user to cluster centroid
    const distanceKm = calculateHaversineDistance(
      userLat,
      userLng,
      centerLat,
      centerLng
    );

    // Determine waterbody type from incident tags or context
    const hasRiver = clusterGroup.some((i) =>
      (i.waterbodyName || '').toLowerCase().includes('river') ||
      (i.waterbodyName || '').toLowerCase().includes('ghat')
    );
    const hasWetland = clusterGroup.some((i) =>
      (i.waterbodyName || '').toLowerCase().includes('wetland')
    );
    const hasLake = clusterGroup.some((i) =>
      (i.waterbodyName || '').toLowerCase().includes('lake')
    );
    const waterbodyType: 'river' | 'lake' | 'canal' | 'wetland' = hasRiver
      ? 'river'
      : hasWetland
      ? 'wetland'
      : hasLake
      ? 'lake'
      : 'canal';

    // Compute Urgency & Impact Score (0 to 100)
    // Formula: Score = min(100, (wr * sum(S_i)) + (wt * T_footfall) + (ww * W_type) - (wd * Distance))
    const wr = 8;
    const severityFactor = wr * totalSeverity;

    let wt = 0;
    if (nearbyTourists.length >= 2) {
      wt = 15; // High tourist footprint
    } else if (nearbyTourists.length === 1) {
      wt = 10; // Moderate tourist footprint
    }

    let ww = 10; // canal default
    if (waterbodyType === 'river') ww = 20;
    else if (waterbodyType === 'lake' || waterbodyType === 'wetland') ww = 15;

    const wd = 1.5;
    const distanceDecay = wd * Math.min(distanceKm, 20); // cap decay at 20km

    let rawScore = severityFactor + wt + ww - distanceDecay;

    // Severity-driven priority normalization:
    // A hazardous or severe hotspot (Level 5 or 4) must NEVER be demoted to low/moderate by distance decay.
    if (maxSeverity >= 5) {
      rawScore = Math.max(rawScore, 85);
    } else if (maxSeverity >= 4) {
      rawScore = Math.max(rawScore, 72);
    }

    const urgencyScore = Math.max(5, Math.min(100, Math.round(rawScore)));

    let urgencyLevel: 'critical' | 'moderate' | 'low' = 'low';
    if (urgencyScore >= 70 || maxSeverity >= 4) urgencyLevel = 'critical';
    else if (urgencyScore >= 40 || maxSeverity >= 3) urgencyLevel = 'moderate';

    // Cluster title
    const mainIncident = clusterGroup[0];
    const name =
      clusterGroup.length > 1
        ? `${mainIncident.waterbodyName || 'Waterway'} Cluster (${clusterGroup.length} Reports)`
        : mainIncident.title;

    // Friendly cleaning time & volunteer estimation
    const hasChemicalHazmat = clusterGroup.some((i) => i.severity === 5 || i.category === 'Sewage / Chemical Inflow');
    const estimatedTimeHours = Number(
      (clusterGroup.reduce((acc, i) => acc + (i.cleanTimeHours || 2.0), 0) / clusterGroup.length).toFixed(1)
    );
    const volunteersRecommended = Math.max(
      8,
      Math.min(30, clusterGroup.reduce((acc, i) => acc + (i.volunteersNeeded || 10), 0))
    );
    const primaryAction = hasChemicalHazmat
      ? 'Municipal Intervention + Perimeter Shore Sweep'
      : 'Volunteer Community Riverbank Cleanup';
    const howToCleanSummary =
      mainIncident.howToClean ||
      (hasChemicalHazmat
        ? 'Maintain 5m safety perimeter from dark inflow. Deploy trash boom and clear dry shoreline plastics.'
        : 'Form volunteer sweep line along the bank. Collect plastic bottles and packaging using grabbers into heavy gunny bags.');

    const gearNeededSummary = mainIncident.gearNeeded || [
      'Heavy-duty gloves',
      'Trash grabbers',
      'Gunny sacks',
      'First aid kit',
    ];

    return {
      id: clusterId,
      name,
      center: { lat: centerLat, lng: centerLng },
      incidents: clusterGroup,
      totalSeverity,
      touristAttractionsNear: nearbyTourists,
      waterbodyType,
      urgencyScore,
      urgencyLevel,
      distanceKm: Number(distanceKm.toFixed(2)),
      estimatedTimeHours,
      volunteersRecommended,
      primaryAction,
      howToCleanSummary,
      gearNeededSummary,
    };
  }).sort((a, b) => b.urgencyScore - a.urgencyScore);
}
