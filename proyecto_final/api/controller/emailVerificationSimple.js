const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Almacenamiento en memoria para códigos de verificación
const verificationCodes = {};
const lastSentTime = {}; // Para controlar el cooldown

// Configuración del transporter de Nodemailer para Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Usando app password para Gmail
  }
});

// Función para generar código de 6 dígitos
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Función para verificar si pasó el cooldown de 2 segundos
function canSendCode(email) {
  const lastTime = lastSentTime[email];
  if (!lastTime) return true;

  const now = Date.now();
  const timeDiff = now - lastTime;
  const cooldownMs = 2000; // 2 segundos

  return timeDiff >= cooldownMs;
}

// Controlador para enviar código de verificación
async function sendVerificationCode(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requerido'
      });
    }

    // Verificar cooldown
    if (!canSendCode(email)) {
      return res.status(429).json({
        success: false,
        message: 'Debes esperar 2 segundos antes de solicitar otro código'
      });
    }

    // Generar código
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // Expira en 10 minutos

    // Guardar código en memoria
    verificationCodes[email] = {
      code,
      expiresAt,
      attempts: 0
    };

    // Si hay un registro temporal pendiente (flujo de registro), actualizarlo también
    if (global.tempRegistrations && global.tempRegistrations.has(email)) {
      const tempData = global.tempRegistrations.get(email);
      tempData.verificationCode = code;
      tempData.timestamp = Date.now(); // Renovar timestamp
      global.tempRegistrations.set(email, tempData);
    }

    // Actualizar tiempo de último envío
    lastSentTime[email] = Date.now();

    // Diseño del email siguiendo la estética de la página
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Email - Paulina Cultiva</title>
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
            background: linear-gradient(135deg, #d13727, #8b1e14);
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

          .verification-code {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            color: #d13727;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            padding: 20px;
            border-radius: 12px;
            margin: 30px 0;
            display: inline-block;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            box-shadow: 0 4px 12px rgba(209, 55, 39, 0.2);
            border: 2px solid #d13727;
            font-family: 'Courier New', monospace;
          }

          .instructions {
            margin: 20px 0;
            font-size: 16px;
            color: #555;
          }

          .footer {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
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

            .verification-code {
              font-size: 28px;
              letter-spacing: 6px;
              padding: 15px;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div class="header" style="background: linear-gradient(135deg, #d13727, #8b1e14); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="font-size: 32px; margin: 0; font-weight: bold;">🌱 Paulina Cultiva</h1>
            <p style="font-size: 18px; margin: 10px 0 0; opacity: 0.9;">Verificación de Email</p>
          </div>

          <div class="content" style="padding: 40px 20px;">
            <p class="greeting" style="font-size: 18px; color: #333; margin-bottom: 20px; text-align: center;">
              ¡Hola! 👋
            </p>

            <p class="instructions" style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px; text-align: center;">
              Gracias por registrarte en Paulina Cultiva. Para completar tu registro, ingresa el siguiente código de 6 dígitos en la aplicación:
            </p>

            <div class="verification-code" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #d13727; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #d13727; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>

            <div class="steps" style="background: #fef6f0; border-left: 4px solid #f76c5e; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin-top: 0; color: #d13727; font-size: 16px;">Pasos a seguir:</h3>
              <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
                <li>Copia el código de 6 dígitos que aparece arriba</li>
                <li>Ingresa el código en la aplicación de Paulina Cultiva</li>
                <li>Listo! Tu cuenta quedará verificada y activa</li>
                <li>Comienza a compartir tus recetas y sabores</li>
              </ol>
            </div>

            <div class="security-note" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
                🔒 <strong>Seguridad:</strong> Este código expirará en 10 minutos. Si no creaste esta cuenta, ignora este email.
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
      </body>
      </html>
    `;

    // Configurar email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Código de Verificación - Paulina Cultiva',
      html: emailHTML
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    // En desarrollo, mostrar código en consola y devolverlo
    if (process.env.NODE_ENV !== 'production') {
    }

    res.json({
      success: true,
      message: 'Código de verificación enviado correctamente',
      verificationCode: process.env.NODE_ENV !== 'production' ? code : undefined
    });

  } catch (error) {
    console.error('Error al enviar código de verificación:', error);

    res.status(500).json({
      success: false,
      message: 'Error al enviar el código de verificación'
    });
  }
}

// Controlador para verificar el código
function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email y código requeridos'
      });
    }

    const storedData = verificationCodes[email];

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'Código no válido o expirado'
      });
    }

    // Verificar expiración
    if (Date.now() > storedData.expiresAt) {
      delete verificationCodes[email];
      delete lastSentTime[email];
      return res.status(400).json({
        success: false,
        message: 'Código expirado. Solicita uno nuevo'
      });
    }

    // Limitar intentos
    storedData.attempts = (storedData.attempts || 0) + 1;
    if (storedData.attempts > 5) {
      delete verificationCodes[email];
      delete lastSentTime[email];
      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Solicita un nuevo código'
      });
    }

    // Verificar código
    if (storedData.code === code) {
      delete verificationCodes[email];
      delete lastSentTime[email];

      return res.json({
        success: true,
        message: 'Email verificado correctamente'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Código incorrecto'
      });
    }

  } catch (error) {
    console.error('Error al verificar email:', error);

    res.status(500).json({
      success: false,
      message: 'Error al verificar el código'
    });
  }
}

// Controlador para verificar transporter
async function verifyEmailTransporter(req, res) {
  try {
    await transporter.verify();
    res.json({
      success: true,
      message: 'Configuración de email verificada correctamente'
    });
  } catch (error) {
    console.error('Error verificando configuración de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la configuración de email'
    });
  }
}

module.exports = {
  sendVerificationCode,
  verifyEmail,
  verifyEmailTransporter
};