const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../config/database');
const bcrypt = require('bcrypt');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar usuario por email de Google
        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [profile.emails[0].value]
        );

        let user;

        if (result.rows.length > 0) {
          // Usuario existe
          user = result.rows[0];

          // Actualizar google_id si no lo tiene
          if (!user.google_id) {
            await pool.query(
              'UPDATE users SET google_id = $1 WHERE id = $2',
              [profile.id, user.id]
            );
            user.google_id = profile.id;
          }
        } else {
          // Crear nuevo usuario
          const passwordHash = await bcrypt.hash(
            Math.random().toString(36),
            10
          ); // Password random (no se usará)

          const insertResult = await pool.query(
            `INSERT INTO users (email, password_hash, name, google_id, is_active, role)
             VALUES ($1, $2, $3, $4, true, 'customer')
             RETURNING *`,
            [
              profile.emails[0].value,
              passwordHash,
              profile.displayName,
              profile.id,
            ]
          );

          user = insertResult.rows[0];
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;