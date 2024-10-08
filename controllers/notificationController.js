const Notification = require('../models/notifications');

const getRejectionCommentsByIdDem = async (req, res) => {
    try {
        const { id_dem } = req.params;
        const notifications = await Notification.getRejectionCommentsByIdDem(id_dem);

        const rejectionComments = notifications.map(notification => {
            const regex = /Raison : (.+)/;
            const match = notification.message.match(regex);
            return {
                id: notification.id,
                reason: match ? match[1] : 'Aucune raison spécifiée',
            };
        });

        res.status(200).json(rejectionComments);
    } catch (error) {
        console.error('Erreur lors de la récupération des raisons de rejet:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des raisons de rejet' });
    }
}; // getRejectionresachatCommentsByIdDem
const getRejectionresachatCommentsByIdDem = async (req, res) => {
    try {
        const { id_dem } = req.params;
        const notifications = await Notification.getRejectionresachatCommentsByIdDem(id_dem);

        const rejectionComments = notifications.map(notification => {
            const regex = /Raison : (.+)/;
            const match = notification.message.match(regex);
            return {
                id: notification.id,
                reason: match ? match[1] : 'Aucune raison spécifiée',
            };
        });

        res.status(200).json(rejectionComments);
    } catch (error) {
        console.error('Erreur lors de la récupération des raisons de rejet:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des raisons de rejet' });
    }
};
const getRejectioncooCommentsByIdDem = async (req, res) => {
    try {
        const { id_dem } = req.params;
        const notifications = await Notification.getRejectioncooCommentsByIdDem(id_dem);

        const rejectionComments = notifications.map(notification => {
            const regex = /Raison : (.+)/;
            const match = notification.message.match(regex);
            return {
                id: notification.id,
                reason: match ? match[1] : 'Aucune raison spécifiée',
            };
        });

        res.status(200).json(rejectionComments);
    } catch (error) {
        console.error('Erreur lors de la récupération des raisons de rejet:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des raisons de rejet' });
    }
};
module.exports = {
    getRejectionCommentsByIdDem,getRejectioncooCommentsByIdDem,getRejectionresachatCommentsByIdDem
};
