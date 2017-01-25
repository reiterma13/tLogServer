This is a simple MEAN starter project integrating Node/Express, MongoDB/Mongoose, Passport (using JWT) and Angular2.

It is basically a merge of the following two projects:
- [angular2-webpack-starter](https://github.com/AngularClass/angular2-webpack-starter)
- [Vulgar](https://github.com/datatypevoid/vulgar)

This was necessary because there's apparently no template project available the supports the latest version of Angular2 (currently 2.0.2) and the rest of the MEAN stack.

To integrate node and webpack [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) and [webpack-hot-middleware](https://github.com/glenjamin/webpack-hot-middleware) have been used.

# File Structure

```
project-root/
 ├──app/                       * server-side source code (mainly REST)
 |   ├──models                 * folder containing the data-model expressed as mongoose schema definitions
 |   ├──routes                 * contains REST endpoint definitions
 |   ├──routes.js              * master route definition. all other routes need to be initialized here
 ├──config/                    * our configuration
 |   ├──config.json            * database configuration and session secret (should not be under version control!!!!)
 |   ├──helpers.js             * helper functions for our configuration files
 |   ├──spec-bundle.js         * ignore this magic that sets up our angular 2 testing environment
 |   ├──karma.conf.js          * karma config for our unit tests
 |   ├──mongoose.conf.js       * establishing connection to mongodb
 |   ├──passport.conf.js       * security configuration and signup/login procedure 
 |   ├──protractor.conf.js     * protractor config for our end-to-end tests
 │   ├──webpack.dev.js         * our development webpack config
 │   ├──webpack.prod.js        * our production webpack config
 │   └──webpack.test.js        * our testing webpack config
 │
 ├──src/                       * our source files that will be compiled to javascript
 |   ├──main.browser.ts        * our entry file for our browser environment
 │   │
 |   ├──index.html             * Index.html: where we generate our index page
 │   │
 |   ├──polyfills.ts           * our polyfills file
 │   │
 |   ├──vendor.ts              * our vendor file
 │   │
 │   ├──app/                   * WebApp: folder
 │   │   ├──app.spec.ts        * a simple test of components in app.ts
 │   │   ├──app.e2e.ts         * a simple end-to-end test for /
 │   │   └──app.ts             * App.ts: a simple version of our App component components
 │   │
 │   └──assets/                * static assets are served here
 │       ├──icon/              * our list of icons from www.favicon-generator.org
 │       ├──service-worker.js  * ignore this. Web App service worker that's not complete yet
 │       ├──robots.txt         * for search engines to crawl your website
 │       └──humans.txt         * for humans to know who the developers are
 ├──test/                      * spec files for server-side logic that are run with mocha
 │
 │
 ├──server.js                  * startup script of the entire application
 ├──server.conf.js             * actual server startup logic
 ├──tslint.json                * typescript lint config
 ├──typedoc.json               * typescript documentation generator
 ├──tsconfig.json              * config that webpack uses for typescript
 ├──package.json               * what npm uses to manage it's dependencies
 └──webpack.config.js          * webpack main configuration file
```