const db = require('../../config/db');

// 🏢 Récupérer la liste des entreprises (Recruteurs) certifiées
exports.getAllVerifiedCompanies = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id, name, company_name, company_bio, company_logo, address, email, phone 
            FROM users 
            WHERE role = 'recruiter' AND is_verified_company = 1
            ORDER BY company_name ASC
        `);
        
        return res.status(200).json({ companies: rows });
    } catch (error) {
        console.error("❌ Erreur récupération entreprises :", error.message);
        return res.status(500).json({ message: "Erreur lors de la récupération des entreprises." });
    }
};