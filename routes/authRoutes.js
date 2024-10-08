const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const Notification = require('../models/notifications');
const notificationController = require('../controllers/notificationController')
const db = require('../config/db'); 
router.get('/rejection-comments/:id_dem', notificationController.getRejectionCommentsByIdDem);
router.get('/rejection-commentscoo/:id_dem', notificationController.getRejectioncooCommentsByIdDem);
router.get('/rejection-commentsresachat/:id_dem', notificationController.getRejectionresachatCommentsByIdDem);

router.post('/register', userController.createUser);
router.post('/create-notification', async (req, res) => {
    try {
        const { userId, role, receiverRole, type, message, id_dem } = req.body;
        console.log('Received data for notification creation:', { userId, role, receiverRole, type, message, id_dem });
        if (!userId || !role || !receiverRole || !type || !message || !id_dem) {
            return res.status(400).json({ msg: 'Missing required fields', data: req.body });
        }
        const newNotification = await Notification.create({
            userId,
            role,
            receiverRole,
            type,
            message,
            status: 'pending',
            id_dem
        });
        res.status(201).json(newNotification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ msg: 'Error creating notification', error: error.message });
    }
});

router.put('/validationcoo/:id', async (req, res) => {
    const { id } = req.params;
    const { validationCOO, status } = req.body;


    const sql = 'UPDATE demandededeveloppement SET validationCOO = ?, status = ? WHERE id = ?';
    try {
        const [result] = await db.execute(sql, [validationCOO, status, id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ msg: 'Validation mise à jour avec succès' });
        } else {
            res.status(404).json({ msg: 'Demande de développement non trouvée' });
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour de la validation', err);
        res.status(500).json({ msg: 'Erreur lors de la mise à jour de la validation' });
    }
});

router.put('/validationresachat/:id', async (req, res) => {
    const { id } = req.params;
    const { Validationresachat,status } = req.body;
    console.log('',Validationresachat, id);
    const sql = 'UPDATE demandededeveloppement SET Validationresachat = ? , status = ?  WHERE id = ?';
    try {
        const [result] = await db.execute(sql, [Validationresachat,status, id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ msg: 'Validation mise à jour avec succès' });
        } else {
            res.status(404).json({ msg: 'Demande de développement non trouvée' });
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour de la validation', err);
        res.status(500).json({ msg: 'Erreur lors de la mise à jour de la validation' });
    }
});

router.put('/validationchefprod/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const sql = 'UPDATE demandededeveloppement SET  status = ?  WHERE id = ?';
    try {
        const [result] = await db.execute(sql, [status, id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ msg: 'Validation mise à jour avec succès' });
        } else {
            res.status(404).json({ msg: 'Demande de développement non trouvée' });
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour de la validation', err);
        res.status(500).json({ msg: 'Erreur lors de la mise à jour de la validation' });
    }
});
router.put('/validationcoofinal/:id', async (req, res) => {
    const { id } = req.params;
    const { status,appreciationcoo } = req.body;
    const sql = 'UPDATE demandededeveloppement SET status = ?,appreciationCOO = ? WHERE id = ?';
    try {
        const [result] = await db.execute(sql, [status,appreciationcoo, id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ msg: 'Validation mise à jour avec succès' });
        } else {
            res.status(404).json({ msg: 'Demande de développement non trouvée' });
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour de la validation', err);
        res.status(500).json({ msg: 'Erreur lors de la mise à jour de la validation' });
    }
});
router.get('/notifications/:receiverRole', async (req, res) => {
    const { receiverRole } = req.params;
    try {
        let notifications;
        if (receiverRole === 'coo') {
            notifications = await Notification.findByRoleAndValidation(receiverRole);
        } else if (receiverRole === 'chefdeproduit') {
            notifications = await Notification.findByRoleAndValidation(receiverRole);
        } else if (receiverRole === 'responsableachat') {
            notifications = await Notification.findByRoleAndValidation(receiverRole);
        } 
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ msg: 'Erreur lors de la récupération des notifications', error: error.message });
    }
});
router.put('/:notificationId', async (req, res) => {
    const { notificationId } = req.params;
    const query = 'UPDATE notifications SET status = "read" WHERE id = ?';
    try {
        await db.query(query, [notificationId]);
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error('Error updating notification status:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/login', userController.login);

module.exports = router;
