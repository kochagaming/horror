/** 本番素材の差し替え先を一か所に集約するためのアセット台帳。 */
export const ASSETS = {
  cameraPlaceholder: null,
  ambientLoop: null,
  judgementSe: null,
  glitchSe: null,
} as const satisfies Record<string, string | null>;
