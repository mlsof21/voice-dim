const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanPlugin } = require('webpack');
const srcDir = path.join(__dirname, 'src', 'ts');
const Visualizer = require('webpack-visualizer-plugin2');

const browsers = ['chrome', 'firefox'];

const configs = browsers.map((browser) => {
  return {
    entry: {
      background: path.join(srcDir, 'background.ts'),
      voiceDim: path.join(srcDir, 'voiceDim.ts'),
      options: path.join(srcDir, 'options.ts'),
      common: path.join(srcDir, 'common.ts'),
    },
    output: {
      path: path.join(__dirname, 'dist', browser, 'js'),
      filename: '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new CleanPlugin({ verbose: false }),
      new CopyPlugin({
        patterns: [
          { from: 'icons/', to: '../icons/', context: 'public' },
          { from: `./manifest.${browser}.json`, to: '../manifest.json', context: 'public' },
          { from: 'html/', to: '../html/', context: 'src' },
          { from: 'css/', to: '../css/', context: 'src' },
        ],
      }),
    ],
  };
});

module.exports = (env) => {
  if (env.mode !== 'production') {
    configs.forEach((config) => {
      config.plugins.push(new Visualizer({ filename: path.join('..', 'stats', 'stats.html') }));
    });
  }

  return configs.map((config) => {
    return {
      ...config,
      mode: env.mode,
      devtool: env.mode === 'production' ? 'source-map' : 'inline-source-map',
    };
  });
};
