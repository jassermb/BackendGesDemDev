const db = require('../config/db'); 

const Notification = {};

Notification.create = (data) => {
    const { userId, role, receiverRole, type, message, status, id_dem } = data;
    if (!userId || !role || !receiverRole || !type || !message || !id_dem) {
        return Promise.reject(new Error('Missing required fields'));
    }
    const safeRole = role || 'defaultRole';
    const safeReceiverRole = receiverRole || 'defaultReceiverRole';
    const safeType = type || 'defaultType';
    const safeMessage = message || '';
    const safeStatus = status || 'pending';
    const safeIdDem = id_dem || null;

    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO notifications (userId, role, receiverRole, type, message, status, id_dem) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.execute(sql, [userId, safeRole, safeReceiverRole, safeType, safeMessage, safeStatus, safeIdDem], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

Notification.findByRoleAndValidationMultiple = async (role, validationCOOArray) => {
    if (!Array.isArray(validationCOOArray)) {
        throw new Error('validationCOOArray must be an array');
    }
    const placeholders = validationCOOArray.map(() => '?').join(',');
    const sql = `
        SELECT n.*,d.code
        FROM notifications n
        JOIN demandededeveloppement d ON n.id_dem = d.id
        WHERE n.receiverRole = ?
        AND n.status='pending'
        AND d.validationCOO IN (${placeholders})
        ORDER BY n.createdAt DESC
    `;

    try {
        const [rows] = await db.execute(sql, [role, ...validationCOOArray]); 
        return rows;
    } catch (err) {
        throw err;
    }
};



Notification.findByRoleAndValidation = async (role) => {
    const sql = `
        SELECT n.*,d.code
        FROM notifications n
        JOIN demandededeveloppement d ON n.id_dem = d.id
        WHERE n.receiverRole = ?
        AND n.status='pending'
        ORDER BY n.createdAt DESC
    `;
    try {
        const [rows] = await db.execute(sql, [role]);
        return rows;
    } catch (err) {
        throw err;
    }
};

Notification.findByRole = async (role) => {
    const sql = `
        SELECT n.*,d.code
        FROM notifications n
        JOIN demandededeveloppement d ON n.id_dem = d.id
        WHERE n.receiverRole = ?
        AND n.status='pending'
        ORDER BY n.createdAt DESC
    `;
    try {
        const [rows] = await db.execute(sql, [role]);
        return rows;
    } catch (err) {
        throw err;
    }
};
Notification.getRejectionCommentsByIdDem = async (id_dem) => {
    const sql = `
        SELECT id, message 
        FROM notifications 
        WHERE type = 'rejetchefprod' AND id_dem = ?
    `;
    const [rows] = await db.query(sql, [id_dem]);
    return rows;
};
Notification.getRejectionresachatCommentsByIdDem = async (id_dem) => {
    const sql = `
        SELECT id, message 
        FROM notifications 
        WHERE type = 'rejetresachat' AND id_dem = ?
    `;
    const [rows] = await db.query(sql, [id_dem]);
    return rows;
};
Notification.getRejectioncooCommentsByIdDem = async (id_dem) => {
    const sql = `
        SELECT id, message 
        FROM notifications 
        WHERE type = 'rejetcoo2' AND id_dem = ?
    `;
    const [rows] = await db.query(sql, [id_dem]);
    return rows;
};
module.exports = Notification;


