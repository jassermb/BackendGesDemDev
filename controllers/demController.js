const Development = require('../models/development');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const db = require('../config/db');

const createDevelopmentRequest = async (req, res) => {
    try {
        const {
            dateObjectifMiseEnIndustrialisation,
            raisonDeveloppement,
            problematique,
            objectifDevelopment,

            id_demondeur,
            role,
            code
        } = req.body;

        const fileMap = req.files ? req.files.reduce((map, file) => {
            map[file.originalname] = file.path;
            return map;
        }, {}) : {};

        let raisonDevWithFiles = [];
        try {
            const parsedRaisons = JSON.parse(raisonDeveloppement);
            raisonDevWithFiles = parsedRaisons.map(raison => ({
                raison: raison.raison,
                file: fileMap[raison.file] || null
            }));
        } catch (error) {
            return res.status(400).send('Le champ raisonDeveloppement n\'est pas un JSON valide.');

        }

        const data = {
            id_demondeur,
            dateObjectifMiseEnIndustrialisation,
            raisonDeveloppement: JSON.stringify(raisonDevWithFiles),
            problematique,
            code,
            objectifDevelopment,
            createdAt: new Date()
        };

        const result = await Development.createDevelopmentRequest(data);

        const notification = {
            role: role,
            userId: id_demondeur,
            type: 'Demande de Développement',
            message: 'Une nouvelle demande de développement a été créée. Veuillez la valider.',
            id: result.insertId,
            status: 'pending'
        };

        io.emit('send_notification', notification);
        const requestId = result.insertId;

        console.log('Demande de développement enregistrée avec succès', requestId);
        res.status(201).json({ requestId });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la demande de développement', error);
        res.status(500).send('Erreur lors de l\'enregistrement de la demande de développement');
    }
};



const getDevelopmentRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Development.getDevelopmentRequestById(id);

        if (!result) {
            return res.status(404).json({ message: 'Demande de développement non trouvée' });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la demande de développement' });
    }
};
const getDevelopmentList = async (req, res) => {
    try {
        const query = `
            SELECT 
                d.id AS id,
                d.code AS Code,
                u.email AS Demandeur,
                DATE_FORMAT(d.dateCreation, '%Y-%m-%d') AS 'Date de creation',
                DATE_FORMAT(d.dateObjectifMiseEnIndustrialisation, '%Y-%m-%d') AS 'Date d''objectif d''industrialisation', -- Apostrophes échappées ici
                d.status AS status,
                DATE_FORMAT(d.dateReelleIndustrialisation, '%Y-%m-%d') AS 'Date de cloture'
            FROM demandededeveloppement d
            JOIN users u ON d.id_demondeur = u.id 
            ORDER BY d.dateCreation DESC;
        `;
        const [rows] = await db.query(query); 
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes de développement:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des demandes de développement' });
    }
};


