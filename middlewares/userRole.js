const isAdmin = async(req, res, next) => {
    if (!req.user) {
        return res.status(401).send({
            message: "Authentication required",
        });
    }
    
    if (req.user.role === "admin") {
        next();
    } else {
        return res.status(403).send({
            message: "Permission denied. Admin access required.",
        });
    }
}

module.exports = {
    isAdmin
}