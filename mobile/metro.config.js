const path = require('path');

/**
 * Metro config to allow importing files from the workspace root (monorepo style).
 * If you'd rather copy files into `mobile/src` you don't need this.
 */
module.exports = {
  projectRoot: path.resolve(__dirname),
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
    /*
     * When using typescript path aliases or sharing source code across packages,
     * you may need to set extraNodeModules. Keep this minimal.
     */
    extraNodeModules: new Proxy({}, {
      get: (target, name) => path.join(__dirname, 'node_modules', name)
    })
  }
};
