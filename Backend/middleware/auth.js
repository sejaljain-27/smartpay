import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({ error: "Missing authorization token" });
        }

        if (!JWT_SECRET) {
            return res.status(500).json({ error: "JWT secret not configured" });
        }

        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { id: payload.userId };
        return next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
