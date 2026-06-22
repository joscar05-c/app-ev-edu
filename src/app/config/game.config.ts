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
  MAX_FILE_SIZE_MB: 5,
  FORMATOS_PERMITIDOS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const XP = {
  BASE_POR_PREGUNTA: 10,
  BONUS_RAPIDEZ: 1.5,
} as const;
