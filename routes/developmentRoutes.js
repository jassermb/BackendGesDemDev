const express = require('express');
const router = express.Router();
const upload = require('../middleware/fillapp');
const developmentController = require('../controllers/demController');
const db = require('../config/db'); 


router.post('/demande1-developpement', upload.any(), developmentController.createDevelopmentRequest);
router.put('/demande1-developpement/:id', upload.any(), developmentController.updateDevelopmentRequestpart1);
router.put('/demande1-developpement2/:id', upload.any(), developmentController.updateDevelopmentRequest2);
router.get('/demande1-developpement2/:id',developmentController.getDevelopmentRequestById);

router.get('/demande1-developpement/:id', developmentController.getDevelopmentRequest);

router.get('/development-list', developmentController.getDevelopmentList);
router.post('/donneesbase/:id_demdev', developmentController.createBaseData);
router.put('/putdonneesbase/:id_demdev', developmentController.updateBaseData);

router.put('/demandes/:id', developmentController.updateDevelopmentRequest);

router.get('/demdev2/:id', developmentController.getDevelopmentRequest2);
router.get('/dernier-numero/:code', developmentController.getLastSerialNumber);
router.get('/check-id-demdev/:id_demdev', developmentController.getIdDemdevExists);
router.post('/developmentpart3/:id', upload.single('file'), developmentController.submitDevelopmentRequest);
router.get('/donneesbase/:id', developmentController.getDonneesDeBaseByDemDevId);
router.get('/appreciationCOOC/:id', developmentController.getappreciationCOOC);



module.exports = router;
