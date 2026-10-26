// Afmetingen van het huis (in meter), gedeeld door de scène, het dak en de zonnepanelen.
// Oriëntatie in de scène: +x = zuid (de voorkant met de deur), -x = noord, +z = west, -z = oost.
export const halfWidth = 4.2
export const halfLength = 6
export const wallTop = 4.6
export const roofHeight = 3
export const overhang = 0.5
export const thickness = 0.2

// Dak: twee schuine vlakken die elkaar in de nok (x = 0) ontmoeten
export const angle = Math.atan2(roofHeight, halfWidth)
export const slopeLength = Math.hypot(halfWidth, roofHeight)
export const roofWidth = slopeLength + overhang + 0.1
export const roofLength = halfLength * 2 + 1

// midden van het dakvlak, een halve dikte boven de muur-/gevelrand geschoven
export const roofCenterX = (halfWidth + overhang * Math.cos(angle)) / 2 + (thickness / 2) * Math.sin(angle)
export const roofCenterY =
  (wallTop - overhang * Math.sin(angle) + wallTop + roofHeight) / 2 + (thickness / 2) * Math.cos(angle)

// Positie van de voordeur langs de voorgevel (z)
export const doorZ = 1.8
