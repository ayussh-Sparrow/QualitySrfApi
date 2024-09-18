const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.database, process.env.user, process.env.password, {
 host: process.env.server,
 dialect: 'mssql' 
});
const AssetMaster = sequelize.define('AssetMaster', {
  AssetId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  AssetName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  }
}, {
  tableName: 'tbl_SRFPolyQualityLog_AssetMaster',
  timestamps: false
});

module.exports = AssetMaster;
