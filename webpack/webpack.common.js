const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const srcDir = path.join(__dirname, '..', 'src', 'ts');

module.exports = {
  entry: {
    background: path.join(srcDir, 'background.ts'),
    content_script: path.join(srcDir, 'dim-voice.ts'),
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js',
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
  optimization: {
    splitChunks: {
      name: 'dim-voice',
      chunks(chunk) {
        return chunk.name !== 'background';
      },
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: '.', to: '../', context: 'public' }],
    }),
  ],
};
