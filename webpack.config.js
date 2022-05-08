const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    background: path.resolve(__dirname, 'src/js/background.ts'),
    popup: path.resolve(__dirname, 'src/js/popup.ts'),
    contentscript: path.resolve(__dirname, 'src/js/scriptlet/contentscript.ts'),
    epicker: path.resolve(__dirname, 'src/js/scriptlet/epicker.ts'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/build/js'),
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
};
