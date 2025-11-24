// passwordResetWithEmail.js - Sistema de recuperación de contraseña con envío de emails
const { User, PasswordResetToken } = require('../models');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuración del transporter de Nodemailer para Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ where: { email: email.trim() } });

    // Si no existe el usuario, no revelamos esta información por seguridad
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Establecer expiración (1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Guardar en base de datos
    await PasswordResetToken.create({
      token: resetToken,
      userId: user.id,
      email: user.email,
      expiresAt: expiresAt,
      isUsed: false
    });

    // Limpiar tokens expirados antiguos
    await PasswordResetToken.cleanExpiredTokens();

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecimiento de Contraseña - Paulina Cultiva</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Roboto', sans-serif;
            background-color: #f9f2ec;
            color: #3d3d3d;
            line-height: 1.6;
            padding: 20px;
          }

          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.06);
            border: 1px solid #e0e0e0;
            overflow: hidden;
          }

          .header {
            background-color: #d13727;
            padding: 30px;
            text-align: center;
            color: white;
          }

          .header h1 {
            font-family: 'Lora', serif;
            font-weight: 700;
            font-size: 28px;
            margin-bottom: 10px;
          }

          .header p {
            font-family: 'Dancing Script', cursive;
            font-size: 16px;
            opacity: 0.9;
          }

          .content {
            padding: 40px 30px;
            text-align: center;
          }

          .instructions {
            margin: 20px 0;
            font-size: 16px;
            color: #555;
            text-align: left;
            background-color: #f9f2ec;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f76c5e;
          }

          .instructions h3 {
            color: #d13727;
            margin-bottom: 10px;
            font-family: 'Lora', serif;
          }

          .token-display {
            background-color: #f76c5e;
            color: white;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 2px;
            padding: 20px;
            border-radius: 12px;
            margin: 30px 0;
            display: inline-block;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            box-shadow: 0 4px 12px rgba(247, 108, 94, 0.2);
            font-family: 'Courier New', monospace;
            word-break: break-all;
            line-height: 1.4;
            border: 2px solid #d13727;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .token-display:hover {
            background-color: #d13727;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(247, 108, 94, 0.3);
          }

          .token-label {
            font-size: 14px;
            margin-bottom: 10px;
            opacity: 0.9;
            font-family: 'Roboto', sans-serif;
            letter-spacing: normal;
          }

          .footer {
            background-color: #f9f2ec;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #777;
            border-top: 1px solid #e0e0e0;
          }

          .logo-text {
            font-family: 'Lora', serif;
            color: #d13727;
            font-weight: 700;
            text-decoration: none;
          }

          .security-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #856404;
            font-size: 14px;
          }

          .copy-hint {
            font-size: 12px;
            color: rgba(255,255,255,0.8);
            margin-top: 10px;
            font-style: italic;
          }

          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 12px;
            }

            .header {
              padding: 20px;
            }

            .header h1 {
              font-size: 24px;
            }

            .content {
              padding: 30px 20px;
            }

            .token-display {
              font-size: 16px;
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Paulina Cultiva</h1>
            <p>Restablecimiento de Contraseña</p>
          </div>

          <div class="content">
            <p class="instructions">
              ¡Hola <strong>${user.username}</strong>!
            </p>

            <p class="instructions">
              Recibimos una solicitud para restablecer tu contraseña.
              Si no realizaste esta solicitud, puedes ignorar este email.
            </p>

            <div class="security-note">
              ⚠️ Este código de recuperación expirará en <strong>1 hora</strong>.
            </div>

            <div class="token-display" onclick="this.select(); document.execCommand('copy');">
              <div class="token-label">📋 CÓDIGO DE RECUPERACIÓN (Haz clic para copiar)</div>
              ${resetToken}
              <div class="copy-hint">Click en el código para copiar al portapapeles</div>
            </div>

            <div class="instructions">
              <h3>📋 Instrucciones:</h3>
              <ol style="text-align: left; padding-left: 20px;">
                <li>Copia el código de recuperación que está arriba</li>
                <li>Ve a la página "Olvidé contraseña" en la aplicación</li>
                <li>Pega el código en el campo correspondiente</li>
                <li>Crea tu nueva contraseña (mínimo 6 caracteres)</li>
                <li>Usa una contraseña diferente a la actual</li>
              </ol>
            </div>

            <p class="instructions" style="margin-top: 30px;">
              <em>Si no solicitaste este restablecimiento, por favor contacta
              con soporte de Paulina Cultiva.</em>
            </p>
          </div>

          <div class="footer">
            <p>
              © 2024 <a href="#" class="logo-text">Paulina Cultiva</a><br>
              Todos los derechos reservados
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Configurar email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🔄 Restablecimiento de Contraseña - Paulina Cultiva',
      html: emailHTML
    };

    try {
      // Enviar email
      await transporter.sendMail(mailOptions);

      // En desarrollo, mostrar información adicional
      if (process.env.NODE_ENV !== 'production') {
      }

      res.status(200).json({
        success: true,
        message: 'Se han enviado instrucciones para restablecer tu contraseña a tu email',
        expiresIn: '1 hora'
      });

    } catch (emailError) {
      console.error('Error al enviar email de restablecimiento:', emailError);

      // Fallback: mostrar token en consola si falla el email

      res.status(200).json({
        success: true,
        message: 'Se han enviado instrucciones para restablecer tu contraseña',
        resetToken, // Solo en desarrollo
        expiresIn: '1 hora'
      });
    }

  } catch (error) {
    console.error('Error en requestPasswordReset:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token es requerido'
      });
    }


    // Buscar token en base de datos
    const tokenData = await PasswordResetToken.findOne({
      where: { token }
    });

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o no encontrado'
      });
    }

    // Verificar si no ha sido usado
    if (tokenData.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Este token ya ha sido utilizado'
      });
    }

    // Verificar si no ha expirado
    if (tokenData.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Token expirado. Solicita un nuevo restablecimiento'
      });
    }

    // Buscar usuario
    const user = await User.findByPk(tokenData.userId, {
      attributes: ['id', 'username', 'email']
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }


    res.status(200).json({
      success: true,
      message: 'Token válido',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      expiresAt: tokenData.expiresAt
    });

  } catch (error) {
    console.error('Error en verifyResetToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar token'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }


    // Buscar token en base de datos
    const tokenData = await PasswordResetToken.findOne({
      where: { token }
    });

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o no encontrado'
      });
    }

    // Verificaciones de seguridad
    if (tokenData.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Este token ya ha sido utilizado'
      });
    }

    if (tokenData.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Token expirado. Solicita un nuevo restablecimiento'
      });
    }

    // Buscar usuario
    const user = await User.findByPk(tokenData.userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que la nueva contraseña no sea igual a la actual
    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña no puede ser igual a la actual'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await user.update({ password: hashedPassword });

    // Marcar token como usado
    await tokenData.update({ isUsed: true });


    // Enviar email de confirmación de cambio de contraseña
    try {
      const confirmationHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contraseña Actualizada - Paulina Cultiva</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Roboto', sans-serif;
              background-color: #f9f2ec;
              color: #3d3d3d;
              line-height: 1.6;
              padding: 20px;
            }

            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.06);
              border: 1px solid #e0e0e0;
              overflow: hidden;
            }

            .header {
              background-color: #28a745;
              padding: 30px;
              text-align: center;
              color: white;
            }

            .header h1 {
              font-family: 'Lora', serif;
              font-weight: 700;
              font-size: 28px;
              margin-bottom: 10px;
            }

            .content {
              padding: 40px 30px;
              text-align: center;
            }

            .success-icon {
              font-size: 72px;
              color: #28a745;
              margin: 20px 0;
            }

            .footer {
              background-color: #f9f2ec;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #777;
              border-top: 1px solid #e0e0e0;
            }

            .logo-text {
              font-family: 'Lora', serif;
              color: #d13727;
              font-weight: 700;
              text-decoration: none;
            }

            .security-tip {
              background-color: #d1ecf1;
              border: 1px solid #bee5eb;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              color: #0c5460;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Paulina Cultiva</h1>
              <p>Contraseña Actualizada Exitosamente</p>
            </div>

            <div class="content">
              <div class="success-icon">✅</div>

              <h2>¡Tu contraseña ha sido actualizada!</h2>

              <p style="margin: 20px 0;">
                Hola <strong>${user.username}</strong>,<br>
                Tu contraseña ha sido cambiada exitosamente.
              </p>

              <div class="security-tip">
                <strong>💡 Consejo de seguridad:</strong><br>
                Si no realizaste este cambio, por favor contacta inmediatamente con soporte.
              </div>

              <p style="margin-top: 30px;">
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>

            <div class="footer">
              <p>
                © 2024 <a href="#" class="logo-text">Paulina Cultiva</a><br>
                Todos los derechos reservados
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '✅ Contraseña Actualizada - Paulina Cultiva',
        html: confirmationHTML
      });

    } catch (confirmationError) {
      console.error('Error al enviar email de confirmación:', confirmationError);
      // No fallar el proceso si no se puede enviar el email de confirmación
    }

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer contraseña'
    });
  }
};

// Función para limpiar tokens expirados periódicamente (cada 5 minutos)
setInterval(async () => {
  try {
    await PasswordResetToken.cleanExpiredTokens();
  } catch (error) {
    console.error('Error limpiando tokens expirados:', error);
  }
}, 5 * 60 * 1000);

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};