const { Sequelize, DataTypes } = require('sequelize');
const sequelizeCpk = new Sequelize("dev-srf-control", process.env.user, process.env.password, {
    host: process.env.server ,
    dialect: 'mssql'
  });
const QualityParameters = sequelizeCpk.define('QualityParameters', {
    Id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    QualityParameter: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    LineModelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'LineMaster', // Name of the referenced table
        key: 'Id',
      },
    },
    QualityVariablesModelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      references: {
        model: 'QualityVariables', // Name of the referenced table
        key: 'Id',
      },
    },
  }, {
    tableName: 'QualityParameters',
    timestamps: false,
  });
  
  module.exports = QualityParameters;