module.exports = (config) => {
  const defaultExternal = Array.isArray(config.externals) ? config.externals[0] : config.externals;

  return {
    ...config,
    externals: [
      (context, callback) => {
        if (/^@studyzone\/shared-/.test(context.request)) {
          return callback();
        }

        if (typeof defaultExternal === 'function') {
          return defaultExternal(context, callback);
        }

        return callback();
      },
    ],
  };
};
