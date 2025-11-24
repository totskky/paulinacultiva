const jwt = require('jsonwebtoken')
const SECRET = process.env.JWT_SECRET || 'misecreto'
const { User } = require("../models")

const isAuth = async (req, res, next) => {

    const authHeader = req.headers['authorization']
    if (!authHeader) return res.status(401).json({ message: "Token no proporcionado" })

    // Extraer el token (quitar "Bearer ")
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader


    jwt.verify(token, SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token inválido o expirado" })
        }


        const user = await User.findByPk(decoded.userId || decoded.id)
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }


        req.user = user
        req.userId = user.id
        next()
    })
}

const isAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "No autenticado" })
    if (req.user.role !== 'moderator') return res.status(403).json({ message: "No tenes permisos de moderador" })
    next()
}

const checkUserStatus = (req, res, next) => {
  if (req.user.estado !== 'activo') {
    return res.status(403).json({ message: `Usuario ${req.user.estado}, acceso denegado` });
  }
  next();
};

module.exports = {
    isAuth,
    isAdmin,
    checkUserStatus
}