const path = require('path')
const { withExpo } = require('@expo/webpack-config')

module.exports = function (env, argv) {
  const config = withExpo(env)

  config.resolve = config.resolve || {}
  config.resolve.extensions = Array.from(new Set([...(config.resolve.extensions || []), '.mjs']))
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@supabase/postgrest-js': path.resolve(__dirname, 'node_modules/@supabase/postgrest-js/dist/cjs/index.js'),
    '@supabase/functions-js': path.resolve(__dirname, 'node_modules/@supabase/functions-js/dist/main/index.js'),
    '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js/dist/main/index.js'),
    tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.js'),
    'use-latest-callback': path.resolve(__dirname, 'node_modules/use-latest-callback/esm.mjs'),
    'dequal': path.resolve(__dirname, 'node_modules/dequal/dist/index.mjs'),
    'zustand/react': path.resolve(__dirname, 'node_modules/zustand/esm/react.mjs'),
    'zustand/vanilla': path.resolve(__dirname, 'node_modules/zustand/esm/vanilla.mjs'),
    'zustand': path.resolve(__dirname, 'node_modules/zustand/esm/index.mjs'),
  }

  return config
}
