// controllers/userWithVerification.js
const { User } = require("../models");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { agregarContexto } = require('../middlewares/contextMiddleware');

const SECRET = process.env.JWT_SECRET || 'misecreto';

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validación adicional en el controlador (sanitización)
        const cleanUsername = username.trim().replace(/\s+/g, '');
        const cleanEmail = email ? email.trim().replace(/\s+/g, '') : null;

        if (!cleanEmail) {
            return res.status(400).json({
                success: false,
                message: 'El email es requerido para el registro'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Agregar contexto de la operación
        const opciones = agregarContexto(req);

        // Crear usuario con email no verificado
        const user = await User.create({
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword,
            isAdmin: false,
            estado: 'activo',
            emailVerified: false // Importante: email no verificado inicialmente
        }, opciones);

        // NO generar token JWT todavía - solo después de verificación
        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente. Por favor verifica tu email.',
            user: userResponse,
            requiresEmailVerification: true,
            email: cleanEmail
        });

    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: error.errors.map(e => e.message)
            });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'El username o email ya está en uso'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.trim().replace(/\s+/g, '');

        const user = await User.findOne({ where: { email: cleanEmail } });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const compare = await bcrypt.compare(password, user.password);
        if (!compare) {
            return res.status(400).json({
                success: false,
                message: "Usuario o contraseña incorrecta"
            });
        }

        // Verificar si el usuario está inactivo
        if (user.estado !== 'activo') {
            return res.status(403).json({
                success: false,
                message: "Cuenta desactivada, cualquier cosa contacte a soporte."
            });
        }

        // IMPORTANTE: Verificar si el email está verificado
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                requiresEmailVerification: true,
                message: "Debes verificar tu email antes de iniciar sesión",
                email: user.email
            });
        }

        // Generar token JWT solo si el email está verificado
        const token = jwt.sign(
            { userId: user.id, email: user.email, isAdmin: user.isAdmin },
            SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            message: "Inicio de sesión exitoso",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                estado: user.estado,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Función para verificar email y marcarlo como verificado
const confirmEmailVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // Marcar email como verificado
        await user.update({ emailVerified: true });

        // Generar token JWT ya que el email está verificado
        const token = jwt.sign(
            { userId: user.id, email: user.email, isAdmin: user.isAdmin },
            SECRET,
            { expiresIn: '8h' }
        );

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.json({
            success: true,
            message: "Email verificado correctamente",
            user: userResponse,
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    registerUser,
    login,
    confirmEmailVerification
};