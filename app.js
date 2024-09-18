const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
const qualityrouter=require('./Router/quality.route')
const { Sequelize, DataTypes,Op } = require('sequelize')
const port = 5144;
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:false, // Add this if you need to send cookies or HTTP authentication
    optionsSuccessStatus: 204
  };
  
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  
app.use('/quality',qualityrouter);


app.listen(port, async () => {
    console.log(`listening on port ${port}`)
});