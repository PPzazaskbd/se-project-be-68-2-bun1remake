const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const {
  EMAIL_THEME,
  buildEmailShell,
  buildEmailButton,
  buildEmailCard,
  buildEmailFooter
} = require('../utils/emailTheme');
const {
  generateOtpCode,
  getOtpConfig,
  getOtpExpiryDate,
  getOtpResendAvailableDate,
  hashOtpCode,
  normalizeOtpValue
} = require('../utils/otp');

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL ||
  'https://fe-project-68-bun1-return.vercel.app';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getRequestCorrelationId(req) {
  const candidates = [
    req.headers['x-request-id'],
    req.headers['x-correlation-id'],
    req.headers['x-vercel-id'],
    req.headers['x-amzn-trace-id']
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const firstValue = String(candidate[0] || '').trim();
      if (firstValue) {
        return firstValue;
      }
      continue;
    }

    const value = String(candidate || '').trim();
    if (value) {
      return value;
    }
  } 

  return 'n/a';
}

function hashEmailForLog(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return 'n/a';
  }

  return crypto
    .createHash('sha256')
    .update(normalizedEmail)
    .digest('hex')
    .slice(0, 12);
}

function logOtpEmailFailure(action, req, email, error) {
  console.error(
    '[otp-email] send failure',
    JSON.stringify({
      event: 'otp_email_send_failed',
      action,
      requestId: getRequestCorrelationId(req),
      emailHash: hashEmailForLog(email),
      errorName: error?.name || 'Error',
      errorCode: error?.code || null,
      responseCode: error?.responseCode || null,
      command: error?.command || null,
      message: error?.message || 'Unknown email send error'
    })
  );
}

function trimValue(value) {
  return String(value || '').trim();
}

function isUserVerified(user) {
  return user?.isVerified !== false;
}

function formatDate(value) {
  return value instanceof Date ? value.toISOString() : null;
}

function getOtpResponseData(user) {
  return {
    email: user.email,
    isVerified: isUserVerified(user),
    otpExpiresAt: formatDate(user.otpExpiresAt),
    resendAvailableAt: formatDate(user.otpResendAvailableAt)
  };
}

function clearOtpFields(user) {
  user.otpCodeHash = null;
  user.otpExpiresAt = null;
  user.otpResendAvailableAt = null;
  user.otpAttemptCount = 0;
}

function assignOtpToUser(user, otpCode) {
  user.otpCodeHash = hashOtpCode(otpCode);
  user.otpExpiresAt = getOtpExpiryDate();
  user.otpResendAvailableAt = getOtpResendAvailableDate();
  user.otpAttemptCount = 0;
}

function buildOtpEmailHtml({ name, otpCode, expireMinutes }) {
  return buildEmailShell(
    'Verify Your Email',
    `
      <p style="font-size: 16px; color: ${EMAIL_THEME.ink};">Hi <strong>${name || 'there'}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_THEME.inkSoft};">
        Use the one-time password below to complete your Hotel Booking registration.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <div style="display: inline-block; padding: 14px 24px; font-size: 32px; letter-spacing: 8px; font-weight: bold; background-color: ${EMAIL_THEME.surfaceAlt}; border: 1px solid ${EMAIL_THEME.border}; border-radius: 8px; color: ${EMAIL_THEME.primary};">
          ${otpCode}
        </div>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_THEME.inkSoft};">
        This code expires in <strong>${expireMinutes} minutes</strong>.
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: ${EMAIL_THEME.textMuted};">
        If you did not try to create an account, you can ignore this email.
      </p>
      <p style="text-align: center; margin: 25px 0;">
        ${buildEmailButton('Open Verification Page', `${FRONTEND_BASE_URL}/verify-otp`)}
      </p>
      ${buildEmailFooter()}
    `
  );
}

