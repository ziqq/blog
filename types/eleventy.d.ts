declare module '@11ty/eleventy' {
  export interface EleventyPage {
    url: string;
    content: string;
    inputPath: string;
    [key: string]: unknown;
  }

  export interface EleventyOptions {
    configPath?: string;
  }

  export default class Eleventy {
    constructor(input?: string, output?: string, options?: EleventyOptions);
    toJSON(): Promise<EleventyPage[]>;
  }
}
