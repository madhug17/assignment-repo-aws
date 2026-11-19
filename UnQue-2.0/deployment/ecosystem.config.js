module.exports = {
  apps: [
    {
      name: 'unque-api',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5001,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};

