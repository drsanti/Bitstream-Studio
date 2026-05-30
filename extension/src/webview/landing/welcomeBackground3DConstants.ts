/*******************************************************************************
 * File Name : welcomeBackground3DConstants.ts
 *
 * Description : Tunables for the ported WelcomeBackground3D R3F scene.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/** Balanced grid (v1 used 50×30; reduced for webview). */
export const WELCOME_BG3D_FLOOR_COLS = 32;
export const WELCOME_BG3D_FLOOR_ROWS = 20;

export const WELCOME_BG3D_CUBE_SIZE = { x: 0.55, y: 0.2, z: 0.55 } as const;
export const WELCOME_BG3D_CUBE_GAP = 0.08;
export const WELCOME_BG3D_CUBE_BASE_Y = 0.12;
export const WELCOME_BG3D_CUBE_SCALE_Y = 0.9;

export const WELCOME_BG3D_SCENE_BACKGROUND = 0x050814;

export const WELCOME_BG3D_CAMERA_FROM: [number, number, number] = [0, 10, 10];
export const WELCOME_BG3D_CAMERA_LOOK_AT: [number, number, number] = [0, 0.4, 0];
