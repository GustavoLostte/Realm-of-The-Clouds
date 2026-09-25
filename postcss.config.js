export default {
  plugins: {
    autoprefixer: {
      // Target mobile browsers aggressively for gaming PWA
      overrideBrowserslist: [
        'last 4 versions',
        '> 0.5%',
        'iOS >= 14',
        'Safari >= 14',
        'Chrome >= 80',
        'Samsung >= 14',
        'not dead',
      ],
    },
  },
}
