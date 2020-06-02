# RDX WebPack HTML Entry Plugin

Use HTML files as entry points for WebPack compilations.

## Install

`npm i -D rdx-webpack-html-entry-plugin`

## Usage

1. Add the plugin to your WebPack config.
1. Add HTML files as entries.

```javascript
// webpack.config.js

// Import/require the plugin.
const {RDXWebPackHTMLEntryPlugin} = require('rdx-webpack-html-entry-plugin');

module.exports = {
  // ...
  entry: {
    // Add HTML files as entries.
    'index.html': './index.html'
  },
  // ...
  plugins: [
    // Add the plugin.
    new RDXWebPackHTMLEntryPlugin()
  ],
  module: {
    // ...
  }
};
```
