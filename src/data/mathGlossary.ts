/**
 * Glosario de términos matemáticos catalán–castellano (PIT-21).
 *
 * Este es el ÚNICO archivo con el vocabulario: la familia revisa aquí los
 * términos, definiciones y ejemplos. Las definiciones y ejemplos se muestran
 * en castellano; cada entrada lleva el término en los dos idiomas.
 *
 * Reglas al editar:
 *  - `id`: único, en minúsculas ASCII con guiones. No renombrar IDs sin
 *    actualizar OPERATION_GLOSSARY_TERMS en `src/utils/glossary.ts`.
 *  - `es`/`ca`: ortografía correcta en cada idioma (la búsqueda ya ignora
 *    mayúsculas y tildes, no hace falta duplicar variantes).
 *  - `related`: IDs de términos que se confunden entre sí o conviene
 *    consultar juntos (aparecen como «Ver también» en la ficha).
 */
export interface GlossaryTerm {
  id: string;
  /** Término en castellano. */
  es: string;
  /** Término en catalán. */
  ca: string;
  /** Definición breve en castellano. */
  definition: string;
  /** Ejemplo corto en castellano. */
  example: string;
  /** IDs de términos relacionados o que se confunden con este. */
  related?: string[];
}

export const MATH_GLOSSARY: GlossaryTerm[] = [
  // — Operaciones y división —
  {
    id: 'dividendo-divisor',
    es: 'dividendo y divisor',
    ca: 'dividend i divisor',
    definition:
      'En una división, el dividendo es la cantidad que se reparte y el divisor es el número de partes.',
    example: 'En 42 ÷ 6 = 7, el dividendo es 42 y el divisor es 6.',
    related: ['cociente', 'resto'],
  },
  {
    id: 'cociente',
    es: 'cociente',
    ca: 'quocient',
    definition: 'El resultado de una división.',
    example: 'En 42 ÷ 6 = 7, el cociente es 7.',
    related: ['dividendo-divisor'],
  },
  {
    id: 'resto',
    es: 'resto',
    ca: 'residu',
    definition: 'Lo que sobra en una división no exacta. Siempre es menor que el divisor.',
    example: '45 ÷ 6 = 7 y resto 3, porque 6 × 7 + 3 = 45.',
    related: ['cociente'],
  },
  {
    id: 'numero-primo',
    es: 'número primo',
    ca: 'nombre primer',
    definition: 'Número que solo se puede dividir exactamente entre 1 y él mismo.',
    example: '7 es primo; 8 no lo es (8 = 2 × 4).',
    related: ['descomposicion-factores'],
  },
  {
    id: 'descomposicion-factores',
    es: 'descomposición en factores primos',
    ca: 'descomposició en factors primers',
    definition: 'Escribir un número como una multiplicación de números primos.',
    example: '12 = 2 × 2 × 3.',
    related: ['numero-primo', 'mcd'],
  },
  {
    id: 'mcd',
    es: 'máximo común divisor (MCD)',
    ca: 'màxim comú divisor (mcd)',
    definition: 'El mayor número que divide exactamente a varios números a la vez.',
    example: 'MCD(12, 18) = 6.',
    related: ['mcm'],
  },
  {
    id: 'mcm',
    es: 'mínimo común múltiplo (MCM)',
    ca: 'mínim comú múltiple (mcm)',
    definition: 'El menor múltiplo que tienen en común varios números.',
    example: 'MCM(4, 6) = 12.',
    related: ['mcd'],
  },
  // — Tipos de número —
  {
    id: 'numero-entero',
    es: 'número entero',
    ca: 'nombre enter',
    definition: 'Número sin decimales; puede ser positivo, negativo o cero.',
    example: '…, −2, −1, 0, 1, 2, …',
    related: ['numero-decimal'],
  },
  {
    id: 'numero-decimal',
    es: 'número decimal',
    ca: 'nombre decimal',
    definition: 'Número con coma decimal: tiene parte entera y parte decimal.',
    example: '3,5 está entre 3 y 4.',
    related: ['numero-entero'],
  },
  {
    id: 'valor-posicional',
    es: 'valor posicional',
    ca: 'valor posicional',
    definition: 'Lo que vale una cifra según el lugar que ocupa en el número.',
    example: 'En 345, el 4 vale 40 porque está en las decenas.',
  },
  {
    id: 'redondeo',
    es: 'redondeo',
    ca: 'arrodoniment',
    definition: 'Sustituir un número por el más cercano de una decena, centena o decimal.',
    example: '47 redondeado a las decenas es 50; 43 es 40.',
  },
  {
    id: 'secuencia',
    es: 'secuencia',
    ca: 'seqüència',
    definition: 'Lista ordenada de números que siguen un patrón.',
    example: '2, 4, 6, 8, … suma 2 cada vez.',
  },
  // — Potencias —
  {
    id: 'potencia',
    es: 'potencia',
    ca: 'potència',
    definition: 'Multiplicar la base por sí misma tantas veces como dice el exponente.',
    example: '2³ = 2 × 2 × 2 = 8.',
    related: ['exponente', 'raiz-cuadrada'],
  },
  {
    id: 'exponente',
    es: 'exponente',
    ca: 'exponent',
    definition: 'El número pequeño de una potencia: indica cuántas veces se multiplica la base.',
    example: 'En 2³ el exponente es 3 y la base es 2.',
    related: ['potencia'],
  },
  {
    id: 'raiz-cuadrada',
    es: 'raíz cuadrada',
    ca: 'arrel quadrada',
    definition: 'El número que multiplicado por sí mismo da el número de partida.',
    example: '√25 = 5 porque 5 × 5 = 25.',
    related: ['potencia'],
  },
  // — Fracciones y equivalencias —
  {
    id: 'fraccion',
    es: 'fracción',
    ca: 'fracció',
    definition: 'Partes iguales de un todo: numerador dividido entre denominador.',
    example: '3/4 son 3 partes de un todo dividido en 4.',
    related: ['numerador', 'denominador'],
  },
  {
    id: 'numerador',
    es: 'numerador',
    ca: 'numerador',
    definition: 'La parte de arriba de la fracción: cuántas partes se toman.',
    example: 'En 3/4 el numerador es 3.',
    related: ['denominador'],
  },
  {
    id: 'denominador',
    es: 'denominador',
    ca: 'denominador',
    definition: 'La parte de abajo de la fracción: en cuántas partes iguales se divide el todo.',
    example: 'En 3/4 el denominador es 4.',
    related: ['numerador'],
  },
  {
    id: 'fraccion-equivalente',
    es: 'fracción equivalente',
    ca: 'fracció equivalent',
    definition: 'Fracciones escritas de forma distinta que valen lo mismo.',
    example: '1/2 = 2/4 = 50/100.',
    related: ['fraccion'],
  },
  {
    id: 'numero-mixto',
    es: 'número mixto',
    ca: 'nombre mixt',
    definition: 'Un entero seguido de una fracción; otra forma de escribir fracciones mayores que 1.',
    example: '2 1/2 equivale a 5/2.',
    related: ['fraccion'],
  },
  {
    id: 'porcentaje',
    es: 'porcentaje',
    ca: 'percentatge',
    definition: 'Partes de cada 100; otra forma de escribir fracciones y decimales.',
    example: '25 % = 25 de cada 100 = 1/4.',
    related: ['fraccion-equivalente'],
  },
  // — Proporcionalidad y medida —
  {
    id: 'razon',
    es: 'razón',
    ca: 'raó',
    definition: 'Comparación entre dos cantidades: cuántas veces contiene una a la otra.',
    example: '«3 por cada 4» se escribe 3:4.',
    related: ['proporcionalidad'],
  },
  {
    id: 'proporcionalidad',
    es: 'proporcionalidad',
    ca: 'proporcionalitat',
    definition: 'Dos cantidades relacionadas que crecen o disminuyen al mismo ritmo.',
    example: 'Si 2 kg cuestan 4 €, 4 kg cuestan 8 €.',
    related: ['razon', 'proporcionalidad-inversa'],
  },
  {
    id: 'proporcionalidad-inversa',
    es: 'proporcionalidad inversa',
    ca: 'proporcionalitat inversa',
    definition: 'Cuando una cantidad crece, la otra disminuye guardando el mismo producto.',
    example: '4 obreros tardan 6 días; 8 obreros, 3 días.',
    related: ['proporcionalidad'],
  },
  {
    id: 'conversion-unidades',
    es: 'conversión de unidades',
    ca: "conversió d'unitats",
    definition: 'Pasar una medida de una unidad a otra multiplicando o dividiendo.',
    example: '2 km = 2000 m; 1,5 L = 1500 mL.',
  },
  // — Estadística y azar —
  {
    id: 'media',
    es: 'media',
    ca: 'mitjana',
    definition: 'La suma de todos los datos dividida entre cuántos datos hay.',
    example: 'Media de 4, 6, 8 → (4 + 6 + 8) ÷ 3 = 6.',
    related: ['mediana'],
  },
  {
    id: 'mediana',
    es: 'mediana',
    ca: 'mediana',
    definition: 'El dato que queda en el centro cuando todos están ordenados de menor a mayor.',
    example: 'En 2, 4, 9 la mediana es 4.',
    related: ['media'],
  },
  {
    id: 'moda',
    es: 'moda',
    ca: 'moda',
    definition: 'El dato que más veces se repite.',
    example: 'En 3, 3, 5, 7 la moda es 3.',
    related: ['media'],
  },
  {
    id: 'rango',
    es: 'rango',
    ca: 'rang',
    definition: 'La diferencia entre el dato mayor y el dato menor.',
    example: 'En 2, 5, 9 el rango es 9 − 2 = 7.',
    related: ['media'],
  },
  {
    id: 'probabilidad',
    es: 'probabilidad',
    ca: 'probabilitat',
    definition: 'Mide lo posible que es que ocurra algo, entre 0 (imposible) y 1 (seguro).',
    example: 'Sacar cara con una moneda: 1/2.',
  },
  // — Geometría —
  {
    id: 'perimetro',
    es: 'perímetro',
    ca: 'perímetre',
    definition: 'La suma de las longitudes de todos los lados de una figura.',
    example: 'Un cuadrado de lado 5 tiene perímetro 5 × 4 = 20.',
    related: ['area'],
  },
  {
    id: 'area',
    es: 'área',
    ca: 'àrea',
    definition: 'La superficie que ocupa una figura, medida en unidades cuadradas.',
    example: 'Un rectángulo de 3 × 4 tiene área 12.',
    related: ['perimetro', 'volumen'],
  },
  {
    id: 'volumen',
    es: 'volumen',
    ca: 'volum',
    definition: 'El espacio que ocupa un cuerpo, medido en unidades cúbicas.',
    example: 'Un prisma de 2 × 3 × 4 tiene volumen 24.',
    related: ['area'],
  },
  {
    id: 'circulo',
    es: 'círculo',
    ca: 'cercle',
    definition: 'La superficie que queda dentro de la circunferencia.',
    example: 'Su área es π × r².',
    related: ['circunferencia'],
  },
  {
    id: 'circunferencia',
    es: 'circunferencia',
    ca: 'circumferència',
    definition:
      'La línea curva cerrada que rodea al círculo; todos sus puntos están a la misma distancia del centro.',
    example: 'Su longitud es 2 × π × r.',
    related: ['circulo', 'radio'],
  },
  {
    id: 'radio',
    es: 'radio',
    ca: 'radi',
    definition: 'La distancia del centro a cualquier punto de la circunferencia.',
    example: 'Si el radio es 5, el diámetro es 10.',
    related: ['diametro'],
  },
  {
    id: 'diametro',
    es: 'diámetro',
    ca: 'diàmetre',
    definition: 'La distancia de un lado al otro del círculo pasando por el centro; el doble del radio.',
    example: 'd = 2 × r.',
    related: ['radio'],
  },
  {
    id: 'angulo',
    es: 'ángulo',
    ca: 'angle',
    definition: 'La apertura entre dos líneas que se encuentran en un vértice.',
    example: 'Agudo < 90°, recto = 90°, obtuso > 90°.',
  },
  // — Álgebra —
  {
    id: 'ecuacion',
    es: 'ecuación',
    ca: 'equació',
    definition: 'Una igualdad con una incógnita que hay que averiguar.',
    example: 'x + 3 = 7 → x = 4.',
    related: ['incognita'],
  },
  {
    id: 'incognita',
    es: 'incógnita',
    ca: 'incògnita',
    definition: 'El valor desconocido que se busca en una ecuación.',
    example: 'En x + 3 = 7, la incógnita es x.',
    related: ['ecuacion'],
  },
];
