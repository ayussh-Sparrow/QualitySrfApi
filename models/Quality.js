const AssetMaster = require('./AssetMaster');
const LineMaster = require('./LineMaster');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.database, process.env.user, process.env.password, {
 host: process.env.server,
 dialect: 'mssql' 
});

const  QualityLogSheet = sequelize.define('QualityLogSheet', {
  ID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  AssetTagId: {
    type: DataTypes.INTEGER,
    references: {
      model: AssetMaster,
      key: 'AssetId'
    }
  },
  LineId: {
    type: DataTypes.INTEGER,
    references: {
      model: LineMaster,
      key: 'LineId'
    }
  },
  Value: {
    type: DataTypes.TEXT, // NVARCHAR(MAX) corresponds to TEXT in Sequelize
    allowNull: true,
  },
  PartName: {
    type: DataTypes.STRING, // NVARCHAR(MAX) corresponds to TEXT in Sequelize
    allowNull: true,
  },
  LogSheetDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  RecordCreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'tbl_SRFPolyQualityLogSheet',
  timestamps: false
});

// Define relationships
QualityLogSheet.belongsTo(AssetMaster, { foreignKey: 'AssetTagId', as: 'asset' });
QualityLogSheet.belongsTo(LineMaster, { foreignKey: 'LineId', as: 'line' });

module.exports = QualityLogSheet;
