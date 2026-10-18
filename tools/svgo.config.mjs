// Configuración de SVGO usada para optimizar los SVG de `src/assets/img`.
//
// Se ejecuta sin instalar nada en el proyecto:
//   pnpm dlx svgo --config tools/svgo.config.mjs -i <archivo>.svg -o <archivo>.svg
//
// Por qué esta configuración y no el preset por defecto:
//   * `mergePaths` fusiona paths con los mismos atributos. En estos SVG
//     (trazados con imagetracer.js) reducía logo.svg de 645 a 22 paths y
//     cambiaba hasta un 29 % de los píxeles a tamaño de visualización.
//   * `removeUnknownsAndDefaults` eliminaba `stroke-width="1"`; es el valor por
//     defecto del SVG, pero se conserva para no depender de esa suposición.
//   * Precisión 6 en lugar de 3: mantiene las coordenadas y deja la diferencia
//     en bordes por debajo de lo perceptible (máx. Δ 16/255 medido a 400 px,
//     0 píxeles distintos en la mitad de los archivos a tamaño de uso real).
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          mergePaths: false,
          removeUnknownsAndDefaults: false,
          cleanupNumericValues: { floatPrecision: 6 },
          convertPathData: { floatPrecision: 6, transformPrecision: 6 },
        },
      },
    },
  ],
};