const updateDevelopmentRequest = async (req, res) => {
    const { id } = req.params;
    const {
        estimationVente,
        estimationGain,
        unitsG, unitsV,
        RisqueImpact,
        validationCOO,
        status
    } = req.body;

    // Débogage
    console.log('Data to be updated:', {
        estimationVente,
        estimationGain,
        RisqueImpact,
        validationCOO,
        status,
        id,
        unitsG,
        unitsV
    });
    const estimationGainfinal = `${estimationGain} ${unitsG}`;
    const estimationVentefinal = `${estimationVente} ${unitsV}`;


    try {
        const [result] = await db.query(
            `UPDATE demandededeveloppement 
             SET   estimationDeGain = ?, validationCOO = ?, estimationDeVente = ?, RisqueImpact = ? ,status = ?
             WHERE id = ?`,
            [estimationGainfinal, validationCOO, estimationVentefinal, JSON.stringify(RisqueImpact), status, id]
        );
        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: 'Demande de développement mise à jour avec succès' });
        } else {
            res.status(404).json({ success: false, message: 'Demande de développement non trouvée' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la demande de développement:', error);
        res.status(500).json({ success: false, message: `Erreur lors de la mise à jour de la demande de développement: ${error.message}` });
    }
};
const updateBaseData = async (req, res) => {
    console.log('Request body:', req.body);
    const { id_demdev } = req.params;
    const dataArray = req.body; // Un tableau de données à mettre à jour ou insérer

    try {
        // Démarrer une transaction pour garantir que toutes les opérations sont atomiques
        await db.query('START TRANSACTION');

        // Obtenez tous les IDs existants pour cette demande
        const [existingDataIds] = await db.query(
            `SELECT id FROM donneesdebase WHERE id_demdev = ?`,
            [id_demdev]
        );

        // Convertir les IDs existants en un ensemble pour une recherche rapide
        const existingIdsSet = new Set(existingDataIds.map(item => item.id));

        // Suivi des IDs qui doivent être supprimés
        const idsToDelete = [...existingIdsSet];

        // Traitement des données reçues
        for (const data of dataArray) {
            const {
                Codewindeco,
                designation,
                consommationAnnuelle,
                prixActuel,
                fournisseur,
                documentsQualite,
                designationFournisseur,
                unitePrixActuel,
                id
            } = data;

            const prixActuelUnite = `${prixActuel} ${unitePrixActuel}`;
            console.log('Data to be updated or inserted:', {
                Codewindeco,
                designation,
                consommationAnnuelle,
                prixActuelUnite,
                fournisseur,
                designationFournisseur,
                documentsQualite,
                id
            });

            if (id) {
                // Si l'entrée existe, mettez-la à jour
                const [updateResult] = await db.query(
                    `UPDATE donneesdebase 
                     SET Codewindeco = ?, designation = ?, consommationAnnuelle2024 = ?, prixActuel = ?, fournisseur = ?, designationFournisseur = ?, documentsQualite = ?
                     WHERE id = ? AND id_demdev = ?`,
                    [Codewindeco, designation, consommationAnnuelle, prixActuelUnite, fournisseur, designationFournisseur, documentsQualite, id, id_demdev]
                );
                console.log('Update result:', updateResult);

                // Retirer l'ID de la liste des IDs à supprimer
                idsToDelete.splice(idsToDelete.indexOf(id), 1);
            } else {
                // Sinon, insérez une nouvelle ligne
                await db.query(
                    `INSERT INTO donneesdebase (Codewindeco, designation, consommationAnnuelle2024, prixActuel, fournisseur, designationFournisseur, documentsQualite, id_demdev) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [Codewindeco, designation, consommationAnnuelle, prixActuelUnite, fournisseur, designationFournisseur, documentsQualite, id_demdev]
                );
            }
        }

        // Supprimer les lignes dont les IDs ne sont pas présents dans les données reçues
        if (idsToDelete.length > 0) {
            await db.query(
                `DELETE FROM donneesdebase WHERE id IN (?) AND id_demdev = ?`,
                [idsToDelete, id_demdev]
            );
        }

        // Si toutes les opérations se passent bien, validez la transaction
        await db.query('COMMIT');
        res.status(200).json({ success: true, message: 'Données de base mises à jour, créées ou supprimées avec succès' });
    } catch (error) {
        // En cas d'erreur, annulez la transaction
        await db.query('ROLLBACK');
        console.error('Erreur lors de la mise à jour, création ou suppression des données de base:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour, création ou suppression des données de base', error });
    }
};





const createBaseData = async (req, res) => {
    const { id_demdev } = req.params;
    const baseDataArray = req.body; // Assurez-vous que c'est un tableau d'objets de données de base

    try {
        // Utilisez une transaction pour garantir que toutes les insertions sont atomiques
        await db.query('START TRANSACTION');

        for (const baseData of baseDataArray) {
            const {
                Codewindeco,
                designation,
                consommationAnnuelle,
                prixActuel,
                fournisseur,
                designationFrs,
                documentsQualite,

                unitePrixActuel,
            } = baseData;

            const prixActuelUnite = `${prixActuel} ${unitePrixActuel}`;
            await db.query(
                `INSERT INTO donneesdebase (Codewindeco, designation, consommationAnnuelle2024, prixActuel, fournisseur, designationFournisseur, documentsQualite, id_demdev) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [Codewindeco, designation, consommationAnnuelle, prixActuelUnite, fournisseur, designationFrs, documentsQualite, id_demdev]
            );
        }

        await db.query('COMMIT');
        res.status(201).json({ success: true, message: 'Données de base créées avec succès' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Erreur lors de la création des données de base:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création des données de base' });
    }
};


const getLastSerialNumber = async (req, res) => {
    const { code } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT code 
            FROM demandededeveloppement 
            WHERE code LIKE ? 
            ORDER BY code DESC 
            LIMIT 1`,
            [`${code}%`]
        );
        if (rows.length > 0) {
            const lastSerialNumber = rows[0].code;
            res.status(200).json({ success: true, lastSerialNumber });
        } else {
            res.status(404).json({ success: false, message: 'Aucun numéro de série trouvé pour ce code' });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du dernier numéro de série:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du dernier numéro de série' });
    }
};

const getIdDemdevExists = async (req, res) => {
    const { id_demdev } = req.params;
    try {
        const [rows] = await db.query('SELECT COUNT(*) AS count FROM donneesdebase WHERE id_demdev = ?', [id_demdev]);

        const count = rows[0].count;
        const exists = count > 0;

        res.json({ exists });
    } catch (error) {
        console.error('Error checking id_demdev existence:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
async function getDevelopmentRequest2(req, res) {
    const requestId = req.params.id; // On suppose que vous obtenez l'ID à partir des paramètres de la requête

    const query = `
        SELECT 
            d.id AS developmentId,
            d.code AS code,
            d.raisonDevelopment, 
            d.problematique, 
            d.objectifDevelopment, 
            DATE_FORMAT(d.dateCreation, '%Y-%m-%d') AS dateCreation,
            DATE_FORMAT(d.dateObjectifMiseEnIndustrialisation, '%Y-%m-%d') AS dateObjectifMiseEnIndustrialisation,
            d.estimationDeGain AS estimationDeGain,
            d.validationBesoinCOO AS validationBesoinCOO,
            JSON_UNQUOTE(JSON_EXTRACT(d.RisqueImpact, '$')) AS RisqueImpact,
            d.estimationDeVente AS estimationDeVente,
            db.id AS baseDataId,
            db.Codewindeco AS Codewindeco,
            db.designation AS designation,
            db.consommationAnnuelle2024 AS consommationAnnuelle2024,
            db.prixActuel AS prixActuel,
            db.fournisseur AS fournisseur,
            db.designationFournisseur AS designationFournisseur,
            db.documentsQualite AS documentsQualite
        FROM demandededeveloppement d
        LEFT JOIN donneesdebase db ON d.id = db.id_demdev
        WHERE d.id = ?
    `;

    try {
        const [rows] = await db.query(query, [requestId]);

        // Regroupement des données de base par demande de développement
        const result = {
            id: rows[0].developmentId,
            code: rows[0].code,
            raisonDevelopment: rows[0].raisonDevelopment,
            problematique: rows[0].problematique,
            objectifDevelopment: rows[0].objectifDevelopment,

            dateCreation: rows[0].dateCreation,
            dateObjectifMiseEnIndustrialisation: rows[0].dateObjectifMiseEnIndustrialisation,
            estimationDeGain: rows[0].estimationDeGain,
            validationBesoinCOO: rows[0].validationBesoinCOO,
            RisqueImpact: rows[0].RisqueImpact,
            estimationDeVente: rows[0].estimationDeVente,
            donneesDeBase: []
        };

        // Ajouter les données de base associées
        rows.forEach(row => {
            if (row.baseDataId) {
                result.donneesDeBase.push({
                    id: row.baseDataId,
                    Codewindeco: row.Codewindeco,
                    designation: row.designation,
                    consommationAnnuelle2024: row.consommationAnnuelle2024,
                    prixActuel: row.prixActuel,
                    fournisseur: row.fournisseur,
                    designationFournisseur: row.designationFournisseur,
                    documentsQualite: row.documentsQualite
                });
            }
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
}

const submitDevelopmentRequest = async (req, res) => {
    const developmentId = req.params.id;
    const { formData, tasks } = req.body;
    const file = req.file ? req.file.path : null;
    try {
        const parsedFormData = JSON.parse(formData);
        const parsedTasks = JSON.parse(tasks);
        Development.saveDevelopment(developmentId, parsedFormData, (err) => {
            if (err) throw err;
        });
        for (const task of parsedTasks) {
            task.piecesJointes = file ? file : null;
            Development.saveTask(task, developmentId, (err) => {
                if (err) throw err;
            });
        }
        res.status(200).send('Demande de développement soumise avec succès !');
    } catch (error) {
        console.error('Erreur lors de la soumission :', error);
        res.status(500).send('Une erreur est survenue.');
    }
};

const updateDevelopmentRequestpart1 = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            dateObjectifMiseEnIndustrialisation,
            problematique,
            objectifDevelopment,
            raisonDeveloppement,
            code,
            status,
        } = req.body;
        const files = req.files ? req.files.map(file => file.filename) : [];
        const requestData = {
            status,
            code,
            dateObjectifMiseEnIndustrialisation,
            problematique,
            objectifDevelopment,
            raisonDeveloppement: JSON.parse(raisonDeveloppement || '[]'),
            piecesJointes: files
        };
        await findByIdAndUpdate(id, requestData);
        res.json({ message: 'Demande de développement mise à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la demande de développement:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la demande', error });
    }
};
const updateDevelopmentRequest2 = async (req, res) => {
    const id = req.params.id; 
    const {
        dateCloture,
        appreciationCloture,
        gainFinal
    } = req.body; 

    if (!dateCloture || !appreciationCloture || !gainFinal) {
        return res.status(400).json({
            message: 'Veuillez fournir toutes les données requises : dateCloture, appreciationCloture, gainFinal.'
        });
    }

    try {
        const result = await findByIdAndUpdate2(id, {
            dateCloture,
            appreciationCloture,
            gainFinal
        });
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ message: 'Demande de développement non trouvée.' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la demande de développement:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la demande de développement' });
    }
};

const findByIdAndUpdate = async (id, requestData) => {
    try {
        const {
            dateObjectifMiseEnIndustrialisation,
            problematique,
            objectifDevelopment,
            raisonDeveloppement,
            status,
            code
        } = requestData;

        await db.query(
            `UPDATE demandededeveloppement
         SET dateObjectifMiseEnIndustrialisation = ?,
             problematique = ?,
             objectifDevelopment = ?,
             raisonDevelopment = ?,
             status = ?,
             code = ?
         WHERE id = ?`,
            [
                dateObjectifMiseEnIndustrialisation,
                problematique,
                objectifDevelopment,
                JSON.stringify(raisonDeveloppement),
                status,
                code,
                id
            ]
        );
        return { success: true, message: 'Première partie mise à jour avec succès !' };
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la première partie de la demande de développement:', error);
        throw new Error('Erreur lors de la mise à jour de la première partie');
    }
};

const findByIdAndUpdate2 = async (id, requestData) => {
    try {
        const { dateCloture, appreciationCloture, gainFinal } = requestData;

        await db.query(
            `UPDATE demandededeveloppement
             SET dateReelleIndustrialisation = ?,  
                 appreciationDeveloppement = ?, 
                 gainReel = ?
             WHERE id = ?`,
            [
                dateCloture,
                appreciationCloture,
                gainFinal,
                id
            ]
        );

        return { success: true, message: 'Données de la demande de développement mises à jour avec succès !' };
    } catch (error) {
        console.error('Erreur lors de la mise à jour des données de la demande de développement:', error);
        throw new Error('Erreur lors de la mise à jour de la demande de développement');
    }
};

const getDevelopmentRequestById = async (req, res) => {
    const id = req.params.id;

    try {
        // Appel de la fonction pour récupérer les données de la demande de développement
        const result = await findById(id);

        if (result) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ message: 'Demande de développement non trouvée.' });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de la demande de développement:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la demande de développement.' });
    }
};

const findById = async (id) => {
    try {
        const [rows] = await db.query(
            `SELECT id, 
                        DATE_FORMAT(dateReelleIndustrialisation, '%Y-%m-%d') AS dateCloture,

                    appreciationDeveloppement AS appreciationCloture, 
                    gainReel AS gainFinal 
             FROM demandededeveloppement 
             WHERE id = ?`,
            [id]
        );

        if (rows.length > 0) {
            return rows[0];  // Retourne la première ligne si une demande est trouvée
        } else {
            return null;  // Aucun résultat trouvé
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données de la demande de développement:', error);
        throw new Error('Erreur lors de la récupération de la demande de développement.');
    }
};

const getDonneesDeBaseByDemDevId = async (req, res) => {
    try {
        const id_demdev = req.params.id;
        const donnees = await Development.getDonneesDeBaseByDemDevId(id_demdev);
        res.status(200).json(donnees);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des données de base' });
    }
};
const getappreciationCOOC = async (req, res) => {
    try {
        const id = req.params.id;
        const donnees = await Development.getappreciationCOO(id);
        res.status(200).json(donnees);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des données de base' });
    }
};

module.exports = {
    getDonneesDeBaseByDemDevId,
    getIdDemdevExists,
    createDevelopmentRequest,
    getDevelopmentRequest,
    getDevelopmentList,
    updateDevelopmentRequest,
    createBaseData,
    getLastSerialNumber,
    getDevelopmentRequest2,
    submitDevelopmentRequest,
    updateDevelopmentRequestpart1,
    updateBaseData, findByIdAndUpdate2, updateDevelopmentRequest2,getDevelopmentRequestById,getappreciationCOOC
};
