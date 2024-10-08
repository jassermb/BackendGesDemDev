const { Fournisseur, Article, Certificat, Decision, Tache, getDecisionsByDemdevId } = require('../models/par3');
const db = require('../config/db');
const decisionModel = require('../models/par3');

exports.soumettreDemande = async (req, res) => {
    const tasks = JSON.parse(req.body.tasks);
    const decisions = JSON.parse(req.body.decisions);
    console.log('des', decisions);
    const files = req.files;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const testFilePath = files.file ? files.file[0].path : null;

        const certificationFilePaths = files.certificationsart ? files.certificationsart.map(file => file.path) : [];

        const decisionsWithCert = decisions.map(decision => ({
            ...decision,
            certificationsart: JSON.stringify(certificationFilePaths),
        }));

        const decisionId = await Decision.create(decisionsWithCert, connection);

        if (!decisionId) {
            throw new Error("Failed to create decision.");
        }
        if (!Array.isArray(tasks) || tasks.length === 0) {
            throw new Error("No tasks provided.");
        }

        const taskPromises = tasks.map(task => Tache.create({
            tache: task.task,
            echeance: task.echeance,
            qui: task.qui,
            suivi: task.suivi,
            validation: task.validation,
            piecesJointes: testFilePath,
            demandeDeDeveloppement_id: task.id_demdev
        }, connection));

        await Promise.all(taskPromises);

        await connection.commit();
        res.status(200).json({ message: 'Development request successfully submitted!' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error during submission:', error);
        res.status(500).json({ message: 'An error occurred during submission.' });
    } finally {
        if (connection) connection.release();
    }
};



const handleDecisions = async (decisions, id_demdev, connection) => {
    const existingDecisions = await Decision.getByDemdevId(id_demdev, connection);
    const existingDecisionIds = new Set(existingDecisions.map(d => d.id));
    const incomingDecisionIds = new Set(decisions.map(d => d.id));
    const decisionsToDelete = existingDecisions.filter(d => !incomingDecisionIds.has(d.id));
    const decisionsToUpdate = decisions.filter(d => existingDecisionIds.has(d.id));
    const decisionsToAdd = decisions.filter(d => !existingDecisionIds.has(d.id));

    await Promise.all(decisionsToDelete.map(decision =>
        connection.query('DELETE FROM decisions WHERE id = ?', [decision.id])
    ));
    await Promise.all(decisionsToUpdate.map(decision =>
        Decision.update(decision, decision.id, connection)
    ));
    await Promise.all(decisionsToAdd.map(decision =>
        Decision.create([decision], connection)
    ));
};

exports.mettreAJourDemande = async (req, res) => {
    const formData = JSON.parse(req.body.formData);
    console.log('formData', formData);
    const tasks = JSON.parse(req.body.tasks);
    console.log('tasks', tasks);

    const decisions = JSON.parse(req.body.decisions);
    console.log('decisions', decisions);

    const file = req.file;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        await handleDecisions(decisions, formData.id_demdev, connection);

        const fournisseurPromises = [
            formData.fournisseur1 ? Fournisseur.update(formData.fournisseur1, formData.id_fournisseur1, connection) : null,
            formData.fournisseur2 ? Fournisseur.update(formData.fournisseur2, formData.id_fournisseur2, connection) : null,
            formData.fournisseur3 ? Fournisseur.update(formData.fournisseur3, formData.id_fournisseur3, connection) : null
        ];
        await Promise.all(fournisseurPromises);

        const articlePromises = [
            formData.article1 ? Article.update(formData.article1, formData.id_article1, connection) : null,
            formData.article2 ? Article.update(formData.article2, formData.id_article2, connection) : null,
            formData.article3 ? Article.update(formData.article3, formData.id_article3, connection) : null
        ];
        await Promise.all(articlePromises);

        const certificatPromises = [
            formData.certificat1 ? Certificat.update(formData.certificat1, formData.id_certificat1, connection) : null,
            formData.certificat2 ? Certificat.update(formData.certificat2, formData.id_certificat2, connection) : null,
            formData.certificat3 ? Certificat.update(formData.certificat3, formData.id_certificat3, connection) : null
        ];
        await Promise.all(certificatPromises);

        const piecesJointes = file ? file.path : null;

        const existingTasks = await Tache.getAllByDemandeDeDeveloppementId(formData.id_demdev, connection);

        const existingTasksMap = new Map(existingTasks.map(task => [task.id, task]));

        const tasksToDelete = existingTasks.filter(task => !tasks.some(t => t.id === task.id));
        const tasksToUpdate = tasks.filter(task => existingTasksMap.has(task.id));
        const tasksToCreate = tasks.filter(task => !existingTasksMap.has(task.id));

        await Promise.all(tasksToDelete.map(task => Tache.delete(task.id, connection)));

        await Promise.all(tasksToUpdate.map(task => Tache.update({
            tache: task.task,
            echeance: task.echeance,
            qui: task.qui,
            suivi: task.suivi,
            validation: task.validation,
            piecesJointes: piecesJointes,
            demandeDeDeveloppement_id: task.id_demdev
        }, task.id, connection)));

        await Promise.all(tasksToCreate.map(task => Tache.create({
            tache: task.task,
            echeance: task.echeance,
            qui: task.qui,
            suivi: task.suivi,
            validation: task.validation,
            piecesJointes: piecesJointes,
            demandeDeDeveloppement_id: task.id_demdev
        }, connection)));

        await connection.commit();
        res.status(200).json({ message: 'Development request successfully updated!' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error during update:', error);
        res.status(500).json({ message: 'An error occurred during update.' });
    } finally {
        if (connection) connection.release();
    }
};






exports.getDemandeDetails = async (req, res) => {
    const { id_demdev } = req.params;

    try {
        const [decisions] = await db.execute(`
            SELECT 
                d.id, d.code_article, d.code_fournisseur, d.fournisseur, d.designation_article, 
                d.designation_fournisseur, d.prix_unitaire, d.unites, d.origine, d.moq, 
                d.seuil_approvisionnement,d.certificationsart,d.decision
            FROM decisions d
            WHERE d.id_demdev = ?
        `, [id_demdev]);

        if (decisions.length === 0) {
            return res.status(404).json({ message: 'No decisions found' });
        }


        const [tasks] = await db.execute(`
           SELECT 
             t.id,
             t.tache, 
             DATE_FORMAT(t.echeance, '%Y-%m-%d') AS 'echeance', 
             t.qui, 
             DATE_FORMAT(t.suivi, '%Y-%m-%d') AS 'suivi', 
             t.validation, 
             t.piecesJointes
           FROM tache t
           WHERE t.decision_id = ?
        `, [id_demdev]);

        const response = {
            decisions: decisions.map(decision => ({
                id: decision.id,
                codeArticle: decision.code_article,
                codeFournisseur: decision.code_fournisseur,
                fournisseur: decision.fournisseur,
                designationArticle: decision.designation_article,
                designationFournisseur: decision.designation_fournisseur,
                prixUnitaire: decision.prix_unitaire,
                unites: decision.unites,
                origine: decision.origine,
                moq: decision.moq,
                decision: decision.decision,
                certificationsart: decision.certificationsart,
                seuilAppro: decision.seuil_approvisionnement,
                validationAcheteur: decision.validation_acheteur,
                validationCoo: decision.validation_coo
            })),

            tasks: tasks.map(task => ({
                id: task.id,
                task: task.tache,
                echeance: task.echeance,
                qui: task.qui,
                suivi: task.suivi,
                validation: task.validation,
                piecesJointes: task.piecesJointes
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching demande details:', error);
        res.status(500).json({ message: 'An error occurred while fetching demande details.' });
    }
};

