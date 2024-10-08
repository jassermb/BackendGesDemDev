const express = require('express');
const multer = require('multer');
const router = express.Router();
const DemandeController = require('../controllers/par3');

const upload = require('../middleware/fillapp');

router.post(
    '/soumettre-demandepart3',
    upload.fields([
        { name: 'file', maxCount: 1 }, 
        { name: 'certificationsart', maxCount: 10 }
    ]),
    DemandeController.soumettreDemande
);
router.get('/soumettre-demandepart3/:id_demdev', DemandeController.getDemandeDetails);
router.put('/modifier-demandepart3/:id_demdev', upload.single('file'), DemandeController.mettreAJourDemande);

module.exports = router;