function buildWelcomeEmailHtml(name) {
  return buildEmailShell(
    'Welcome to Hotel Booking',
    `
      <p style="font-size: 16px; color: ${EMAIL_THEME.ink};">Dear <strong>${name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_THEME.inkSoft};">
        Your email has been verified and your account is now active.
      </p>
      ${buildEmailCard(`
        <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: ${EMAIL_THEME.inkSoft};">You can now:</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.8; color: ${EMAIL_THEME.inkSoft};">
          <li>Browse our collection of hotels</li>
          <li>Make reservations and manage your bookings</li>
          <li>Access your account securely</li>
        </ul>
      `)}
      <p style="text-align: center; margin: 25px 0;">
        ${buildEmailButton('Log In', `${FRONTEND_BASE_URL}/login`)}
      </p>
      ${buildEmailFooter()}
    `
  );
}

function buildLoginNotificationHtml(user) {
  return buildEmailShell(
    'Login Notification',
    `
      <p style="font-size: 16px; color: ${EMAIL_THEME.ink};">Hi <strong>${user.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_THEME.inkSoft};">
        We detected a new login to your Hotel Booking account.
      </p>
      ${buildEmailCard(`
        <p style="margin: 0; font-size: 14px; color: ${EMAIL_THEME.inkSoft};">
          <strong>Login Time:</strong> ${new Date().toLocaleString()}
        </p>
      `)}
      <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_THEME.inkSoft};">
        If this was not you, please secure your account immediately.
      </p>
      <p style="text-align: center; margin: 25px 0;">
        ${buildEmailButton('Secure Account', `${FRONTEND_BASE_URL}/login`)}
      </p>
      ${buildEmailFooter('Need help right away?', 'Contact Support')}
    `
  );
}

function buildProfileData(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    telephone: user.telephone,
    role: user.role,
    isVerified: isUserVerified(user),
    defaultGuestsAdult: user.defaultGuestsAdult ?? 1,
    defaultGuestsChild: user.defaultGuestsChild ?? 0,
    createdAt: user.createdAt
  };
}

function getStartedAt() {
  return process.hrtime.bigint();
}

function logApiTiming(action, statusCode, startedAt) {
  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  console.log(`[timing] ${action} ${statusCode} ${elapsedMs.toFixed(1)}ms`);
}

function timedJson(res, statusCode, payload, action, startedAt) {
  logApiTiming(action, statusCode, startedAt);
  return res.status(statusCode).json(payload);
}

function sendTokenResponse(
  user,
  statusCode,
  res,
  existingToken = null,
  timingMeta = null
) {
  const token = existingToken || user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  if (timingMeta?.action && timingMeta?.startedAt) {
    logApiTiming(timingMeta.action, statusCode, timingMeta.startedAt);
  }

  return res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        isVerified: isUserVerified(user),
        defaultGuestsAdult: user.defaultGuestsAdult ?? 1,
        defaultGuestsChild: user.defaultGuestsChild ?? 0
      }
    });
}

async function sendOtpEmail(user, otpCode) {
  const { expireMinutes } = getOtpConfig();

  return sendEmail(
    user.email,
    'Verify your Hotel Booking account',
    buildOtpEmailHtml({
      name: user.name,
      otpCode,
      expireMinutes
    })
  );
}

function sendWelcomeEmail(user) {
  void sendEmail(
    user.email,
    'Welcome to Hotel Booking!',
    buildWelcomeEmailHtml(user.name)
  ).catch((error) => {
    console.error('Welcome email failed:', error.message);
  });
}

function sendLoginNotification(user) {
  void sendEmail(
    user.email,
    'New Login to Your Account',
    buildLoginNotificationHtml(user)
  ).catch((error) => {
    console.error('Login notification email failed:', error.message);
  });
}

