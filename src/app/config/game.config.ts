export const CALIFICACION = {
  UMBRAL_EXCELENTE: 90,
  UMBRAL_BUENO: 70,
  UMBRAL_APROBADO: 50,
} as const;

export const TIPOS_PREGUNTA = {
  OPCION_MULTIPLE: 'opcion_multiple',
  VERDADERO_FALSO: 'verdadero_falso',
} as const;

export const MULTIMEDIA = {
  BUCKET_NAME: 'misiones-multimedia',
  AVATAR_BUCKET: 'avatars',
  MAX_FILE_SIZE_MB: 5,
  FORMATOS_PERMITIDOS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const XP = {
  BASE_POR_PREGUNTA: 10,
  BONUS_RAPIDEZ: 1.5,
} as const;

export interface NivelConfig {
  nivel: number;
  nombre: string;
  emoji: string;
  xpMinimo: number;
}

export const NIVELES: NivelConfig[] = [
  { nivel: 1, nombre: 'Novato',        emoji: '🌱', xpMinimo: 0 },
  { nivel: 2, nombre: 'Aprendiz',      emoji: '📚', xpMinimo: 200 },
  { nivel: 3, nombre: 'Explorador',    emoji: '🧭', xpMinimo: 500 },
  { nivel: 4, nombre: 'Guerrero',      emoji: '⚔️', xpMinimo: 1000 },
  { nivel: 5, nombre: 'Estratega',     emoji: '🧠', xpMinimo: 1800 },
  { nivel: 6, nombre: 'Maestro',       emoji: '🎓', xpMinimo: 2800 },
  { nivel: 7, nombre: 'Élite',         emoji: '👑', xpMinimo: 4000 },
  { nivel: 8, nombre: 'Leyenda',       emoji: '🏆', xpMinimo: 5500 },
  { nivel: 9, nombre: 'Mítico',        emoji: '⭐', xpMinimo: 7500 },
  { nivel: 10, nombre: 'Supremo',      emoji: '🔥', xpMinimo: 10000 },
];

export interface TituloConfig {
  titulo: string;
  nivelRequerido: number;
}

export const TITULOS: TituloConfig[] = [
  { titulo: 'Novato',           nivelRequerido: 1 },
  { titulo: 'Aprendiz',         nivelRequerido: 2 },
  { titulo: 'Explorador',       nivelRequerido: 3 },
  { titulo: 'Guerrero',         nivelRequerido: 4 },
  { titulo: 'Estratega',        nivelRequerido: 5 },
  { titulo: 'Maestro',          nivelRequerido: 6 },
  { titulo: 'Élite',            nivelRequerido: 7 },
  { titulo: 'Leyenda',          nivelRequerido: 8 },
  { titulo: 'Mítico',           nivelRequerido: 9 },
  { titulo: 'Supremo',          nivelRequerido: 10 },
];

export const COLORES_NIVEL: Record<number, string> = {
  1: '#94a3b8',
  2: '#60a5fa',
  3: '#34d399',
  4: '#f87171',
  5: '#c084fc',
  6: '#fbbf24',
  7: '#f472b6',
  8: '#fb923c',
  9: '#a78bfa',
  10: '#ef4444',
};

export const MATERIAS = [
  'Matemática',
  'Comunicación',
  'Ciencia y Tecnología',
  'Personal Social',
  'Inglés'
] as const;

export type Materia = typeof MATERIAS[number];
