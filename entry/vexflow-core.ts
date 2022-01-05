// [VexFlow](https://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
// MIT License
// @author Ron B. Yeh
//
// A smaller initial bundle that supports dynamic importing of music engraving fonts.
//
// vexflow-core.ts is the entry point for output file vexflow-core.js.
// It does not preload / bundle any music fonts by default.
// All music fonts will be loaded dynamically via: `Flow.fetchMusicFont(fontName)`
// Remember to call `Flow.setMusicFont(fontName)` after fetching the font module.

import { Vex } from '../src/vex';

import { Flow } from '../src/flow';
import { Font, FontModule } from '../src/font';
import { loadTextFonts } from '../src/fonts/textfonts';
import { globalObject, RuntimeError } from '../src/util';

const fontModules: Record<string, string> = {
  Bravura: './vexflow-font-bravura.js',
  Gonville: './vexflow-font-gonville.js',
  Petaluma: './vexflow-font-petaluma.js',
  Custom: './vexflow-font-custom.js',
};

/**
 * @param fontName the name of the music font to load.
 * @param fontModuleOrPath Either a font module object (containing a .data and .metrics properties) or a path to a font module.
 * The font module is assumed to be in the same directory as the vexflow-core.js entry point.
 *
 * This replaces the default empty implementation in flow.ts.
 */
Flow.fetchMusicFont = async (fontName: string, fontModuleOrPath?: string | FontModule): Promise<void> => {
  const font = Font.load(fontName);

  // If the font has already been loaded before we do nothing.
  if (font.hasData()) {
    return;
  }

  if (fontName in fontModules) {
    fontModuleOrPath = fontModules[fontName];
  }

  if (!fontModuleOrPath) {
    throw new RuntimeError('UnknownFont', `Music font ${fontName} does not exist at path [${fontModuleOrPath}].`);
  }

  let fontModule: FontModule;
  if (typeof fontModuleOrPath === 'string') {
    const module = await import(/* webpackIgnore: true */ fontModuleOrPath);

    const g = globalObject();
    const moduleCJS = g['VexFlowFont' + fontName];
    if (typeof moduleCJS !== 'undefined') {
      // CJS font modules will set a global variable named: VexFlowFontBravura | VexFlowFontGonville | VexFlowFontPetaluma | etc.
      fontModule = moduleCJS;
    } else {
      // ESM font modules will export an object named "Font" with properties named "data" and "metrics".
      // See vexflow-font-bravura.ts for an example.
      fontModule = module.Font;
    }
  } else {
    fontModule = fontModuleOrPath;
  }
  font.setData(fontModule.data);
  font.setMetrics(fontModule.metrics);
};

// Load the two text fonts that ChordSymbol & Annotation use.
loadTextFonts();

export * from '../src/index';
export default Vex;
