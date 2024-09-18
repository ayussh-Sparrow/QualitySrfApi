// models/LineMaster.js
const { DataTypes } = require('sequelize');
const Sequelize = require('sequelize'); // Your Sequelize instance
const sequelize = new Sequelize(process.env.database, process.env.user, process.env.password, {
    host: process.env.server,
    dialect: 'mssql' 
  });
const LineMaster = sequelize.define('LineMaster', {
  LineId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  LineName: {
    type: DataTypes.STRING(20),
    allowNull: false,
  }
}, {
  tableName: 'tbl_SRFPolyQualityLog_LineMaster',
  timestamps: false
});

module.exports = LineMaster;
