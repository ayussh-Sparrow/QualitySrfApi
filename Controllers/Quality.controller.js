const { DataTypes } = require('sequelize');
const Sequelize = require('sequelize'); 
const AssetMaster=require('../models/AssetMaster');
const LineMaster=require('../models/LineMaster');
const QualityLogSheet = require('../models/Quality');
const QualityParameters=require('../models/QualityParameters')
const ProcessCapabilities=require('../models/ProcessCapability')
const sequelizeCpk = new Sequelize("dev-srf-control", process.env.user, process.env.password, {
  host: process.env.server ,
  dialect: 'mssql'
});
const sequelize = new Sequelize(process.env.database, process.env.user, process.env.password, {
    host: process.env.server,
    dialect: 'mssql' 
  });
  Sequelize.DATE.prototype._stringify = function _stringify(date, options) {
    return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
}
// const twopost = async (req, res) => {
//     const { LogDate, LogTime, Part, Line, Value } = req.body;

// // Validate required fields
// if (!LogDate  || !Part || !Line || !Value || !Array.isArray(Value)) {
//   return res.status(400).send('Missing required fields: LogDate, LogTime, Part, Line, or Value');
// }
// let transaction;
// try {
//   // Start a transaction
//   transaction = await sequelize.transaction();

//   // Create or find the line in LineMaster
//   let line = await LineMaster.findOne({ where: { LineName: Line } });
//   if (!line) {
//     line = await LineMaster.create({ LineName: Line }, { transaction });
//   }

//   for (const entry of Value) {
//     const { Tagname, ColValue } = entry;

//     // Create or find the asset in AssetMaster
//     let asset = await AssetMaster.findOne({ where: { AssetName: Tagname } });
//     if (!asset) {
//       asset = await AssetMaster.create({ AssetName: Tagname }, { transaction });
//     }

//     // Store each ColValue in the QualityLogSheet table
//     for (const colValue of ColValue) {
     
//       await QualityLogSheet.create({
//         AssetTagId: asset.AssetId,
//         LineId: line.LineId,
//         PartName: Part,
//         Value: JSON.stringify( colValue ), // Store as JSON string
//         LogSheetDate: LogDate,
//         RecordCreatedAt: new Date(),
//         //LogTime: new Date(LogTime)
//       }, { transaction });
//     }
//   }

//   // Commit the transaction
//   await transaction.commit();
//   res.status(201).send('Log entries created successfully');
// } catch (error) {
//     if (transaction) {
//    await transaction.rollback();}
//   res.status(500).send('Failed to create log entries: ' + error.message);
// }
//   };// Function to determine the shift based on the hour
const getShift = (date) => {
  const hours = date.getUTCHours();
  console.log(date)
  console.log(hours)
  if (hours >= 6 && hours < 14) return 0; // 0600 to 1400
  if (hours >= 14 && hours < 22) return 1; // 1400 to 2200
  return 2; // 2200 to 0600
};

const Cpk = async ({ key, Date: dateString, data }) => {
  let cpkTransaction;
  try {
    // Assuming you have a separate Sequelize instance for the different database
    cpkTransaction = await sequelizeCpk.transaction();

    // Parse the date string into a Date object
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }

    // Determine the shift based on the parsed date
    const shift = getShift(parsedDate);

    const Q = await QualityParameters.findOne({ where: { QualityParameter: key }, transaction: cpkTransaction });
    
    if (!Q) {
      throw new Error(`Quality Parameter ${key} not found`);
    }

    const latestCapability = await ProcessCapabilities.findOne({
      where: { QualityParameterModelId: Q.Id },
      order: [['DateofAnalysis', 'DESC']],
      transaction: cpkTransaction
    });

    const LSL = latestCapability ? latestCapability.LSL : 0;
    const USL = latestCapability ? latestCapability.USL : 0;
    console.log(shift)
    await ProcessCapabilities.create({
      DateofAnalysis: parsedDate,
      Shift: shift, // Determine the shift dynamically
      Data: parseFloat(data), // Ensure data is a float
      QualityParameterModelId: Q.Id,
      LSL: LSL,
      USL: USL
    }, { transaction: cpkTransaction });

    await cpkTransaction.commit();
  } catch (error) {
    if (cpkTransaction) {
      await cpkTransaction.rollback();
    }
    throw error;
  }
};

