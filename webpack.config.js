const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
  mode: 'production',
  entry: {
    background: path.resolve(__dirname, 'src', 'ts', 'background.ts'),
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts'],
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
      patterns: [{ from: '.', to: '.' }],
    }),
  ],
};
