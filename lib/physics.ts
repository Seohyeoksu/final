'use client';

import Matter from 'matter-js';
import { Message } from '@/types/message';
import { PHYSICS_CONFIG } from './constants';

export interface StarData {
  id: string;
  name: string;
  message: string;
  color: string;
  body: Matter.Body;
  launchedAt: number;
  fixedAt: number | null;
}

export const createPhysicsWorld = (canvas: HTMLCanvasElement) => {
  const engine = Matter.Engine.create();
  engine.gravity.y = PHYSICS_CONFIG.GRAVITY_Y;

  const render = Matter.Render.create({
    canvas,
    engine,
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      wireframes: false,
      background: 'transparent',
    },
  });

  // Create walls (top, bottom, left, right)
  const walls = [
    Matter.Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 25,
      window.innerWidth,
      50,
      { isStatic: true, label: 'bottom-wall' }
    ),
    Matter.Bodies.rectangle(
      window.innerWidth / 2,
      -25,
      window.innerWidth,
      50,
      { isStatic: true, label: 'top-wall' }
    ),
    Matter.Bodies.rectangle(
      -25,
      window.innerHeight / 2,
      50,
      window.innerHeight,
      { isStatic: true, label: 'left-wall' }
    ),
    Matter.Bodies.rectangle(
      window.innerWidth + 25,
      window.innerHeight / 2,
      50,
      window.innerHeight,
      { isStatic: true, label: 'right-wall' }
    ),
  ];

  Matter.World.add(engine.world, walls);

  return { engine, render };
};

export const launchStar = (
  engine: Matter.Engine,
  x: number,
  y: number,
  messageData: Message,
  color: string
): StarData => {
  const radius = Math.min(
    PHYSICS_CONFIG.MAX_RADIUS,
    Math.max(PHYSICS_CONFIG.MIN_RADIUS, messageData.message.length * 0.8)
  );

  const star = Matter.Bodies.circle(x, y, radius, {
    restitution: PHYSICS_CONFIG.RESTITUTION,
    friction: PHYSICS_CONFIG.FRICTION,
    frictionAir: PHYSICS_CONFIG.FRICTION_AIR,
    label: `star-${messageData.id}`,
  });

  // Random launch angle between 30-150 degrees
  const angle =
    (PHYSICS_CONFIG.LAUNCH_ANGLE_MIN +
      Math.random() *
        (PHYSICS_CONFIG.LAUNCH_ANGLE_MAX - PHYSICS_CONFIG.LAUNCH_ANGLE_MIN)) *
    (Math.PI / 180);

  const force =
    PHYSICS_CONFIG.LAUNCH_FORCE_MIN +
    Math.random() * (PHYSICS_CONFIG.LAUNCH_FORCE_MAX - PHYSICS_CONFIG.LAUNCH_FORCE_MIN);

  Matter.Body.applyForce(star, star.position, {
    x: Math.cos(angle) * force,
    y: -Math.sin(angle) * force,
  });

  Matter.Body.setAngularVelocity(star, (Math.random() - 0.5) * 0.3);

  Matter.World.add(engine.world, star);

  return {
    id: messageData.id,
    name: messageData.name,
    message: messageData.message,
    color,
    body: star,
    launchedAt: Date.now(),
    fixedAt: null,
  };
};

export const fixStar = (star: StarData) => {
  Matter.Body.setStatic(star.body, true);
  Matter.Body.setAngularVelocity(star.body, 0);
  star.fixedAt = Date.now();
};

export const shouldFixStar = (star: StarData): boolean => {
  const velocity = Matter.Body.getVelocity(star.body);
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
  return (
    speed < PHYSICS_CONFIG.FIX_VELOCITY_THRESHOLD ||
    Date.now() - star.launchedAt > 2500
  );
};

export const shouldRemoveStar = (star: StarData): boolean => {
  return star.fixedAt !== null && Date.now() - star.fixedAt > 12000;
};

export const removeStar = (engine: Matter.Engine, star: StarData) => {
  Matter.World.remove(engine.world, star.body);
};
