const path = require('path');
const dotenv = require('dotenv-webpack');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanPlugin } = require('webpack');
const srcDir = path.join(__dirname, 'src', 'ts');

const browsers = ['chrome', 'firefox'];

const configs = browsers.map((browser) => {
  return {
    entry: {
      background: path.join(srcDir, 'background.ts'),
      'dim-voice': path.join(srcDir, 'dim-voice.ts'),
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
          { from: './icon.png', to: '../icon.png', context: 'public' },
          { from: `./manifest.${browser}.json`, to: '../manifest.json', context: 'public' },
          { from: 'html/', to: '../html/', context: 'src' },
          { from: 'css/', to: '../css/', context: 'src' },
        ],
      }),
      new dotenv(),
    ],
    devtool: 'inline-source-map',
  };
});

module.exports = (env) => {
  console.log({ configs });
  return configs.map((config) => {
    return { ...config, mode: env.mode };
  });
};
