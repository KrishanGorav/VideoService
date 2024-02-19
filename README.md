video-service
A NodeJS service with ffmpeg to generate video from set of images and an audio

yarn install
yarn build
yarn start
Production Deployment
Create a service file in below location

sudo nano /usr/lib/systemd/system/video-snippet.service
Past below contents in the file

[Unit]
Description=Video Snippet Application
After=syslog.target network.target

[Service]
WorkingDirectory=/opt/video-service
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/video-service/build/server.js

Restart=always

[Install]
WantedBy=multi-user.target# VideoService
