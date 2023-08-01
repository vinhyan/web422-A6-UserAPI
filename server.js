const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const userService = require('./user-service.js');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// JSON Web Tolen Setup
let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

// Configure JWT options
let jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: process.env.JWT_SECRET,
};

let strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
  console.log('payload received', jwt_payload);

  if (jwt_payload) {
    next(null, { _id: jwt_payload._id, userName: jwt_payload.userName });
  } else {
    next(null, false);
  }
});

// Tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());

app.post('/api/user/register', (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.post('/api/user/login', (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      let payload = {
        _id: user._id,
        userName: user.userName,
      };

      //"sign" the JWT with the secret and put the value in the token variable
      let token = jwt.sign(payload, jwtOptions.secretOrKey);
      res.json({ message: 'login successful', token: token });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.get(
  '/api/user/favourites',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.put(
  '/api/user/favourites/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.delete(
  '/api/user/favourites/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.get(
  '/api/user/history',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .getHistory(req.user._id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.put(
  '/api/user/history/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .addHistory(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.delete(
  '/api/user/history/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService
      .removeHistory(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log('API listening on: ' + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log('unable to start the server: ' + err);
    process.exit();
  });
