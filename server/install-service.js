var Service = require('node-windows').Service;

var svc = new Service({
  name: 'AOI Maintenance Backend',
  description: 'Node.js Express API for AOI Maintenance Checksheet',
  script: 'D:\\AOI_Maintenance_Checksheet-main\\server\\server.js',
  env: [{
    name: "NODE_ENV",
    value: "production"
  }]
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function() {
  console.log('✅ Service installed successfully!');
  svc.start();
  console.log('🚀 Service started in the background!');
});

// Just in case it's already installed
svc.on('alreadyinstalled', function() {
  console.log('⚠️ This service is already installed.');
});

// Install the script as a service.
console.log('Installing Windows Service...');
svc.install();
