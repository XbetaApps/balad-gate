/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.slameh.app',
  appName: 'SLAMEH',
  webDir: '.next',
  server: {
    url: 'https://balad-gate-git-main-xbetas-projects.vercel.app',
    cleartext: false,
    allowNavigation: ['balad-gate-git-main-xbetas-projects.vercel.app']
  },
  android: { allowMixedContent: false }
};
module.exports = config;