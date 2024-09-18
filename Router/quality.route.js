const express=require('express')
const router = express.Router();
const {twopost,getquality,updateQualityLog,deleteQualityLog} =require('../Controllers/Quality.controller')
router.post('/',twopost );
router.get('/',getquality);
router.put('/',updateQualityLog);
router.delete('/', deleteQualityLog);

module.exports=router;