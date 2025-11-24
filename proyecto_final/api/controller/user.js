// controllers/userController.js
const { User, Post, Comment, Favorite, Notification } = require("../models")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { agregarContexto } = require('../middlewares/contextMiddleware')
const nodemailer = require('nodemailer')
const { Op } = require('sequelize')

const SECRET = process.env.JWT_SECRET || 'misecreto'

const getActiveUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } })
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getActiveUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body

        // Validación adicional en el controlador (sanitización)
        const cleanUsername = username.trim().replace(/\s+/g, '');
        const cleanEmail = email ? email.trim().replace(/\s+/g, '') : null;

        if (!cleanEmail) {
            return res.status(400).json({
                success: false,
                message: 'El email es requerido para el registro'
            })
        }

        // Verificar si el email ya está en uso
        const existingUser = await User.findOne({ where: { email: cleanEmail } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Verificar si el username ya está en uso
        const existingUsername = await User.findOne({ where: { username: cleanUsername } });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya está en uso'
            });
        }

        // Validaciones básicas
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Generar un código de verificación único
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Almacenar temporalmente los datos del registro (podríamos usar Redis o memoria temporal)
        // Por ahora, usaremos un sistema simple en memoria - en producción esto debería ser Redis
        if (!global.tempRegistrations) {
            global.tempRegistrations = new Map();
        }

        const tempData = {
            username: cleanUsername,
            email: cleanEmail,
            password: password, // Guardaremos la contraseña sin hashear temporalmente
            verificationCode: verificationCode,
            timestamp: Date.now()
        };

        global.tempRegistrations.set(cleanEmail, tempData);

        // Enviar email de verificación
        try {

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: `"Paulina Cultiva" <${process.env.FROM_EMAIL}>`,
                to: cleanEmail,
                subject: 'Código de Verificación - Paulina Cultiva',
                html: `
                    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <div style="background: linear-gradient(135deg, #d13727, #8b1e14); padding: 30px 20px; text-align: center; color: white;">
                                <h1 style="font-size: 32px; margin: 0; font-weight: bold;">🌱 Paulina Cultiva</h1>
                                <p style="font-size: 18px; margin: 10px 0 0; opacity: 0.9;">Verificación de Email</p>
                            </div>

                            <div style="padding: 40px 20px;">
                                <p style="font-size: 18px; color: #333; margin-bottom: 20px; text-align: center;">
                                    ¡Hola! 👋
                                </p>

                                <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                                    Gracias por registrarte en Paulina Cultiva. Para completar tu registro, ingresa el siguiente código de 6 dígitos en la aplicación:
                                </p>

                                <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #d13727; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                    <div style="font-size: 36px; font-weight: bold; color: #d13727; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                        ${verificationCode}
                                    </div>
                                </div>

                                <div style="background: #fef6f0; border-left: 4px solid #f76c5e; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                                    <h3 style="margin-top: 0; color: #d13727; font-size: 16px;">Pasos a seguir:</h3>
                                    <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
                                        <li>Copia el código de 6 dígitos que aparece arriba</li>
                                        <li>Ingresa el código en la aplicación de Paulina Cultiva</li>
                                        <li>Listo! Tu cuenta quedará verificada y activa</li>
                                        <li>Comienza a compartir tus recetas y sabores</li>
                                    </ol>
                                </div>

                                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                    <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
                                        🔒 <strong>Seguridad:</strong> Este código expirará en 1 hora. Si no creaste esta cuenta, ignora este email.
                                    </p>
                                </div>
                            </div>

                            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                                <p style="margin: 0; color: #666; font-size: 14px;">
                                    ¡Cultivando sabores juntos con ❤️
                                </p>
                                <p style="margin: 10px 0 0; color: #999; font-size: 12px;">
                                    © 2024 Paulina Cultiva • Todos los derechos reservados
                                </p>
                            </div>
                        </div>
                    </body>
                `
            };

            await transporter.sendMail(mailOptions);
  
        } catch (emailError) {
            console.error('❌ Error al enviar email de verificación:', emailError.message);

            // Eliminar registro temporal si falla el envío del email
            global.tempRegistrations.delete(cleanEmail);

            return res.status(500).json({
                success: false,
                message: 'Error al enviar email de verificación. Por favor, intenta nuevamente.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Por favor, revisa tu email y verifica tu cuenta para completar el registro.',
            verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        });

    } catch (error) {
        console.error('Error en registro:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const cleanEmail = email.trim().replace(/\s+/g, '');

        const user = await User.findOne({ where: { email: cleanEmail } })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Usuario no encontrado"
            })
        }

        const compare = await bcrypt.compare(password, user.password)
        if (!compare) {
            return res.status(400).json({
                success: false,
                message: "Usuario o contraseña incorrecta"
            })
        }

        // Verificar si el usuario está inactivo
        if (user.estado === 'inactivo') {
            return res.status(403).json({
                success: false,
                message: "Cuenta desactivada, cualquier cosa contacte a soporte."
            })
        }

        // Verificar si el email está verificado
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Por favor, verifica tu email antes de iniciar sesión."
            })
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, isAdmin: user.isAdmin },
            SECRET,
            { expiresIn: '8h' }
        )

        res.json({
            success: true,
            message: "Inicio de sesión exitoso",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                estado: user.estado
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const me = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } })
        res.json(user)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const createAdmin = async (req, res) => {
    try {
        const { username, password } = req.body

        const existingAdmin = await User.findOne({ where: { isAdmin: true } })
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Ya existe un administrador"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await User.create({
            username,
            password: hashedPassword,
            isAdmin: true,
            estado: 'activo'
        })

        res.status(201).json({
            success: true,
            message: "Administrador creado correctamente"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        const userId = req.user.id

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "La contraseña actual y la nueva son requeridas"
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "La nueva contraseña debe tener al menos 6 caracteres"
            })
        }

        // Buscar usuario
        const user = await User.findByPk(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            })
        }

        // Verificar contraseña actual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "La contraseña actual es incorrecta"
            })
        }

        // Hashear nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)

        // Actualizar contraseña
        await user.update({ password: hashedNewPassword })

        res.json({
            success: true,
            message: "Contraseña actualizada correctamente"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body
        const userId = req.user.id

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "La contraseña es requerida para desactivar la cuenta"
            })
        }

        // Buscar usuario
        const user = await User.findByPk(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            })
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "La contraseña es incorrecta"
            })
        }

        // Marcar como inactivo en lugar de eliminar
        await user.update({
            estado: 'inactivo',
            emailVerified: false // También invalidar email verification
        })

        res.json({
            success: true,
            message: "Cuenta desactivada correctamente"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Nueva función para desactivar cuenta sin contraseña (para el frontend)
const deactivateAccount = async (req, res) => {
    try {
        const userId = req.user.id

        // Buscar usuario
        const user = await User.findByPk(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            })
        }

        // Marcar como inactivo y invalidar email
        await user.update({
            estado: 'inactivo',
            emailVerified: false
        })

        // Desactivar todas las publicaciones del usuario
        await Post.update(
            { estado: 'inactivo' },
            { where: { autorId: userId } }
        )

        // Desactivar todos los comentarios del usuario
        await Comment.update(
            { estado: 'inactivo' },
            { where: { autorId: userId } }
        )

        res.json({
            success: true,
            message: "Cuenta desactivada correctamente"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const updateUsername = async (req, res) => {
    try {
        const { username } = req.body
        const userId = req.user.id

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "El nuevo nombre de usuario es requerido"
            })
        }

        // Validar formato del nuevo username
        const cleanUsername = username.trim().replace(/\s+/g, '');

        // Validaciones básicas
        if (!cleanUsername) {
            return res.status(400).json({
                success: false,
                message: "El nombre de usuario no puede estar vacío"
            })
        }

        // Validar que no tenga espacios
        if (/\s/.test(cleanUsername)) {
            return res.status(400).json({
                success: false,
                message: "El nombre de usuario no puede contener espacios"
            })
        }

        // Validar caracteres permitidos
        const regex = /^[a-zA-Z0-9_-]+$/;
        if (!regex.test(cleanUsername)) {
            return res.status(400).json({
                success: false,
                message: "El nombre de usuario solo puede contener letras, números, guiones (-) y guiones bajos (_)"
            })
        }

        // Validar longitud
        if (cleanUsername.length < 3 || cleanUsername.length > 50) {
            return res.status(400).json({
                success: false,
                message: "El nombre de usuario debe tener entre 3 y 50 caracteres"
            })
        }

        // Buscar usuario actual
        const user = await User.findByPk(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            })
        }

        // No se requiere validación de contraseña para cambiar username

        // Verificar que no sea el mismo username actual
        if (cleanUsername === user.username) {
            return res.status(400).json({
                success: false,
                message: "El nuevo nombre de usuario debe ser diferente al actual"
            })
        }

        // Verificar que el nuevo username no esté en uso
        const existingUser = await User.findOne({
            where: { username: cleanUsername }
        })

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Este nombre de usuario ya está en uso"
            })
        }

        // Actualizar username
        await user.update({ username: cleanUsername })

        res.json({
            success: true,
            message: "Nombre de usuario actualizado correctamente",
            username: cleanUsername
        })

    } catch (error) {
        console.error('Error en updateUsername:', error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email y código de verificación son requeridos'
            });
        }

        const cleanEmail = email.trim().replace(/\s+/g, '');

        // Primero verificar si el usuario ya existe en la base de datos
        const existingUser = await User.findOne({ where: { email: cleanEmail } });

        if (existingUser && existingUser.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya ha sido verificado'
            });
        }

        // Verificar si tenemos datos temporales para este registro
        if (!global.tempRegistrations || !global.tempRegistrations.has(cleanEmail)) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un registro pendiente para este email. Por favor, inicia el registro nuevamente.'
            });
        }

        const tempData = global.tempRegistrations.get(cleanEmail);

        // Verificar si el registro temporal ha expirado (1 hora)
        if (Date.now() - tempData.timestamp > 3600000) {
            global.tempRegistrations.delete(cleanEmail);
            return res.status(400).json({
                success: false,
                message: 'El registro ha expirado. Por favor, inicia el registro nuevamente.'
            });
        }

        // Depuración: mostrar códigos para comparar
  
        // Verificar si el código es correcto
        const cleanCode = code.toString().trim();
        const storedCode = tempData.verificationCode ? tempData.verificationCode.toString().trim() : '';

        if (cleanCode !== storedCode) {
            return res.status(400).json({
                success: false,
                message: 'Código de verificación incorrecto'
            });
        }

        // Si ya existe un usuario pendiente en la BD, eliminarlo
        if (existingUser) {
            await User.destroy({ where: { id: existingUser.id } });
        }

        // Crear el usuario en la base de datos
        const hashedPassword = await bcrypt.hash(tempData.password, 10);

        const user = await User.create({
            username: tempData.username,
            email: tempData.email,
            password: hashedPassword,
            isAdmin: false,
            estado: 'activo',
            emailVerified: true
        });

        // Eliminar datos temporales
        global.tempRegistrations.delete(cleanEmail);

        // Generar token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, isAdmin: user.isAdmin },
            SECRET,
            { expiresIn: '8h' }
        );

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: '¡Registro completado exitosamente! Tu cuenta ha sido creada y verificada.',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Error en verificación de email:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        const cleanEmail = email.trim().replace(/\s+/g, '');

        const user = await User.findOne({ where: { email: cleanEmail } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No existe ninguna cuenta con ese email. Verifica el email o regístrate si aún no tienes cuenta.'
            });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetCodeExpires = new Date(Date.now() + 3600000);

        await user.update({
            passwordResetCode: resetCode,
            passwordResetCodeExpires: resetCodeExpires
        });

        try {
        
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Email con diseño idéntico al de verificación pero con instrucciones de recuperación
            const emailHTML = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recuperación de Contraseña - Paulina Cultiva</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
                <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div class="header" style="background: linear-gradient(135deg, #d13727, #8b1e14); padding: 30px 20px; text-align: center; color: white;">
                    <h1 style="font-size: 32px; margin: 0; font-weight: bold;">🌱 Paulina Cultiva</h1>
                    <p style="font-size: 18px; margin: 10px 0 0; opacity: 0.9;">Recuperación de Contraseña</p>
                  </div>

                  <div class="content" style="padding: 40px 20px;">
                    <p class="greeting" style="font-size: 18px; color: #333; margin-bottom: 20px; text-align: center;">
                      ¡Hola <strong>${user.username}</strong>! 👋
                    </p>

                    <p class="instructions" style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Para continuar, ingresa el siguiente código de 6 dígitos en la aplicación:
                    </p>

                    <div class="verification-code" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #d13727; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                      <div style="font-size: 36px; font-weight: bold; color: #d13727; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${resetCode}
                      </div>
                    </div>

                    <div class="steps" style="background: #fef6f0; border-left: 4px solid #f76c5e; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                      <h3 style="margin-top: 0; color: #d13727; font-size: 16px;">Pasos a seguir:</h3>
                      <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
                        <li>Copia el código de 6 dígitos que aparece arriba</li>
                        <li>Ingresa el código en la aplicación de Paulina Cultiva</li>
                        <li>Crea tu nueva contraseña</li>
                        <li>Listo! Ya podrás acceder a tu cuenta</li>
                      </ol>
                    </div>

                    <div class="security-note" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
                        🔒 <strong>Seguridad:</strong> Este código expirará en 1 hora. Si no solicitaste restablecer tu contraseña, ignora este email.
                      </p>
                    </div>
                  </div>

                  <div class="footer" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      ¡Cultivando sabores juntos con ❤️
                    </p>
                    <p style="margin: 10px 0 0; color: #999; font-size: 12px;">
                      © 2024 Paulina Cultiva • Todos los derechos reservados
                    </p>
                  </div>
                </div>

                <style>
                  @media only screen and (max-width: 600px) {
                    .container { margin: 10px; }
                    .header h1 { font-size: 28px; }
                    .verification-code { font-size: 28px; }
                    .verification-code div { letter-spacing: 6px; }
                  }
                </style>
              </body>
              </html>
            `;

            const mailOptions = {
                from: `"Paulina Cultiva" <${process.env.FROM_EMAIL}>`,
                to: cleanEmail,
                subject: 'Recupera tu contraseña - Paulina Cultiva',
                html: emailHTML
            };

            await transporter.sendMail(mailOptions);
  
        } catch (emailError) {
            console.error('❌ Error al enviar email:', emailError.message);
            return res.status(500).json({
                success: false,
                message: 'Error al enviar email. Por favor, intenta nuevamente.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Se ha enviado un código a tu email',
            resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
        });

    } catch (error) {
        console.error('Error en requestPasswordReset:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email y código son requeridos'
            });
        }

        const user = await User.findOne({ where: { email: email.trim().replace(/\s+/g, '') } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

      
        const cleanCode = code.toString().trim();
        const storedCode = user.passwordResetCode ? user.passwordResetCode.toString().trim() : '';

        if (cleanCode !== storedCode) {
            return res.status(400).json({
                success: false,
                message: 'Código incorrecto'
            });
        }

        if (user.passwordResetCodeExpires && new Date() > user.passwordResetCodeExpires) {
            return res.status(400).json({
                success: false,
                message: 'El código ha expirado. Solicita uno nuevo.'
            });
        }

        
        res.status(200).json({
            success: true,
            message: 'Código verificado correctamente',
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en verifyResetCode:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, código y nueva contraseña son requeridos'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const user = await User.findOne({ where: { email: email.trim().replace(/\s+/g, '') } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const cleanCode = code.toString().trim();
        const storedCode = user.passwordResetCode ? user.passwordResetCode.toString().trim() : '';

        if (cleanCode !== storedCode) {
            return res.status(400).json({
                success: false,
                message: 'Código inválido'
            });
        }

        if (user.passwordResetCodeExpires && new Date() > user.passwordResetCodeExpires) {
            return res.status(400).json({
                success: false,
                message: 'El código ha expirado'
            });
        }

        const samePassword = await bcrypt.compare(newPassword, user.password);
        if (samePassword) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña no puede ser igual a la actual'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await user.update({
            password: hashedPassword,
            passwordResetCode: null,
            passwordResetCodeExpires: null
        });

        
        res.status(200).json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Función para sincronizar el estado de los posts y comentarios con el estado del usuario
const syncUserContentStatus = async (userId, userStatus) => {
    try {
        const contentStatus = userStatus === 'activo' ? 'activo' : 'inactivo';

        // Actualizar todos los posts del usuario
        await Post.update(
            { estado: contentStatus },
            { where: { autorId: userId } }
        );

        // Actualizar todos los comentarios del usuario
        await Comment.update(
            { estado: contentStatus },
            { where: { autorId: userId } }
        );

                return { success: true, message: 'Contenido sincronizado correctamente' };
    } catch (error) {
        console.error('Error al sincronizar estado de contenido:', error);
        throw error;
    }
}

// Función para limpiar cuentas inactivas después de 1 minuto
const cleanupInactiveAccounts = async () => {
    try {
        
        // Fecha actual menos 1 minuto
        const oneMinuteAgo = new Date();
        oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

        // Buscar cuentas inactivas desde hace más de 1 minuto
        const inactiveUsers = await User.findAll({
            where: {
                estado: 'inactivo',
                updatedAt: {
                    [Op.lt]: oneMinuteAgo
                }
            }
        });

        if (inactiveUsers.length === 0) {
                        return { success: true, deletedCount: 0 };
        }

        
        let deletedCount = 0;

        for (const user of inactiveUsers) {
            try {
                // Eliminar todas las publicaciones y comentarios del usuario
                await Comment.destroy({ where: { autorId: user.id } });
                await Post.destroy({ where: { autorId: user.id } });

                // Eliminar otros datos relacionados (favoritos, etc.)
                await Favorite.destroy({ where: { userId: user.id } });

                // Eliminar notificaciones del usuario
                await Notification.destroy({ where: { userId: user.id } });

                // Finalmente eliminar el usuario
                await User.destroy({ where: { id: user.id } });

                deletedCount++;
                            } catch (error) {
                console.error(`❌ Error eliminando usuario ${user.id}:`, error);
            }
        }

        
        return {
            success: true,
            deletedCount,
            message: `Se eliminaron ${deletedCount} cuentas inactivas permanentemente`
        };
    } catch (error) {
        console.error('❌ Error en limpieza de cuentas inactivas:', error);
        throw error;
    }
}

// Programar limpieza automática cada 30 segundos para pruebas
const scheduleCleanup = () => {
    // Ejecutar limpieza inmediatamente al iniciar
    setTimeout(cleanupInactiveAccounts, 5000); // 5 segundos después de iniciar

    // Programar para ejecutar cada 30 segundos (30000 ms)
    setInterval(cleanupInactiveAccounts, 30000);

    }

// Función para reactivar cuenta con contraseña
const reactivateAccount = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        const cleanEmail = email.trim().replace(/\s+/g, '');

        // Buscar usuario inactivo
        const user = await User.findOne({
            where: {
                email: cleanEmail,
                estado: 'inactivo'
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró una cuenta desactivada con este email'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Reactivar cuenta y restaurar contenido
        await user.update({
            estado: 'activo',
            emailVerified: true
        });

        // Reactivar todos los posts del usuario
        await Post.update(
            { estado: 'activo' },
            { where: { autorId: user.id } }
        );

        // Reactivar todos los comentarios del usuario
        await Comment.update(
            { estado: 'activo' },
            { where: { autorId: user.id } }
        );

        
        res.json({
            success: true,
            message: 'Cuenta reactivada exitosamente. Ya puedes iniciar sesión.',
            reactivatedAt: new Date()
        });

    } catch (error) {
        console.error('Error en reactivación de cuenta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al reactivar la cuenta. Por favor, intenta nuevamente.'
        });
    }
}

// Función para eliminar cuenta permanentemente con contraseña
const permanentDeleteAccount = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        const cleanEmail = email.trim().replace(/\s+/g, '');

        // Buscar usuario inactivo
        const user = await User.findOne({
            where: {
                email: cleanEmail,
                estado: 'inactivo'
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró una cuenta desactivada con este email'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

    
        // Eliminar todos los comentarios del usuario
        await Comment.destroy({ where: { autorId: user.id } });

        // Eliminar todos los posts del usuario
        await Post.destroy({ where: { autorId: user.id } });

        // Eliminar favoritos y otros datos relacionados
        await Favorite.destroy({ where: { userId: user.id } });

        // Eliminar notificaciones del usuario
        await Notification.destroy({ where: { userId: user.id } });

        // Finalmente eliminar el usuario
        await User.destroy({ where: { id: user.id } });

        
        res.json({
            success: true,
            message: 'Cuenta eliminada permanentemente. Esta acción no se puede deshacer.',
            deletedAt: new Date()
        });

    } catch (error) {
        console.error('Error en eliminación permanente de cuenta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la cuenta permanentemente. Por favor, intenta nuevamente.'
        });
    }
}

// Función para obtener información de cuenta inactiva
const getInactiveAccountInfo = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        const cleanEmail = email.trim().replace(/\s+/g, '');

        const user = await User.findOne({
            where: {
                email: cleanEmail,
                estado: 'inactivo'
            },
            attributes: ['id', 'username', 'email', 'createdAt', 'updatedAt']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró una cuenta desactivada con este email'
            });
        }

        // Calcular minutos restantes basado en la última actualización (cuando se desactivó)
        const now = new Date();
        const deactivationDate = new Date(user.updatedAt);
        const minutesSinceDeactivation = Math.floor((now - deactivationDate) / (1000 * 60));
        const minutesRemaining = Math.max(0, 1 - minutesSinceDeactivation);

        res.json({
            success: true,
            account: {
                username: user.username,
                email: user.email,
                minutesRemaining
            }
        });

    } catch (error) {
        console.error('Error obteniendo información de cuenta inactiva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información de la cuenta.'
        });
    }
}

module.exports = {
    getActiveUsers,
    registerUser,
    verifyEmail,
    login,
    me,
    createAdmin,
    getActiveUserProfile,
    changePassword,
    deleteAccount,
    deactivateAccount,
    updateUsername,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    syncUserContentStatus,
    cleanupInactiveAccounts,
    scheduleCleanup,
    reactivateAccount,
    permanentDeleteAccount,
    getInactiveAccountInfo
};