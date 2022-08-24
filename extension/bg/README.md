# Background Settings Page
The background settings page uses Vue.js, and for Vue.js to be used in a Manifest V3 chrome extension, any Vue templates must be compiled beforehand.

To compile the templates:
``` bash
npm install
npm run build
```

The compiled js will be output into the /dist directory, and to make it easier to install the extension, I'm checking /dist into version control. If you happen to modify the settings page, be sure to `npm run build` and include any changes to /dist in your commit.