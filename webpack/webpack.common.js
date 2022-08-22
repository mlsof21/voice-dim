const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const srcDir = path.join(__dirname, '..', 'src', 'ts');

module.exports = {
  entry: {
    background: path.join(srcDir, 'background.ts'),
    'dim-voice': path.join(srcDir, 'dim-voice.ts'),
    options: path.join(srcDir, 'options.ts'),
    common: path.join(srcDir, 'common.ts'),
  },
  output: {
    path: path.join(__dirname, '..', 'dist', 'js'),
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
    new CopyPlugin({
      patterns: [
        { from: '.', to: '..', context: 'public' },
        { from: 'html/', to: '../html/', context: 'src' },
        { from: 'css/', to: '../css/', context: 'src' },
      ],
    }),
  ],
};