exports.registerInitiate = async (req, res) => {
  try {
    const name = trimValue(req.body.name);
    const telephone = trimValue(req.body.telephone);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name || !telephone || !email || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Please provide all required fields'
      });
    }

    let user = await User.findOne({ email }).select(
      '+currentToken +otpCodeHash +otpExpiresAt +otpResendAvailableAt +otpAttemptCount'
    );

    if (user && isUserVerified(user)) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account with this email already exists.'
      });
    }

    const otpCode = generateOtpCode();

    if (!user) {
      user = new User({
        name,
        telephone,
        email,
        password,
        isVerified: false,
        currentToken: null
      });
    } else {
      user.name = name;
      user.telephone = telephone;
      user.password = password;
      user.isVerified = false;
      user.currentToken = null;
      user.otpVerifiedAt = null;
    }

    assignOtpToUser(user, otpCode);

    await user.save();

    try {
      await sendOtpEmail(user, otpCode);
    } catch (error) {
      logOtpEmailFailure('api.auth.registerInitiate', req, user.email, error);
      return res.status(502).json({
        success: false,
        code: 'OTP_EMAIL_SEND_FAILED',
        message: 'Could not send OTP email right now.',
        data: getOtpResponseData(user)
      });
    }

    return res.status(202).json({
      success: true,
      message: 'OTP sent to email.',
      data: getOtpResponseData(user)
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account with this email already exists.'
      });
    }

    if (err.name === 'ValidationError') {
      const fields = Object.fromEntries(
        Object.entries(err.errors).map(([key, value]) => [key, value.message])
      );

      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Registration initiation failed.',
        fields
      });
    }

    console.error('registerInitiate error:', err);

    return res.status(500).json({
      success: false,
      code: 'REGISTER_INITIATE_FAILED',
      message: 'Registration initiation failed.'
    });
  }
};

exports.register = exports.registerInitiate;

exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = normalizeOtpValue(req.body.otp);
    const { maxAttempts } = getOtpConfig();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Email and OTP are required.'
      });
    }

    const user = await User.findOne({ email }).select(
      '+otpCodeHash +otpExpiresAt +otpResendAvailableAt +otpAttemptCount'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'PENDING_REGISTRATION_NOT_FOUND',
        message: 'No pending registration found for this email.'
      });
    }

    if (isUserVerified(user)) {
      return res.status(200).json({
        success: true,
        verified: true,
        signInReady: true,
        data: {
          email: user.email,
          isVerified: true
        }
      });
    }

    const now = new Date();

    if (!user.otpCodeHash || !user.otpExpiresAt || user.otpExpiresAt <= now) {
      return res.status(410).json({
        success: false,
        code: 'OTP_EXPIRED',
        message: 'OTP has expired. Please request a new code.',
        data: {
          email: user.email,
          resendAvailableAt: formatDate(user.otpResendAvailableAt)
        }
      });
    }

    if (user.otpAttemptCount >= maxAttempts) {
      return res.status(429).json({
        success: false,
        code: 'OTP_ATTEMPTS_EXCEEDED',
        message: 'Too many incorrect OTP attempts. Please request a new code.',
        data: {
          email: user.email,
          resendAvailableAt: formatDate(user.otpResendAvailableAt)
        }
      });
    }

    const otpHash = hashOtpCode(otp);

    if (otpHash !== user.otpCodeHash) {
      user.otpAttemptCount += 1;
      await user.save({ validateBeforeSave: false });

      const attemptsRemaining = Math.max(maxAttempts - user.otpAttemptCount, 0);

      if (attemptsRemaining === 0) {
        return res.status(429).json({
          success: false,
          code: 'OTP_ATTEMPTS_EXCEEDED',
          message: 'Too many incorrect OTP attempts. Please request a new code.',
          data: {
            email: user.email,
            attemptsRemaining,
            resendAvailableAt: formatDate(user.otpResendAvailableAt)
          }
        });
      }

      return res.status(400).json({
        success: false,
        code: 'INVALID_OTP',
        message: 'Incorrect OTP.',
        data: {
          email: user.email,
          attemptsRemaining
        }
      });
    }

    user.isVerified = true;
    user.otpVerifiedAt = new Date();
    clearOtpFields(user);
    await user.save({ validateBeforeSave: false });

    sendWelcomeEmail(user);

    return res.status(200).json({
      success: true,
      verified: true,
      signInReady: true,
      data: {
        email: user.email,
        isVerified: true
      }
    });
  } catch (err) {
    console.error('verifyOtp error:', err);

    return res.status(500).json({
      success: false,
      code: 'OTP_VERIFY_FAILED',
      message: 'Could not verify OTP right now.'
    });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Email is required.'
      });
    }

    const user = await User.findOne({ email }).select(
      '+otpCodeHash +otpExpiresAt +otpResendAvailableAt +otpAttemptCount'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'PENDING_REGISTRATION_NOT_FOUND',
        message: 'No pending registration found for this email.'
      });
    }

    if (isUserVerified(user)) {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_VERIFIED',
        message: 'This account is already verified.'
      });
    }

    const now = new Date();

    if (user.otpResendAvailableAt && user.otpResendAvailableAt > now) {
      return res.status(429).json({
        success: false,
        code: 'OTP_RESEND_COOLDOWN',
        message: 'Please wait before requesting another OTP.',
        data: {
          email: user.email,
          resendAvailableAt: formatDate(user.otpResendAvailableAt)
        }
      });
    }

    const otpCode = generateOtpCode();
    assignOtpToUser(user, otpCode);
    await user.save({ validateBeforeSave: false });

    try {
      await sendOtpEmail(user, otpCode);
    } catch (error) {
      logOtpEmailFailure('api.auth.resendOtp', req, user.email, error);
      return res.status(502).json({
        success: false,
        code: 'OTP_EMAIL_SEND_FAILED',
        message: 'Could not send OTP email right now.',
        data: getOtpResponseData(user)
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP resent.',
      data: getOtpResponseData(user)
    });
  } catch (err) {
    console.error('resendOtp error:', err);

    return res.status(500).json({
      success: false,
      code: 'OTP_RESEND_FAILED',
      message: 'Could not resend OTP right now.'
    });
  }
};

