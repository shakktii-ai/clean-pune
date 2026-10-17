/**
 * Pune Geographic Bounding Box and PMC Civic Boundary Definitions
 *
 * Pune Municipal Corporation (PMC) Bounding Coordinates:
 * - South: Katraj / Dhayari / Ambegaon southern perimeter (18.4000)
 * - North: Dhanori / Lohegaon / Kalas northern perimeter (18.6400)
 * - West: Bavdhan / Pashan / Baner western perimeter (73.7200)
 * - East: Hadapsar / Kharadi / Wagholi eastern perimeter (73.9900)
 */
export const PUNE_BOUNDS = {
  minLat: 18.4000,
  maxLat: 18.6400,
  minLng: 73.7200,
  maxLng: 73.9900,
};

/**
 * Pune Municipal Corporation (PMC) Viewing Bounding Box
 * Tight geographic rectangle enclosing the verified PMC municipal perimeter
 * used for viewport fitting, pan locking, and zoom constraints.
 */
export const PMC_VIEWING_BOUNDS = {
  minLat: 18.4200, // South of Katraj Lake / Ambegaon Khurd
  maxLat: 18.6300, // North of Dhanori / Kalas / Lohegaon
  minLng: 73.7400, // West of Bavdhan / Sus / Baner
  maxLng: 73.9800, // East of Kharadi / Manjari / Hadapsar
};

/**
 * Verified Pune Municipal Corporation (PMC) Administrative Boundary Polygon
 */
export const PMC_BOUNDARY_POLYGON = [
  [18.5815, 73.8150], // Khadki / Bopodi North
  [18.6040, 73.8560], // Kalas / Alandi Road
  [18.6180, 73.8820], // Dhanori / Tingre Nagar
  [18.5920, 73.9180], // Lohegaon / Airport Road
  [18.5710, 73.9350], // Viman Nagar East
  [18.5520, 73.9550], // Kharadi / Mula-Mutha River
  [18.5250, 73.9650], // Manjari / Mundhwa
  [18.4980, 73.9450], // Hadapsar / Magarpatta
  [18.4720, 73.9180], // Mohammadwadi / Wanowrie
  [18.4420, 73.8920], // Kondhwa Budruk
  [18.4410, 73.8610], // Katraj Lake / Ghat
  [18.4520, 73.8280], // Ambegaon Pathar
  [18.4680, 73.8050], // Dhayari / Vadgaon Budruk
  [18.4890, 73.7910], // Warje Malwadi
  [18.5080, 73.7850], // Kothrud / Karve Road
  [18.5280, 73.7720], // Bavdhan / Chandani Chowk
  [18.5520, 73.7740], // Pashan Lake
  [18.5720, 73.7880], // Baner / Balewadi
  [18.5680, 73.8050], // Aundh
];

/**
 * Validate whether latitude and longitude are within configured Pune municipal boundaries.
 * @param {number|string} lat
 * @param {number|string} lng
 * @returns {boolean}
 */
export function isWithinPune(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return false;
  return (
    numLat >= PUNE_BOUNDS.minLat &&
    numLat <= PUNE_BOUNDS.maxLat &&
    numLng >= PUNE_BOUNDS.minLng &&
    numLng <= PUNE_BOUNDS.maxLng
  );
}
