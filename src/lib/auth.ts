const jwt = require('jsonwebtoken')

function authJWT(req: any, res: any, next: Function) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.toLowerCase().startsWith('bearer')
    && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  const secret = process.env.TOKEN_SECRET;
  jwt.verify(token, secret as string, (err: any, user: any) => {
    if (err) {
      console.error("JWT VERIFY ERROR", req);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

export {
  authJWT as default
}