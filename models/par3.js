const db = require('../config/db');

class Fournisseur {
    static async create(nom_fournisseur, decisionId, connection) {
        const query = 'INSERT INTO fournisseurs (nom_fournisseur,id_desf) VALUES (?,?)';
        const [results] = await connection.query(query, [nom_fournisseur, decisionId]);
        return results.insertId;
    }
    static async update(nom_fournisseur, id, connection) {
        const query = 'UPDATE fournisseurs SET nom_fournisseur = ? WHERE id = ?';
        await connection.query(query, [nom_fournisseur, id]);
        return id;
    }
}

class Article {
    static async create(nom_article, fournisseur_id, connection) {
        const query = 'INSERT INTO articles (nom_article, fournisseur_id) VALUES (?, ?)';
        const [results] = await connection.query(query, [nom_article, fournisseur_id]);
        return results.insertId;
    }
    static async update(nom_article, id, connection) {
        const query = 'UPDATE articles SET nom_article = ? WHERE id = ?';
        await connection.query(query, [nom_article, id]);
        return id;
    }
    static async getIdByFournisseur(fournisseur_id, connection) {
        const query = 'SELECT id FROM articles WHERE fournisseur_id = ? LIMIT 1';
        const [results] = await connection.query(query, [fournisseur_id]);
        if (results.length > 0) {
            return results[0].id;
        }
        return null;
    }
}

class Certificat {
    static async create(nom_certificat, article_id, connection) {
        const query = 'INSERT INTO certificats (nom_certificat, article_id) VALUES (?, ?)';
        const [results] = await connection.query(query, [nom_certificat, article_id]);
        return results.insertId;
    }
    static async update(nom_certificat, id, connection) {
        const query = 'UPDATE certificats SET nom_certificat = ? WHERE id = ?';
        await connection.query(query, [nom_certificat, id]);
        return id;
    }
}

class Decision {
    static async create(decisions, connection) {
        const query = `INSERT INTO decisions
            (code_article, code_fournisseur, fournisseur, designation_article, 
             designation_fournisseur, prix_unitaire, unites, origine, moq, 
             seuil_approvisionnement, decision,certificationsart, id_demdev)
            VALUES ?`;

        const values = decisions.map(decision => [
            decision.codeArticle, decision.codeFournisseur, decision.fournisseur,
            decision.designationArticle, decision.designationFournisseur, decision.prixUnitaire,
            decision.unites, decision.origine, decision.moq, decision.seuilAppro,
            decision.decision, decision.certificationsart, decision.id_demdev
        ]);

        const [results] = await connection.query(query, [values]);
        return results.insertId;
    }
    static async getByDemdevId(id_demdev, connection) {
        const query = 'SELECT * FROM decisions WHERE id_demdev = ?';
        const [results] = await connection.query(query, [id_demdev]);
        return results;
    }
    
    static async update(data, id, connection) {
        const query = `
            UPDATE decisions SET
            code_article = ?, code_fournisseur = ?, fournisseur = ?, designation_article = ?, 
            designation_fournisseur = ?, prix_unitaire = ?, unites = ?, origine = ?, 
            moq = ?, seuil_approvisionnement = ?,decision = ?,certificationsart = ?
            WHERE id = ?
        `;
        const values = [
            data.codeArticle, data.codeFournisseur, data.fournisseur, data.designationArticle,
            data.designationFournisseur, data.prixUnitaire, data.unites, data.origine,
            data.moq, data.seuilAppro, data.decision, data.certificationsart, id
        ];
        await connection.query(query, values);
        return id;
    }
}
class Tache {
    static async create(data, connection) {
        const query = `INSERT INTO tache
            (tache, echeance, qui, suivi, validation, piecesJointes, decision_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            data.tache, data.echeance, data.qui, data.suivi,
            data.validation, data.piecesJointes, data.demandeDeDeveloppement_id
        ];

        const [results] = await connection.query(query, values);
        return results.insertId;
    }

    static async update(data, taskId, connection) {
        const query = `
            UPDATE tache SET
            tache = ?, echeance = ?, qui = ?, suivi = ?, validation = ?, piecesJointes = ?
            WHERE id = ? AND decision_id = ?
        `;
        const values = [
            data.tache, data.echeance, data.qui, data.suivi, data.validation, data.piecesJointes, taskId, data.demandeDeDeveloppement_id
        ];
        await connection.query(query, values);
        return taskId;
    }

    static async delete(taskId, connection) {
        const query = `DELETE FROM tache WHERE id = ?`;
        await connection.query(query, [taskId]);
    }

    static async getAllByDemandeDeDeveloppementId(demandeDeDeveloppement_id, connection) {
        const query = `SELECT * FROM tache WHERE decision_id = ?`;
        const [rows] = await connection.query(query, [demandeDeDeveloppement_id]);
        return rows;
    }
}


const getDecisionsByDemdevId = async (id_demdev) => {
    try {
        const [rows] = await db.execute(
            `
            SELECT 
              d.id AS decision_id,
              d.code_article,
              d.code_fournisseur,
              d.fournisseur,
              d.designation_article,
              d.designation_fournisseur,
              d.prix_unitaire,
              d.unites,
              d.origine,
              d.moq,
              d.seuil_approvisionnement,
      
              f.nom_fournisseur,
              a.id AS article_id,
              a.nom_article,
              c.id AS certificat_id,
              c.nom_certificat
            FROM decisions d
            LEFT JOIN fournisseurs f ON d.code_fournisseur = f.id
            LEFT JOIN articles a ON a.fournisseur_id = f.id
            LEFT JOIN certificats c ON c.article_id = a.id
            WHERE d.id_demdev = ?
            `,
            [id_demdev]
        );
        return rows;
    } catch (err) {
        throw new Error('Database query failed');
    }
};


module.exports = { Fournisseur, Article, Certificat, Decision, Tache, getDecisionsByDemdevId };
