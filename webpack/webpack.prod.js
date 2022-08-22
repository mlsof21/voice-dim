const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = (env) => {
  console.log({ common });
  console.log({ env });
  return merge(common, {
    mode: 'production',
  });
};
