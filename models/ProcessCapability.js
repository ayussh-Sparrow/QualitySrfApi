const { Sequelize, DataTypes } = require('sequelize');
const sequelizeCpk = new Sequelize("dev-srf-control", process.env.user, process.env.password, {
    host: process.env.server ,
    dialect: 'mssql'
  });

const ProcessCapabilities = sequelizeCpk.define('ProcessCapabilities', {
  Id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  }, 
  DateofAnalysis: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Shift: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Data: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  QualityParameterModelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'QualityParameters', // Make sure this model exists
      key: 'Id'
    }
  },
  LSL: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  USL: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  }
}, {
  tableName: 'ProcessCapabilities',
  timestamps: false
});

module.exports = ProcessCapabilities;
