import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const watch = args.includes('--watch');

const config = JSON.parse(fs.readFileSync('../../elo.config.json', 'utf8'));
const obsidianVaults = config.obsidianVaults;

const targetDirs = obsidianVaults.map(vault => path.join(vault, '.obsidian/plugins/elo-obsidian-google-contacts-plugin'));

const copyPlugin = {
  name: 'copy-plugin',
  setup(build) {
    build.onEnd(() => {
      targetDirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const files = [
          '.dist/main.js',
          'manifest.json',
          '.hotreload' // Optional, if using hot-reload plugin
        ];
        // Check if styles.css exists before adding
        if (fs.existsSync('src/Infrastructure/Obsidian/styles.css')) {
             files.push({ src: 'src/Infrastructure/Obsidian/styles.css', dest: 'styles.css' });
        }
        
        if (watch) {
          files.push('.dist/main.js.map');
        }

        files.forEach((file) => {
          const src = typeof file === 'string' ? file : file.src;
          const destName = typeof file === 'string' ? path.basename(file) : file.dest;
          
          if (fs.existsSync(src)) {
            const dest = path.join(dir, destName);
            fs.copyFileSync(src, dest);
            console.log(`Copied ${src} to ${dest}`);
          }
        });
      });
    });
  },
};

const buildOptions = {
  entryPoints: ['src/main.ts'],
  outfile: '.dist/main.js',
  bundle: true,
  platform: 'browser',
  target: 'es2018',
  format: 'cjs',
  sourcemap: watch,
  external: ['obsidian', 'fs', 'path', 'child_process'],
  plugins: [copyPlugin],
  logLevel: 'info',
  banner: {
    js: '/* eslint-disable */\n',
  },
  alias: {
    '@': './src',
  },
};

async function build() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
