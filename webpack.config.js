const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    demo: './src/demo/index.ts',
    background: './src/js/background.ts',
    popup: './src/js/popup.ts',
    contentscript: './src/js/scriptlet/contentscript.ts',
    epicker: './src/js/scriptlet/epicker.ts',
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