exports.login = async (req, res) => {
  const startedAt = getStartedAt();

  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return timedJson(res, 400, {
        success: false,
        message: 'Please provide email and password'
      }, 'api.auth.login', startedAt);
    }

    const user = await User.findOne({ email }).select(
      '+password +currentToken +otpResendAvailableAt'
    );

    if (!user) {
      return timedJson(res, 401, {
        success: false,
        message: 'Invalid credentials'
      }, 'api.auth.login', startedAt);
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return timedJson(res, 401, {
        success: false,
        message: 'Invalid credentials'
      }, 'api.auth.login', startedAt);
    }

    if (!isUserVerified(user)) {
      return timedJson(res, 403, {
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in.',
        data: {
          email: user.email,
          resendAvailableAt: formatDate(user.otpResendAvailableAt)
        }
      }, 'api.auth.login', startedAt);
    }

    const token = user.getSignedJwtToken();
    user.currentToken = token;
    await user.save({ validateBeforeSave: false });

    sendLoginNotification(user);

    return sendTokenResponse(user, 200, res, token, {
      action: 'api.auth.login',
      startedAt
    });
  } catch (err) {
    console.error('login error:', err);

    return timedJson(res, 500, {
      success: false,
      message: 'Server error'
    }, 'api.auth.login', startedAt);
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);

  return res.status(200).json({
    success: true,
    data: buildProfileData(user)
  });
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, defaultGuestsAdult, defaultGuestsChild } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Name is required'
        });
      }

      user.name = trimmedName;
    }

    if (defaultGuestsAdult !== undefined) {
      const parsedAdult = Number(defaultGuestsAdult);

      if (!Number.isFinite(parsedAdult) || parsedAdult < 1) {
        return res.status(400).json({
          success: false,
          message: 'At least one adult guest is required'
        });
      }

      user.defaultGuestsAdult = parsedAdult;
    }

    if (defaultGuestsChild !== undefined) {
      const parsedChild = Number(defaultGuestsChild);

      if (!Number.isFinite(parsedChild) || parsedChild < 0) {
        return res.status(400).json({
          success: false,
          message: 'Child guest count cannot be negative'
        });
      }

      user.defaultGuestsChild = parsedChild;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: buildProfileData(user)
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const fields = Object.fromEntries(
        Object.entries(err.errors).map(([key, value]) => [key, value.message])
      );

      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Profile update failed.',
        fields
      });
    }

    console.error('updateMe error:', err);

    return res.status(500).json({
      success: false,
      code: 'PROFILE_UPDATE_FAILED',
      message: 'Could not update profile right now.'
    });
  }
};

exports.logout = async (req, res) => {
  await User.updateOne(
    { _id: req.user.id },
    {
      isLoggedIn: false,
      currentToken: null
    }
  );

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('updateUserRole error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