const twopost = async (req, res) => {
  const { LogDate, LogTime, Part, Line, Value } = req.body;

  // Validate required fields
  if (!LogDate || !Part || !Line || !Value || !Array.isArray(Value)) {
    return res.status(400).send('Missing required fields: LogDate, LogTime, Part, Line, or Value');
  }

  const sequelizeTransaction = await sequelize.transaction();

  try {
    // Create or find the line in LineMaster
    let line = await LineMaster.findOne({ where: { LineName: Line }, transaction: sequelizeTransaction });
    if (!line) {
      line = await LineMaster.create({ LineName: Line }, { transaction: sequelizeTransaction });
    }

    for (const entry of Value) {
      const { Tagname, ColValue } = entry;

      // Create or find the asset in AssetMaster
      let asset = await AssetMaster.findOne({ where: { AssetName: Tagname }, transaction: sequelizeTransaction });
      if (!asset) {
        asset = await AssetMaster.create({ AssetName: Tagname }, { transaction: sequelizeTransaction });
      }

      // Store each ColValue in the QualityLogSheet table
      for (const colValue of ColValue) {
       
        await QualityLogSheet.create({
          AssetTagId: asset.AssetId,
          LineId: line.LineId,
          PartName: Part,
          Value: JSON.stringify(colValue), // Store as JSON string
          LogSheetDate: new Date(LogDate), // Use Date object for LogSheetDate
          RecordCreatedAt: new Date(),
          // LogTime: new Date(LogTime)
        }, { transaction: sequelizeTransaction });

        let key;
        let value;

        if (Part === 'Part5') {
          if (Line === 'LineA') {
            key = 'FD-A Moisture';
            value = colValue.Moisture;
            try {
              
              await Cpk({ key, Date: LogTime, data: value });
              
            } catch (error) {
              await sequelizeTransaction.rollback();
              return res.status(500).send('Failed to create log entries: ' + error.message);
            }

            key = 'FD-A RV';
            value = colValue.RV;
            try {
              await Cpk({ key, Date: LogTime, data: value });
            } catch (error) {
              await sequelizeTransaction.rollback();
              return res.status(500).send('Failed to create log entries: ' + error.message);
            }
          } else if (Line === 'LineB') {
            key = 'FD-B Moisture';
            value = colValue.Moisture;
            try {
              await Cpk({ key, Date: LogTime, data: value });
            } catch (error) {
              await sequelizeTransaction.rollback();
              return res.status(500).send('Failed to create log entries: ' + error.message);
            }

            key = 'FD-B RV';
            value = colValue.RV;
            try {
              await Cpk({ key, Date: LogTime, data: value });
            } catch (error) {
              await sequelizeTransaction.rollback();
              return res.status(500).send('Failed to create log entries: ' + error.message);
            }
          }
        } else if (Part === 'Part6') {
          if (Line === 'LineA') {
            key = 'OG-A RV';
            value = colValue.RV;
            try {
              await Cpk({ key, Date: LogTime, data: value });
            } catch (error) {
              await sequelizeTransaction.rollback();
              return res.status(500).send('Failed to create log entries: ' + error.message);
            }
          } else if (Line === 'LineB') {
            key = 'OG-B RV';
            value = colValue.RV; // Ensure this matches the property name in colValue
            try {
              await Cpk({ key, Date: LogTime, data: value });
            } catch (error) {
              await sequelizeTransaction.rollback();
              return res.status(500).send('Failed to create log entries: ' + error.message);
            }
          }
        }
      }
    }

    await sequelizeTransaction.commit();
    res.status(201).send('Log entries created successfully');
  } catch (error) {
    await sequelizeTransaction.rollback();
    res.status(500).send('Failed to create log entries: ' + error.message);
  }
};


  
  const getquality = async (req, res) => {
   
    const { LogDate, Line,Part } = req.query;
    if (!LogDate||!Line||!Part) {
        return res.status(400).send('Missing required fields: LogDate,Line,Part');
      }
      
    try {
      // Fetch line details
      const lineDetails = await LineMaster.findOne({ where: { LineName: Line } });
      if (!lineDetails) {
        return res.status(404).send('Line not found');
      }
  
      // Fetch quality log data for the specified date and line
      const logs = await QualityLogSheet.findAll({
        where: {
          LogSheetDate: LogDate,
          LineId: lineDetails.LineId,
          PartName:Part
        },
        include: [
          {
            model: AssetMaster,
            as: 'asset',
          },
          {
            model: LineMaster,
            as: 'line',
          },
        ],
      });

      const groupedLogs = logs.reduce((acc, log) => {
        const tagname = log.asset.AssetName;
        const parsedValue = JSON.parse(log.Value);
        parsedValue.id = log.ID; // Add log.id to the parsed value
        
        if (!acc[tagname]) {
          acc[tagname] = {
            Tagname: tagname,
            ColValue: [],
          };
        }
  
        acc[tagname].ColValue.push(parsedValue);
  
        return acc;
      }, {});
      // Format the data according to the structure provided
      const responseData = {
        LogDate,
        Line: lineDetails.LineName,
        Value: Object.values(groupedLogs),
      };
  
      res.status(200).json(responseData);
    } catch (error) {
      res.status(500).send('Error retrieving data: ' + error.message);
    }
  };

  const updateQualityLog = async (req, res) => {
    const {Part,Line, Value } = req.body;

    // Validate required fields
    if ( !Part || !Line || !Value || !Array.isArray(Value)) {
      return res.status(400).send('Missing required fields or Value is not an array');
  }

    const transaction = await sequelize.transaction();

    try {
      for(const tag of Value)
        {
        for (const item of tag.ColValue) {
            const { id, ...updateData } = item; // Extract id and other data

            // Ensure id is present
            if (!id) {
                await transaction.rollback();
                return res.status(400).send('Missing id in one or more items');
            }

                // Fetch the existing log entry within the transaction
                const logEntry = await QualityLogSheet.findOne({ where: { id }, transaction });
                if (!logEntry) {
                    await transaction.rollback();
                    return res.status(404).send(`Log entry with id ${id} not found`);
                }

                // Parse the existing JSON value
                let existingData = JSON.parse(logEntry.Value);

                // Merge the existing data with the update data
                const updatedData = { ...existingData, ...updateData };

                // Update the log entry with the merged data
                logEntry.Value = JSON.stringify(updatedData);

                // Save the updated log entry within the transaction
                await logEntry.save({ transaction });
            }
        }


        // Commit the transaction
        await transaction.commit();
        res.status(200).send('Log entries updated successfully');
    } catch (error) {
        // Rollback the transaction in case of an error
        await transaction.rollback();
        console.error('Error updating log entries:', error);
        res.status(500).send('Failed to update log entries: ' + error.message);
    }
  };
const deleteQualityLog = async (req, res) => {
    const { id } = req.query; // Assume the ID of the log entry is passed as a URL parameter

    try {
        // Fetch the existing log entry
        let logEntry = await QualityLogSheet.findOne({ where: { id } });
        if (!logEntry) {
            return res.status(404).send('Log entry not found');
        }

        // Delete the log entry
        await logEntry.destroy();

        res.status(200).send('Log entry deleted successfully');
    } catch (error) {
        res.status(500).send('Failed to delete log entry: ' + error.message);
    }
};

module.exports = { twopost, getquality, updateQualityLog, deleteQualityLog ,Cpk};
  