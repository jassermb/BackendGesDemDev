const db = require('../config/db');

const createDevelopmentRequest = async (data) => {
    const query = `INSERT INTO demandededeveloppement 
                   (dateObjectifMiseEnIndustrialisation, raisonDevelopment, problematique, objectifDevelopment, dateCreation,code, id_demondeur)
                   VALUES (?, ?, ?, ?, ?,?, ?)`;
    try {
        const [result] = await db.query(query, [
            data.dateObjectifMiseEnIndustrialisation,
            data.raisonDeveloppement,
            data.problematique,
            data.objectifDevelopment,
            data.createdAt,
            data.code,
            data.id_demondeur,
        ]);

        return result;
    } catch (err) {
        console.error('Erreur SQL :', err);
        throw err;
    }
};

const getDevelopmentRequestById = async (id) => {
    const query = `
        SELECT 
            DATE_FORMAT(d.dateObjectifMiseEnIndustrialisation, '%Y-%m-%d') AS 'dateObjectifMiseEnIndustrialisation',
            d.raisonDevelopment, 
            d.problematique, 
            d.objectifDevelopment, 
            d.code,
            DATE_FORMAT(d.dateCreation, '%Y-%m-%d') AS 'dateCreation',
            d.validationCOO, 
            n.role AS creatorRole,
            n.receiverRole AS receiverRole
        FROM demandededeveloppement d
        JOIN notifications n ON d.id = n.id_dem
        WHERE d.id = ? `;
    const [rows] = await db.query(query, [id]);
    return rows[0];
};

const getDevelopmentRequest2ById = async (id) => {
    try {
        const query = `
            SELECT 
                d.id AS id,
                d.code AS code,
                DATE_FORMAT(d.dateCreation, '%Y-%m-%d') AS 'dateCreation',
                d.gravite AS gravite,
                d.estimationDeGain AS estimationDeGain,
                d.validationBesoinCOO AS validationBesoinCOO,
                JSON_EXTRACT(d.RisqueImpact, '$') AS RisqueImpact,  // Assurez-vous que cela extrait les données en JSON
                d.planAction AS planAction,
                db.designation AS designation,
                db.consommationAnnuelle2024 AS consommationAnnuelle2024,
                db.prixActuel AS prixActuel,
                db.fournisseur AS fournisseur,
                db.designationFournisseur AS designationFournisseur,
                db.documentsQualite AS documentsQualite,
                db.estimationDeVente AS estimationDeVente
            FROM demandededeveloppement d
            LEFT JOIN donneesdebase db ON d.id = db.id_demdev
            WHERE d.id = ?
        `;
        const [rows] = await db.query(query, [id]);       
        if (rows.length === 0) {
            throw new Error('No data found');
        } 
        const data = rows[0];
        data.RisqueImpact = JSON.parse(data.RisqueImpact || '[]'); 
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de la demande:', error);
        throw error;
    }
};


const saveDevelopment = (developmentId, formData, callback) => {
    const sql = `
        INSERT INTO decision (
            id, articles, fournisseurs, codeArticle, codeFournisseur, designationArticle, designationFournisseur, prixUnitaire, origine, moq, seuilApprovisionnement
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        developmentId,
        JSON.stringify(formData.articles), // JSON.stringify pour convertir l'objet en chaîne JSON
        JSON.stringify(formData.fournisseurs),
        formData.codeArticle,
        formData.codeFournisseur,
        formData.designationArticle,
        formData.designationFournisseur,
        formData.prixUnitaire,
        formData.origine,
        formData.moq,
        formData.seuilApprovisionnement
    ];
    db.query(sql, values, callback);
};


const saveTask = (task, developmentId, callback) => {
    const sql = 'INSERT INTO tache (tache, echeance, qui, suivi, validation, demandeDeDeveloppement_id, piecesJointes) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [task.task, task.echeance, task.qui, task.suivi, task.validation, developmentId, task.piecesJointes];
    db.query(sql, values, callback);  
};
const findByIdAndUpdate = async (id, requestData) => {
    try {
        const {
            dateObjectifMiseEnIndustrialisation,
            problematique,
            objectifDevelopment,
            raisonDeveloppement,
            piecesJointes
        } = requestData;

        await db.query(
            `UPDATE demandededeveloppement
             SET dateObjectifMiseEnIndustrialisation = ?,
                 problematique = ?,
                 objectifDevelopment = ?,
                 raisonDeveloppement = ?,
                 piecesJointes = ?
             WHERE id = ?`,
            [
                dateObjectifMiseEnIndustrialisation,
                problematique,
                objectifDevelopment,
                JSON.stringify(raisonDeveloppement),
                piecesJointes ? piecesJointes.join(',') : null, 
                id
            ]
        );

        return { success: true, message: 'Première partie mise à jour avec succès !' };
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la première partie de la demande de développement:', error);
        throw new Error('Erreur lors de la mise à jour de la première partie');
    }
};
const getDonneesDeBaseByDemDevId = async (id_demdev) => {
    const query = 'SELECT * FROM donneesdebase WHERE id_demdev = ?';
    try {
        const [results] = await db.query(query, [id_demdev]);
        return results;
    } catch (err) {
        console.error('Erreur lors de la récupération des données de base:', err);
        throw err;
    }
};
  
const getappreciationCOO = async (id) => {
    const query = 'SELECT appreciationCOO FROM demandededeveloppement WHERE id = ?';
    try {
        const [results] = await db.query(query, [id]);
        return results;
    } catch (err) {
        console.error('Erreur lors de la récupération appreciationCOO', err);
        throw err;
    }
};

module.exports = {
    createDevelopmentRequest, getDevelopmentRequestById,getDevelopmentRequest2ById,saveDevelopment,saveTask,findByIdAndUpdate,getDonneesDeBaseByDemDevId,getappreciationCOO
};
