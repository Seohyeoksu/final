export const TIMING = {
  FLIGHT_DURATION: 2500,
  DISPLAY_DURATION: 12000,
  FADE_OUT_DURATION: 3000,
  LAUNCH_INTERVAL: 300,
  AUTO_LAUNCH_INTERVAL: 500,
};

export const STAR_GRADIENTS = [
  'radial-gradient(circle, #FFF9C4 0%, #FFD54F 70%, #FFC107 100%)',
  'radial-gradient(circle, #E1F5FE 0%, #81D4FA 70%, #29B6F6 100%)',
  'radial-gradient(circle, #F3E5F5 0%, #CE93D8 70%, #AB47BC 100%)',
  'radial-gradient(circle, #FFF3E0 0%, #FFCC80 70%, #FF9800 100%)',
  'radial-gradient(circle, #E8F5E9 0%, #A5D6A7 70%, #66BB6A 100%)',
];

export const PHYSICS_CONFIG = {
  GRAVITY_Y: 0.5,
  RESTITUTION: 0.5,
  FRICTION: 0.001,
  FRICTION_AIR: 0.001,
  MIN_RADIUS: 30,
  MAX_RADIUS: 75,
  LAUNCH_ANGLE_MIN: 20,
  LAUNCH_ANGLE_MAX: 160,
  LAUNCH_FORCE_MIN: 0.3,
  LAUNCH_FORCE_MAX: 0.5,
  FIX_VELOCITY_THRESHOLD: 0.5,
};
