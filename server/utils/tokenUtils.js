import jwt from 'jsonwebtoken';

export const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'spendwise_super_secure_jwt_secret_key_2026_finance',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency || 'INR',
        monthlyBudget: user.monthlyBudget || 50000,
        createdAt: user.createdAt,
      },
    });
};
